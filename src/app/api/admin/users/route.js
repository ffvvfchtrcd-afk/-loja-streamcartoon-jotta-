import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'


export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''

  const where = search
    ? { username: { contains: search } }
    : {}

  const users = await prisma.user.findMany({
    where,
    include: {
      _count: { select: { orders: true, tickets: true } },
      orders: { select: { total: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = users.map(u => ({
    id: u.id,
    username: u.username,
    createdAt: u.createdAt,
    orderCount: u._count.orders,
    ticketCount: u._count.tickets,
    totalSpent: u.orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0),
    paidOrders: u.orders.filter(o => o.status === 'paid').length,
  }))

  return NextResponse.json(result)
}
