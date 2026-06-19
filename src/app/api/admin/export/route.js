import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'orders'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let csv = ''
  let filename = ''

  if (type === 'orders') {
    const where = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: { product: true, user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    })

    csv = [
      'ID,Cliente,Email,WhatsApp,Produto,Quantidade,Total,Desconto,Método Pagamento,Status,Código Entregue,Data',
      ...orders.map(o =>
        [
          o.id,
          `"${o.customerName}"`,
          o.customerEmail,
          o.customerWhats,
          `"${o.product?.name || ''}"`,
          o.quantity,
          o.total.toFixed(2),
          o.discount.toFixed(2),
          o.paymentMethod,
          o.status,
          o.deliveredCode,
          new Date(o.createdAt).toLocaleString('pt-BR'),
        ].join(',')
      ),
    ].join('\n')

    filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`
  } else if (type === 'products') {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    csv = [
      'ID,Nome,Preço,Categoria,DeliveryType,Criado em',
      ...products.map(p =>
        [
          p.id,
          `"${p.name}"`,
          p.price.toFixed(2),
          `"${p.category}"`,
          p.deliveryType,
          new Date(p.createdAt).toLocaleString('pt-BR'),
        ].join(',')
      ),
    ].join('\n')

    filename = `produtos_${new Date().toISOString().split('T')[0]}.csv`
  } else if (type === 'revenue') {
    const orders = await prisma.order.findMany({
      where: { status: 'paid' },
      orderBy: { createdAt: 'asc' },
    })

    // Group by month
    const monthly = {}
    orders.forEach(o => {
      const monthKey = new Date(o.createdAt).toISOString().slice(0, 7)
      if (!monthly[monthKey]) monthly[monthKey] = { count: 0, revenue: 0 }
      monthly[monthKey].count++
      monthly[monthKey].revenue += o.total
    })

    csv = [
      'Mês,Pedidos Pagos,Faturamento',
      ...Object.entries(monthly).map(([month, data]) =>
        [month, data.count, data.revenue.toFixed(2)].join(',')
      ),
    ].join('\n')

    filename = `faturamento_${new Date().toISOString().split('T')[0]}.csv`
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}