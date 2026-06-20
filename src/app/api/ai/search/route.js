import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  if (!q) return NextResponse.json({ results: [] })

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    take: 50,
  })
  if (!products.length) return NextResponse.json({ results: [] })

  const catalog = products.map(p => `${p.id}: ${p.name} - ${p.description?.slice(0, 80) || ''}`).join('\n')

  const text = await callAI(
    'Voc\u00ea \u00e9 um buscador inteligente de e-commerce. Dada a busca do cliente e o cat\u00e1logo, retorne APENAS os IDs dos produtos mais relevantes (separados por v\u00edrgula, m\u00e1ximo 5).',
    `Busca do cliente: "${q}"\n\nCat\u00e1logo:\n${catalog}\n\nIDs dos produtos mais relevantes para a busca:`
  )

  const ids = text.match(/\d+/g)?.map(Number).filter(n => products.some(p => p.id === n)).slice(0, 5) || []
  const results = ids.map(id => products.find(p => p.id === id)).filter(Boolean)
  return NextResponse.json({ results })
}
