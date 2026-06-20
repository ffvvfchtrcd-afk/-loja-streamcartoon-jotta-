import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  if (!getAdminFromRequest(request)) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { ticketSubject, messages } = await request.json()
  if (!messages?.length) return NextResponse.json({ error: 'Mensagens obrigat\u00f3rias' }, { status: 400 })

  const history = messages.map(m => `${m.senderType === 'admin' ? 'Admin' : 'Cliente'}: ${m.message}`).join('\n')

  const text = await callAI(
    'Voc\u00ea \u00e9 um atendente de suporte educado e profissional. Sugira uma resposta para o cliente baseada no hist\u00f3rico.',
    `Assunto: ${ticketSubject || 'Suporte'}\n\nHist\u00f3rico:\n${history}\n\nSugira uma resposta cordial e \u00fatil para o \u00faltimo cliente:`
  )
  return NextResponse.json({ reply: text })
}
