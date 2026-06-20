import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'


export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()

  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const paidOrders = await prisma.order.findMany({
    where: { status: { in: ['paid', 'delivered'] }, createdAt: { gte: sixMonthsStart } },
    select: { total: true, createdAt: true, product: { select: { name: true } } },
  })

  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = d.getTime()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
    const monthOrders = paidOrders.filter(o => {
      const t = new Date(o.createdAt).getTime()
      return t >= start && t < end
    })
    const revenue = monthOrders.reduce((s, o) => s + o.total, 0)
    monthlyRevenue.push({
      month: d.toLocaleString('pt-BR', { month: 'short' }),
      revenue,
      orders: monthOrders.length,
    })
  }

  const dailyOrders = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const start = d.setHours(0, 0, 0, 0)
    const end = start + 86400000
    const count = paidOrders.filter(o => {
      const t = new Date(o.createdAt).getTime()
      return t >= start && t < end
    }).length
    dailyOrders.push({
      day: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      count,
    })
  }

  const productSales = {}
  paidOrders.forEach(o => {
    const name = o.product?.name || 'Desconhecido'
    productSales[name] = (productSales[name] || 0) + 1
  })
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sales]) => ({ name, sales }))

  return NextResponse.json({ monthlyRevenue, dailyOrders, topProducts })
}
