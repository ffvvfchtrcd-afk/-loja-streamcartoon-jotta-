import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  if (!getAdminFromRequest(request)) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { productName, description } = await request.json()
  if (!productName) return NextResponse.json({ error: 'Nome do produto obrigat\u00f3rio' }, { status: 400 })

  const text = await callAI(
    'Voc\u00ea \u00e9 um estrategista de marketing. Sugira tags/etiquetas para produtos de e-commerce. Responda APENAS com as tags separadas por v\u00edrgula.',
    `Produto: ${productName}\nDescri\u00e7\u00e3o: ${description || ''}\n\nSugira tags como: popular, lan\u00e7amento, promo\u00e7\u00e3o, mais vendido, oferta limitada, etc.`
  )
  return NextResponse.json({ tags: text.split(',').map(t => t.trim()).filter(Boolean) })
}
