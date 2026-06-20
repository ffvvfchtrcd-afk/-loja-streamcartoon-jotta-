import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { message, history } = await request.json()
  if (!message) return NextResponse.json({ error: 'Mensagem obrigat\u00f3ria' }, { status: 400 })

  const chatHistory = (history || []).slice(-6).map(m => `${m.role}: ${m.text}`).join('\n')

  let text
  try {
    text = await callAI(
      'Voc\u00ea \u00e9 o assistente virtual da StreamCartoon, uma loja de assinaturas de streaming. Seja breve, simp\u00e1tico e \u00fatil. Ajude com d\u00favidas sobre produtos, entregas, pre\u00e7os, etc.',
      `Hist\u00f3rico:\n${chatHistory}\n\nCliente: ${message}\n\nAssistente:`
    )
  } catch {
    text = 'Desculpe, n\u00e3o consegui processar sua mensagem agora. Tente novamente mais tarde.'
  }
  return NextResponse.json({ reply: text })
}
