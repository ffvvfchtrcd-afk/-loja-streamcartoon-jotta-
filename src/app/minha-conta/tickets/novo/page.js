'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { HiArrowLeft, HiPaperAirplane, HiTag, HiShoppingCart } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

const categories = [
  { value: 'support', label: 'Suporte', icon: '🛟', desc: 'Dúvidas sobre produtos ou funcionamento' },
  { value: 'complaint', label: 'Reclamação', icon: '😤', desc: 'Problemas com pedido ou atendimento' },
  { value: 'question', label: 'Dúvida', icon: '❓', desc: 'Informações antes de comprar' },
  { value: 'other', label: 'Outro', icon: '📝', desc: 'Outros assuntos' },
]

export default function NewTicket() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('support')
  const [message, setMessage] = useState('')
  const [orderId, setOrderId] = useState('')
  const [creating, setCreating] = useState(false)
  const { toast, showToast, closeToast } = useToast()

  const { data: orders } = useSWR('/api/orders?mine=true', userFetcher)
  const paidOrders = (orders || []).filter(o => o.status === 'paid' || o.status === 'delivered')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim()) {
      showToast('Digite um assunto', 'warning')
      return
    }
    setCreating(true)
    const token = localStorage.getItem('user_token')

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        subject: subject.trim(),
        category,
        orderId: orderId ? Number(orderId) : null,
        message: message.trim() || null,
      }),
    })

    if (res.ok) {
      const ticket = await res.json()
      showToast('Ticket criado!', 'success')
      setTimeout(() => router.push(`/minha-conta/tickets/${ticket.id}`), 500)
    } else {
      const data = await res.json()
      showToast(data.error || 'Erro ao criar ticket', 'error')
    }
    setCreating(false)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/minha-conta/tickets" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-cartoon text-xl text-white">Stream<span className="text-green-neon">Cartoon</span></h1>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="title-cartoon text-3xl text-white mb-1">Novo Ticket</h2>
        <p className="text-gray-400 text-sm mb-8">Abra um chamado de suporte, reclamação ou dúvida</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-3">Categoria</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    category === cat.value
                      ? 'border-green-neon bg-green-neon/10'
                      : 'border-dark-100 bg-dark-50 hover:border-dark-200'
                  }`}
                >
                  <span className="text-2xl block mb-1">{cat.icon}</span>
                  <p className="text-white font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <HiTag className="inline mr-1" /> Assunto *
            </label>
            <input
              className="input-cartoon"
              placeholder="Ex: Problema com meu pedido"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Pedido relacionado (opcional)</label>
            <select
              className="input-cartoon"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
            >
              <option value="">Nenhum pedido</option>
              {(paidOrders || []).map(o => (
                <option key={o.id} value={o.id}>
                  Pedido #{o.id} - R$ {o.total.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Mensagem inicial (opcional)</label>
            <textarea
              className="input-cartoon min-h-[120px] resize-y"
              placeholder="Descreva seu problema ou dúvida..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-cartoon gap-2 disabled:opacity-50"
          >
            {creating ? (
              <><div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" /> Criando...</>
            ) : (
              <><HiPaperAirplane className="text-xl" /> Criar Ticket</>
            )}
          </button>
        </form>
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
