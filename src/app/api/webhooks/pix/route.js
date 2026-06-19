import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()

    // Mercado Pago IPN format
    const paymentId = body.data?.id || body.id
    const status = body.data?.status || body.status
    const externalRef = body.data?.external_reference || body.external_reference
    const action = body.action || body.type
    const topic = body.topic

    // Try to find order by external_reference first (our order ID)
    let order = null
    if (externalRef) {
      order = await prisma.order.findUnique({
        where: { id: Number(externalRef) },
        include: { product: true, user: true },
      })
    }

    // Fallback: find by paymentId
    if (!order && paymentId) {
      order = await prisma.order.findFirst({
        where: { paymentId: String(paymentId) },
        include: { product: true, user: true },
      })
    }

    if (!order) {
      return NextResponse.json({ message: 'Order not found, may be a test notification' })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ message: 'Order already processed' })
    }

    // Confirm payment if approved
    if (status === 'approved' || status === 'confirmed') {
      return await confirmAndDeliver(order)
    }

    // Also handle topic-based notifications from MP
    if (topic === 'payment' && action === 'payment.updated' && status === 'approved') {
      return await confirmAndDeliver(order)
    }

    // Legacy format (fake webhook)
    if (body.txid && body.status === 'paid') {
      return await confirmAndDeliver(order)
    }

    return NextResponse.json({ message: 'No action taken', status, topic })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function confirmAndDeliver(order) {
  let deliveredCode = ''

  if (order.product?.deliveryType === 'auto') {
    const availableCode = await prisma.code.findFirst({
      where: { productId: order.productId, used: false },
    })

    if (availableCode) {
      await prisma.code.update({
        where: { id: availableCode.id },
        data: { used: true, orderId: order.id },
      })
      deliveredCode = availableCode.value
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'paid',
      ...(deliveredCode ? { deliveredCode } : {}),
    },
  })

  if (order.userId) {
    const existingTicket = await prisma.ticket.findFirst({ where: { orderId: order.id } })
    if (!existingTicket) {
      const ticket = await prisma.ticket.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          subject: `Pedido #${order.id} — ${order.product?.name || 'Produto'}`,
          status: 'closed',
          type: 'delivery',
        },
      })

      const message = deliveredCode
        ? `✅ Pagamento confirmado! Seu código foi liberado:\n\n📌 Código: ${deliveredCode}\n\nGuarde este código em um local seguro. Ele já está disponível na página do pedido também.`
        : `✅ Pagamento confirmado! Em breve seu código será liberado.`

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'system',
          senderId: null,
          message,
        },
      })
    }
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    status: 'paid',
    deliveredCode,
  })
}
