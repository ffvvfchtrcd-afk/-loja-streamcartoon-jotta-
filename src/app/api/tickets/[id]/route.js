import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import { getAdminFromRequest, getUserFromRequest } from '@/lib/auth'

export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request)
  const user = getUserFromRequest(request)
  if (!admin && !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true } },
      assignee: { select: { id: true, username: true } },
      order: { select: { id: true, productId: true, product: { select: { name: true, deliveryType: true } }, deliveredCode: true, status: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })
  if (!admin && ticket.userId !== user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  return NextResponse.json(ticket)
}

export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { status, action } = await request.json()
  const id = Number(params.id)

  if (action === 'assign') {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })

    const updated = await prisma.ticket.update({
      where: { id },
      data: { assignedTo: admin.id },
    })
    await logActivity(admin.id, admin.username, 'ticket_assign', `Assumiu ticket #${id}`)
    return NextResponse.json(updated)
  }

  if (action === 'unassign') {
    const updated = await prisma.ticket.update({
      where: { id },
      data: { assignedTo: null },
    })
    await logActivity(admin.id, admin.username, 'ticket_unassign', `Removeu atribuiÃ§Ã£o do ticket #${id}`)
    return NextResponse.json(updated)
  }

  if (action === 'block') {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })
    if (ticket.deliveredAt) return NextResponse.json({ error: 'Ticket finalizado' }, { status: 400 })

    const updated = await prisma.ticket.update({
      where: { id },
      data: { blockedAt: new Date() },
    })

    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderType: 'system',
        senderId: admin.id,
        message: 'ðŸ”‡ UsuÃ¡rio bloqueado neste ticket pelo administrador.',
      },
    })

    await logActivity(admin.id, admin.username, 'ticket_block', `Bloqueou usuÃ¡rio no ticket #${id}`)
    return NextResponse.json(updated)
  }

  if (action === 'unblock') {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })

    const updated = await prisma.ticket.update({
      where: { id },
      data: { blockedAt: null },
    })

    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderType: 'system',
        senderId: admin.id,
        message: 'ðŸ”Š UsuÃ¡rio desbloqueado. Pode responder novamente.',
      },
    })

    await logActivity(admin.id, admin.username, 'ticket_unblock', `Desbloqueou usuÃ¡rio no ticket #${id}`)
    return NextResponse.json(updated)
  }

  if (action === 'deliver') {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { order: true },
    })
    if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })
    if (ticket.type !== 'delivery') return NextResponse.json({ error: 'Ticket nÃ£o Ã© de entrega' }, { status: 400 })
    if (ticket.deliveredAt) return NextResponse.json({ error: 'Produto jÃ¡ foi entregue' }, { status: 400 })

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'closed', deliveredAt: new Date(), blockedAt: null },
    })

    await prisma.order.update({
      where: { id: ticket.orderId },
      data: { status: 'delivered' },
    })

    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'system',
        senderId: admin.id,
        message: 'âœ… Produto entregue com sucesso!',
      },
    })

    await logActivity(admin.id, admin.username, 'order_deliver', `Entregou produto do pedido #${ticket.orderId}`)
    return NextResponse.json({ success: true })
  }

  if (action === 'toggleUserReply') {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })
    if (ticket.type !== 'delivery') return NextResponse.json({ error: 'Apenas tickets de entrega' }, { status: 400 })
    if (ticket.deliveredAt) return NextResponse.json({ error: 'Produto jÃ¡ entregue' }, { status: 400 })

    const updated = await prisma.ticket.update({
      where: { id },
      data: { allowUserReply: !ticket.allowUserReply },
    })
    return NextResponse.json(updated)
  }

  const existing = await prisma.ticket.findUnique({ where: { id } })
  if (existing?.deliveredAt) return NextResponse.json({ error: 'Ticket finalizado' }, { status: 400 })

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { status },
  })

  if (status === 'closed') {
    await logActivity(admin.id, admin.username, 'ticket_close', `Fechou ticket #${id}`)
  }

  return NextResponse.json(ticket)
}
