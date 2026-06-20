const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'

const MODEL = 'openrouter/free'

export async function callAI(system, prompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    return 'Função indisponível. Configure OPENROUTER_API_KEY no .env para usar IA.'
  }

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`AI API error: ${res.status} ${errText}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}
