import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePixPayment } from '@/lib/pix'

export async function GET(request) {
  const { getAdminFromRequest, getUserFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  const user = getUserFromRequest(request)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const mine = searchParams.get('mine')

  if (mine && user) {
    const orders = await prisma.order.findMany({
      where: { userId: user.id, ...(status ? { status } : {}) },
      include: { 
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  }

  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const where = status ? { status } : {}
  const orders = await prisma.order.findMany({
    where,
    include: { 
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(request) {
  try {
    const { getUserFromRequest } = await import('@/lib/auth')
    const user = getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Faça login para comprar' }, { status: 401 })

    const body = await request.json()
    const { customerName, customerEmail, customerWhats, items, couponCode } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item no pedido' }, { status: 400 })
    }

    // Validar e buscar produtos
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true }
    })

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Um ou mais produtos não encontrados' }, { status: 404 })
    }

    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    // Calcular totais
    let subtotal = 0
    const orderItemsData = items.map(item => {
      const product = productMap[item.productId]
      const qty = Math.max(1, item.quantity || 1)
      const price = product.price * qty
      subtotal += price
      return {
        productId: product.id,
        quantity: qty,
        price: product.price,
      }
    })

    let total = subtotal
    let discount = 0
    let couponId = null

    // Validar cupom se informado
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: 'Cupom inválido' }, { status: 400 })
      }
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
      }
      if (subtotal < coupon.minPurchase) {
        return NextResponse.json({ error: 'Valor mínimo do cupom não atingido' }, { status: 400 })
      }

      if (coupon.discountType === 'percentage') {
        discount = subtotal * (coupon.discount / 100)
      } else {
        discount = coupon.discount
      }
      if (discount > subtotal) discount = subtotal
      couponId = coupon.id

      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      })
    }

    const settings = await prisma.setting.findMany()
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

    // Criar pedido com múltiplos itens
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerName,
        customerEmail,
        customerWhats: customerWhats || '',
        total: total - discount,
        discount,
        couponId,
        status: 'pending',
        paymentMethod: 'pix',
        productId: orderItemsData[0]?.productId || 1,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: { product: true }
        }
      },
    })

    // Gerar PIX (usando o primeiro item para identificação)
    const pixData = await generatePixPayment(
      { ...order, productName: order.items[0]?.product?.name || 'Pedido StreamCartoon' },
      settingsMap.mercadopago_token
    )

    await prisma.order.update({
      where: { id: order.id },
      data: {
        pixCode: pixData.pixCode,
        pixQrCode: pixData.qrCode,
        paymentId: pixData.txid,
      },
    })

    return NextResponse.json({
      id: order.id,
      pixCode: pixData.pixCode,
      pixQrCode: pixData.qrCode,
      expiration: pixData.expiration,
      total: total - discount,
      items: order.items.map(i => ({
        productName: i.product.name,
        quantity: i.quantity,
        price: i.price,
      })),
    })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json({ error: 'Erro interno: ' + error.message }, { status: 500 })
  }
}
