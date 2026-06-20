import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { message, history } = await request.json()
  if (!message) return NextResponse.json({ error: 'Mensagem obrigat\u00f3ria' }, { status: 400 })

  const chatHistory = (history || []).slice(-6).map(m => `${m.role}: ${m.text}`).join('\n')

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { name: true, price: true, description: true, category: true, deliveryType: true },
    orderBy: { name: 'asc' },
  })

  const productList = products.map(p =>
    `- ${p.name} (R$ ${p.price.toFixed(2).replace('.', ',')}) — ${p.description}. Categoria: ${p.category}. Entrega: ${p.deliveryType === 'auto' ? 'autom\u00e1tica (c\u00f3digo enviado ap\u00f3s pagamento)' : 'manual (suporte libera ap\u00f3s pagamento)'}.`
  ).join('\n')

  const systemPrompt = `Voc\u00ea \u00e9 o assistente virtual da StreamCartoon, uma loja de assinaturas e contas digitais. Seja breve, simp\u00e1tico e \u00fatil. Ajude com d\u00favidas sobre produtos, entregas, pre\u00e7os, etc.

Produtos dispon\u00edveis na loja:
${productList || 'Nenhum produto cadastrado no momento.'}

Sempre consulte a lista de produtos acima para responder. N\u00e3o invente pre\u00e7os ou produtos que n\u00e3o estejam na lista. Se o cliente perguntar algo que voc\u00ea n\u00e3o sabe, pe\u00e7a para ele falar com o suporte.`

  let text
  try {
    text = await callAI(
      systemPrompt,
      `Hist\u00f3rico:\n${chatHistory}\n\nCliente: ${message}\n\nAssistente:`
    )
  } catch {
    text = 'Desculpe, n\u00e3o consegui processar sua mensagem agora. Tente novamente mais tarde.'
  }
  return NextResponse.json({ reply: text })
}
