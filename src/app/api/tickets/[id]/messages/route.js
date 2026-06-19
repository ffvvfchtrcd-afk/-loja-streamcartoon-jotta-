import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import { getAdminFromRequest, getUserFromRequest } from '@/lib/auth'

export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request)
  const user = getUserFromRequest(request)
  if (!admin && !user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const ticketId = Number(params.id)
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })
  if (!admin && ticket.userId !== user?.id) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(messages)
}

export async function POST(request, { params }) {
  const admin = getAdminFromRequest(request)
  const user = getUserFromRequest(request)
  if (!admin && !user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const ticketId = Number(params.id)
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return NextResponse.json({ error: 'Ticket nÃ£o encontrado' }, { status: 404 })
  if (!admin && ticket.userId !== user?.id) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  if (ticket.deliveredAt) {
    return NextResponse.json({ error: 'Este ticket foi finalizado' }, { status: 403 })
  }

  if (ticket.blockedAt && !admin) {
    return NextResponse.json({ error: 'VocÃª foi bloqueado neste ticket pelo administrador' }, { status: 403 })
  }

  if (ticket.type === 'delivery') {
    if (!admin && !ticket.allowUserReply) {
      return NextResponse.json({ error: 'VocÃª nÃ£o pode responder neste ticket no momento' }, { status: 403 })
    }
  }

  const { message } = await request.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderType: admin ? 'admin' : 'user',
      senderId: admin ? admin.id : user.id,
      message: message.trim(),
    },
  })

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: admin ? 'waiting' : 'open', updatedAt: new Date() },
  })

  if (admin) {
    await logActivity(admin.id, admin.username, 'ticket_reply', `Respondeu ticket #${ticketId}`)
  }

  return NextResponse.json(msg)
}
