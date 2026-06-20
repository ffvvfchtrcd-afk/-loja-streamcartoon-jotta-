import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const productId = Number(searchParams.get('productId'))
  if (!productId) return NextResponse.json({ error: 'productId obrigat\u00f3rio' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Produto n\u00e3o encontrado' }, { status: 404 })

  const allProducts = await prisma.product.findMany({
    where: { id: { not: productId }, active: true },
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
  })
  if (!allProducts.length) return NextResponse.json({ related: [] })

  const catalog = allProducts.map(p => `${p.id}: ${p.name} - ${p.description?.slice(0, 60) || ''} - R$ ${p.price}`).join('\n')

  const text = await callAI(
    'Voc\u00ea \u00e9 um recomendador de e-commerce. Dados os IDs dos produtos, retorne APENAS os IDs (separados por v\u00edrgula) dos 3 produtos mais complementares.',
    `Produto atual: ${product.name} - ${product.description?.slice(0, 60)}\n\nCat\u00e1logo:\n${catalog}\n\nIDs dos 3 produtos mais relacionados (complementares, mesma categoria ou interesse similar):`
  )

  const ids = text.match(/\d+/g)?.map(Number).filter(n => allProducts.some(p => p.id === n)).slice(0, 3) || []
  const related = allProducts.filter(p => ids.includes(p.id))
  return NextResponse.json({ related })
}
