import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: Number(params.id) },
    include: {
      orders: {
        include: { product: true, tickets: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      },
      tickets: {
        include: { order: { select: { id: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o encontrado' }, { status: 404 })

  const paidOrders = user.orders.filter(o => o.status === 'paid')
  const totalSpent = paidOrders.reduce((s, o) => s + o.total, 0)

  return NextResponse.json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    orders: user.orders,
    tickets: user.tickets,
    orderCount: user.orders.length,
    ticketCount: user.tickets.length,
    paidCount: paidOrders.length,
    totalSpent,
  })
}
