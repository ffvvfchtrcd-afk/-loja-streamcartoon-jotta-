import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let geral = await prisma.category.findFirst({ where: { name: 'Geral' } })
  if (!geral) {
    geral = await prisma.category.create({ data: { name: 'Geral', icon: '📦', order: 999 } })
  }

  const allCats = await prisma.category.findMany()
  const catMap = {}
  allCats.forEach(c => { catMap[c.name.toLowerCase()] = c.id })

  const products = await prisma.product.findMany({ select: { id: true, name: true, category: true, categoryId: true } })

  let updated = 0
  for (const product of products) {
    if (product.categoryId) continue
    const catName = (product.category || '').trim()
    const match = catName ? catMap[catName.toLowerCase()] : null
    await prisma.product.update({
      where: { id: product.id },
      data: {
        categoryId: match || geral.id,
        category: match ? product.category : (product.category || ''),
      },
    })
    updated++
  }

  const withoutCat = products.filter(p => !p.category?.trim())
  return NextResponse.json({
    success: true,
    total: products.length,
    updated,
    semCategoria: withoutCat.length,
    message: `${updated} produtos migrados. ${withoutCat.length} sem categoria → "Geral".`,
  })
}
