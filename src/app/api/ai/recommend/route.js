import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const productId = Number(searchParams.get('productId'))
  if (!productId) return NextResponse.json({ results: [] })

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ results: [] })

  const allProducts = await prisma.product.findMany({
    where: { id: { not: productId }, active: true },
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    take: 30,
  })
  if (!allProducts.length) return NextResponse.json({ results: [] })

  const catalog = allProducts.map(p => `${p.id}: ${p.name} - ${p.description?.slice(0, 60) || ''}`).join('\n')

  const text = await callAI(
    'Voc\u00ea \u00e9 um recomendador inteligente. Dado o produto atual e o cat\u00e1logo, retorne APENAS os IDs (separados por v\u00edrgula) dos 3 produtos que o cliente teria interesse em comprar junto.',
    `Cliente est\u00e1 vendo: ${product.name} - ${product.category}\n\nCat\u00e1logo:\n${catalog}\n\nIDs dos 3 produtos recomendados (interesse de compra conjunta):`
  )

  const ids = text.match(/\d+/g)?.map(Number).filter(n => allProducts.some(p => p.id === n)).slice(0, 3) || []
  const results = ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean)
  return NextResponse.json({ results })
}
