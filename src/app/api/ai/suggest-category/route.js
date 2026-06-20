import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  if (!getAdminFromRequest(request)) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { productName } = await request.json()
  if (!productName) return NextResponse.json({ error: 'Nome do produto obrigat\u00f3rio' }, { status: 400 })

  const text = await callAI(
    'Voc\u00ea \u00e9 um categorizador de e-commerce. Responda APENAS com o nome da categoria mais adequada.',
    `Que categoria melhor se encaixa para o produto "${productName}" em uma loja de assinaturas de streaming? Ex: Netflix, Disney+, HBO, Spotify, Amazon, Streaming, Outro`
  )
  return NextResponse.json({ category: text })
}
