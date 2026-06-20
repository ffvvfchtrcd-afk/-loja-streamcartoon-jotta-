import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  if (!getAdminFromRequest(request)) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { productName } = await request.json()
  if (!productName) return NextResponse.json({ error: 'Nome do produto obrigat\u00f3rio' }, { status: 400 })

  const text = await callAI(
    'Voc\u00ea \u00e9 um copywriter de e-commerce. Gere t\u00edtulo, descri\u00e7\u00e3o e palavras-chave para um produto digital de streaming.',
    `Produto: ${productName}\n\nFormato:\nT\u00cdTULO: (m\u00e1ximo 40 caracteres)\nDESCRI\u00c7\u00c3O: (2-3 frases atrativas)\nPALAVRAS-CHAVE: (separadas por v\u00edrgula)`
  )
  return NextResponse.json({ text })
}
