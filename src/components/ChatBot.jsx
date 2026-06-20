'use client'

import { useState, useRef, useEffect } from 'react'

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ol\u00e1! Sou o assistente da StreamCartoon. Como posso ajudar?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const chatEnd = useRef(null)

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && !products.length) {
      fetch('/api/products?limit=100')
        .then(r => r.json())
        .then(d => setProducts(d.products || []))
        .catch(() => {})
    }
  }, [open, products.length])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages }),
      })
      if (res.ok) {
        const data = await res.json()
        const msgs = [{ role: 'assistant', text: data.reply }]
        if (data.matchedIds?.length) {
          const matched = products.filter(p => data.matchedIds.includes(p.id))
          if (matched.length) {
            msgs.push({ role: 'products', products: matched })
          }
        }
        setMessages(prev => [...prev, ...msgs])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Desculpe, n\u00e3o consegui processar sua mensagem agora.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Erro de conex\u00e3o. Tente novamente.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-neon text-dark-950 shadow-lg shadow-green-neon/30 hover:scale-110 transition-all duration-200 flex items-center justify-center text-2xl"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-dark-900 border-2 border-green-neon/30 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-slide-up">
          <div className="bg-green-neon/10 border-b border-green-neon/20 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-neon/20 flex items-center justify-center text-sm">🤖</div>
            <div>
              <p className="text-white text-sm font-medium">StreamCartoon AI</p>
              <p className="text-[10px] text-green-neon">Online</p>
            </div>
          </div>

          <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              msg.role === 'products' ? (
                <div key={i} className="space-y-2">
                  {msg.products.map(p => (
                    <a key={p.id} href={`/produto/${p.id}`} className="flex items-center gap-2 p-2 rounded-xl bg-dark-100 hover:bg-dark-200 transition-colors group">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-950 flex-shrink-0">
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">{p.category?.charAt(0) || '?'}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate group-hover:text-green-neon transition-colors">{p.name}</p>
                        <p className="text-[10px] text-green-neon font-bold">R$ {Number(p.price).toFixed(2)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-green-neon/20 text-white rounded-br-md'
                      : 'bg-dark-100 text-gray-300 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-dark-100 px-3 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <form onSubmit={handleSend} className="border-t border-dark-100 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-dark-100 border border-dark-200 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-neon transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-xl bg-green-neon text-dark-950 font-bold disabled:opacity-30 transition-opacity text-sm"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  )
}
