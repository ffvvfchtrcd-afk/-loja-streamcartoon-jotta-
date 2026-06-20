import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  if (!getAdminFromRequest(request)) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { customerName, productName, orderId } = await request.json()

  const text = await callAI(
    'Voc\u00ea \u00e9 um assistente de e-commerce. Gere um texto curto e cordial de confirma\u00e7\u00e3o de pedido.',
    `Gere uma mensagem de confirma\u00e7\u00e3o de pedido para:\nCliente: ${customerName}\nProduto: ${productName}\nPedido: #${orderId}\n\nMensagem (m\u00e1ximo 3 frases, tom cordial):`
  )
  return NextResponse.json({ text })
}
