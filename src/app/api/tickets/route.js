import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest, getUserFromRequest } from '@/lib/auth'

export async function GET(request) {
  const admin = getAdminFromRequest(request)
  const user = getUserFromRequest(request)
  if (!admin && !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mine = searchParams.get('mine')
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const status = searchParams.get('status')

  let where = {}
  if (mine && user) {
    where = { userId: user.id }
  } else if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (type) where = { ...where, type }
  if (category) where = { ...where, category }
  if (status) where = { ...where, status }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      user: { select: { id: true, username: true } },
      order: { select: { id: true, productId: true, deliveredCode: true, status: true } },
      assignee: { select: { id: true, username: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(tickets)
}

export async function POST(request) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Faça login para abrir um ticket' }, { status: 401 })

  const { orderId, subject, category, message } = await request.json()
  if (!subject) return NextResponse.json({ error: 'Assunto é obrigatório' }, { status: 400 })

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      orderId: orderId || null,
      subject,
      category: category || 'support',
    },
  })

  if (message?.trim()) {
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'user',
        senderId: user.id,
        message: message.trim(),
      },
    })
  }

  const full = await prisma.ticket.findUnique({
    where: { id: ticket.id },
    include: {
      user: { select: { id: true, username: true } },
      assignee: { select: { id: true, username: true } },
      messages: true,
    },
  })

  return NextResponse.json(full)
}
