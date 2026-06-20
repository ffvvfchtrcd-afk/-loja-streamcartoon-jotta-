import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  if (!getAdminFromRequest(request)) return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 })

  const { messages } = await request.json()
  if (!messages?.length) return NextResponse.json({ error: 'Mensagens obrigat\u00f3rias' }, { status: 400 })

  const history = messages.map(m => `${m.senderType === 'admin' ? 'Admin' : 'Cliente'}: ${m.message}`).join('\n')

  const text = await callAI(
    'Voc\u00ea \u00e9 um analista de suporte. Fa\u00e7a um resumo objetivo do ticket para o admin.',
    `Resuma este atendimento em at\u00e9 3 t\u00f3picos:\n\n${history}\n\nResumo:`
  )
  return NextResponse.json({ summary: text })
}
