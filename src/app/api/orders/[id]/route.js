import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export async function GET(request, { params }) {
  const { getAdminFromRequest, getUserFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  const user = getUserFromRequest(request)

  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: {
      items: {
        include: { product: true }
      },
      user: admin ? { select: { id: true, username: true } } : undefined,
      tickets: { select: { id: true, status: true, subject: true, userId: true, type: true } },
    },
  })
  if (!order) return NextResponse.json({ error: 'Pedido nÃ£o encontrado' }, { status: 404 })

  if (!admin && user && order.userId && order.userId !== user.id) {
    return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
  }

  const ticket = order.tickets?.[0] || null
  const { tickets, ...orderData } = order

  return NextResponse.json({ ...orderData, ticket })
}

export async function PATCH(request, { params }) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { status } = await request.json()
  const id = Number(params.id)

  if (status === 'paid') {
    const order = await prisma.order.findUnique({ where: { id }, include: { product: true, user: true } })
    if (!order) return NextResponse.json({ error: 'Pedido nÃ£o encontrado' }, { status: 404 })

    if (order.product.deliveryType === 'auto') {
      const availableCode = await prisma.code.findFirst({
        where: { productId: order.productId, used: false },
      })

      if (!availableCode) {
        return NextResponse.json({ error: 'Sem cÃ³digos disponÃ­veis para este produto' }, { status: 400 })
      }

      await prisma.code.update({
        where: { id: availableCode.id },
        data: { used: true, orderId: id },
      })

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'paid', deliveredCode: availableCode.value },
      })

      if (order.userId) {
        const existingTicket = await prisma.ticket.findFirst({ where: { orderId: id } })
        if (!existingTicket) {
          const ticket = await prisma.ticket.create({
            data: {
              orderId: id,
              userId: order.userId,
              subject: `Pedido #${id} â€” ${order.product?.name || 'Produto'}`,
              status: 'closed',
              type: 'delivery',
            },
          })
          await prisma.ticketMessage.create({
            data: {
              ticketId: ticket.id,
              senderType: 'admin',
              senderId: admin.id,
              message: `Pagamento confirmado! Seu c\u00f3digo foi liberado:\n\nC\u00f3digo: ${availableCode.value}\n\nGuarde este c\u00f3digo em um local seguro. Ele j\u00e1 est\u00e1 dispon\u00edvel na p\u00e1gina do pedido tamb\u00e9m.`,
            },
          })
        }
      }

      await logActivity(admin.id, admin.username, 'order_confirm', `Confirmou pagamento do pedido #${id}`)
      return NextResponse.json(updatedOrder)
    }

    if (order.product.deliveryType === 'auto_v2') {
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'paid' },
      })

      if (order.userId) {
        const existingTicket = await prisma.ticket.findFirst({ where: { orderId: id } })
        if (!existingTicket) {
          const ticket = await prisma.ticket.create({
            data: {
              orderId: id,
              userId: order.userId,
              subject: `Entrega - Pedido #${id} - ${order.product?.name || 'Produto'}`,
              status: 'open',
              type: 'delivery',
            },
          })
          await prisma.ticketMessage.create({
            data: {
              ticketId: ticket.id,
              senderType: 'admin',
              senderId: admin.id,
              message: `Pagamento confirmado!\n\nEm breve a entrega do seu produto ser\u00e1 feita por aqui.\n\nA equipe j\u00e1 foi notificada e responder\u00e1 em instantes.`,
            },
          })
        }
      }

      await logActivity(admin.id, admin.username, 'order_confirm', `Confirmou pagamento do pedido #${id}`)
      return NextResponse.json(updatedOrder)
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  })

  if (status === 'cancelled') {
    await logActivity(admin.id, admin.username, 'order_cancel', `Cancelou pedido #${id}`)
  }

  return NextResponse.json(order)
}
