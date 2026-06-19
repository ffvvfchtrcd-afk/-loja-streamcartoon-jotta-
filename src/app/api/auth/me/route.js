import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request) {
  const userData = getUserFromRequest(request)
  if (!userData) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userData.id },
    include: {
      orders: {
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      },
      tickets: {
        select: { id: true, status: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const paidOrders = user.orders.filter(o => o.status === 'paid')
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0)
  const deliveredCount = paidOrders.length
  const ticketCount = user.tickets.length
  const pendingCount = user.orders.filter(o => o.status === 'pending').length
  const cancelledCount = user.orders.filter(o => o.status === 'cancelled').length

  return NextResponse.json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    orders: user.orders,
    tickets: user.tickets,
    stats: {
      totalOrders: user.orders.length,
      paidOrders: paidOrders.length,
      pendingCount,
      cancelledCount,
      deliveredCount,
      totalSpent,
      ticketCount,
      openTickets: user.tickets.filter(t => t.status === 'open' || t.status === 'waiting').length,
    },
  })
}
