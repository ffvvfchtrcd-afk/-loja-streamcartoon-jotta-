import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const activeCategories = await prisma.category.findMany({ where: { active: true }, select: { name: true } })
  const activeNames = activeCategories.map(c => c.name)

  const products = await prisma.product.findMany({ select: { id: true, name: true, category: true } })

  let updated = 0
  for (const product of products) {
    if (!product.category || !activeNames.includes(product.category)) {
      await prisma.product.update({
        where: { id: product.id },
        data: { category: '' },
      })
      updated++
    }
  }

  await logActivity(admin.id, admin.username, 'cleanup_categories', `Removeu categoria de ${updated} produtos`)

  return NextResponse.json({
    success: true,
    total: products.length,
    updated,
    message: `${updated} de ${products.length} produtos tiveram a categoria removida`,
  })
}
