import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [pendingOrders, openTickets, deliveryTickets, totalUsers, products] = await Promise.all([
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.ticket.count({ where: { status: 'open' } }),
    prisma.ticket.count({ where: { type: 'delivery', status: { not: 'closed' } } }),
    prisma.user.count(),
    prisma.product.findMany({
      select: { id: true, name: true, deliveryType: true, _count: { select: { codes: true } } },
    }),
  ])

  const codesUsed = await prisma.code.groupBy({
    by: ['productId'],
    where: { used: false },
    _count: true,
  })

  const usedMap = {}
  for (const c of codesUsed) usedMap[c.productId] = c._count

  const lowStockProducts = products
    .filter(p => {
      if (p.deliveryType !== 'auto') return false
      const avail = usedMap[p.id] || 0
      return avail > 0 && avail <= 5
    })
    .map(p => ({ id: p.id, name: p.name, stock: usedMap[p.id] || 0 }))

  const recentOrders = await prisma.order.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, customerName: true, total: true, createdAt: true },
  })

  const recentTickets = await prisma.ticket.findMany({
    where: { status: 'open' },
    include: { user: { select: { username: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 3,
  })

  return NextResponse.json({
    pendingOrders,
    openTickets,
    deliveryTickets,
    totalUsers,
    total: pendingOrders + openTickets + deliveryTickets,
    recentOrders,
    recentTickets,
    lowStockProducts,
    lowStockCount: lowStockProducts.length,
  })
}
