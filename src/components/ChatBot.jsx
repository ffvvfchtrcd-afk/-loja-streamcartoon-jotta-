'use client'

import { useState, useRef, useEffect } from 'react'

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ol\u00e1! Sou o assistente da StreamCartoon. Como posso ajudar?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEnd = useRef(null)

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
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
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-neon/20 text-white rounded-br-md'
                    : 'bg-dark-100 text-gray-300 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
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
