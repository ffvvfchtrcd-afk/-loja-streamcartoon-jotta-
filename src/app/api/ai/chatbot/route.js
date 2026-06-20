import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { message, history } = await request.json()
  if (!message) return NextResponse.json({ error: 'Mensagem obrigat\u00f3ria' }, { status: 400 })

  const chatHistory = (history || []).slice(-6).map(m => `${m.role}: ${m.text}`).join('\n')

  const allProducts = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true, description: true, category: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } },
    orderBy: { name: 'asc' },
  })

  const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const matched = allProducts.filter(p => {
    const txt = `${p.name} ${p.description} ${p.category}`.toLowerCase()
    return keywords.some(k => txt.includes(k))
  })

  const productList = allProducts.map(p =>
    `[ID ${p.id}] ${p.name} (R$ ${p.price.toFixed(2).replace('.', ',')}) — ${p.description?.slice(0, 80)}. Categoria: ${p.category}.`
  ).join('\n')

  const systemPrompt = `Voc\u00ea \u00e9 o assistente virtual da StreamCartoon, uma loja de assinaturas e contas digitais. Seja breve, simp\u00e1tico e \u00fatil.

Produtos dispon\u00edveis:
${productList || 'Nenhum produto cadastrado.'}

Sempre responda com base na lista acima. N\u00e3o invente pre\u00e7os. Se perguntarem por um produto, informe o nome e o pre\u00e7o. Se houver m\u00faltiplos produtos relacionados, liste todos.`

  let reply
  try {
    reply = await callAI(
      systemPrompt,
      `Hist\u00f3rico:\n${chatHistory}\n\nCliente: ${message}\n\nAssistente:`
    )
  } catch {
    reply = 'Desculpe, n\u00e3o consegui processar sua mensagem agora. Tente novamente mais tarde.'
  }

  const matchedIds = matched.map(p => p.id)

  return NextResponse.json({ reply, matchedIds })
}
