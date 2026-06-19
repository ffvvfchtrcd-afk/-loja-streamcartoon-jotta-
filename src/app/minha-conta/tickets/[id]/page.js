'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR, { useSWRConfig } from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { HiArrowLeft, HiPaperAirplane, HiCheckCircle, HiClock, HiKey, HiBan } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

const categoryConfig = {
  support: { label: 'Suporte', icon: '🛟', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  delivery: { label: 'Entrega', icon: '📦', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  complaint: { label: 'Reclamação', icon: '😤', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  question: { label: 'Dúvida', icon: '❓', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  other: { label: 'Outro', icon: '📝', color: 'text-gray-400 border-gray-500/30 bg-gray-500/10' },
}

export default function UserTicketChat() {
  const params = useParams()
  const router = useRouter()
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const chatEnd = useRef(null)
  const { toast, showToast, closeToast } = useToast()
  const { mutate } = useSWRConfig()

  const { data: ticket, isLoading } = useSWR(
    params.id ? `/api/tickets/${params.id}` : null,
    userFetcher,
    { refreshInterval: 500 }
  )

  const messages = ticket?.messages || []

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) router.push('/login')
  }, [router])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    setSending(true)
    const token = localStorage.getItem('user_token')

    const res = await fetch(`/api/tickets/${params.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: newMsg.trim() }),
    })

    if (res.ok) {
      setNewMsg('')
      mutate(`/api/tickets/${params.id}`)
    } else {
      const data = await res.json()
      showToast(data.error || 'Erro ao enviar mensagem', 'error')
    }
    setSending(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) return null

  const cat = categoryConfig[ticket.category] || categoryConfig.other
  const isDelivery = ticket.type === 'delivery'
  const isClosed = ticket.status === 'closed'
  const isDelivered = ticket.order?.status === 'delivered'
  const isBlocked = !!ticket.blockedAt

  const statusIcon = isClosed ? HiCheckCircle : ticket.status === 'waiting' ? HiClock : null
  const statusColor = isClosed ? 'text-gray-400' : ticket.status === 'waiting' ? 'text-yellow-400' : 'text-green-400'

  const canReply = !isClosed && !isDelivered && !isBlocked && (!isDelivery || ticket.allowUserReply)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/minha-conta/tickets" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-cartoon text-lg text-white truncate">{ticket.subject}</h1>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.color}`}>
                {cat.icon} {cat.label}
              </span>
            </div>
            {ticket.assignee && (
              <p className="text-xs text-gray-500 mt-0.5">👤 Atendente: {ticket.assignee.username}</p>
            )}
          </div>
          {isDelivered ? (
            <span className="flex items-center gap-1 text-sm text-green-400"><HiCheckCircle /> Entregue</span>
          ) : isBlocked ? (
            <span className="flex items-center gap-1 text-sm text-red-400"><HiBan /> Bloqueado</span>
          ) : (
            <span className={`flex items-center gap-1 text-sm ${statusColor}`}>
              {statusIcon && <statusIcon />}
              {isClosed ? 'Fechado' : ticket.status === 'waiting' ? 'Aguardando' : 'Aberto'}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhuma mensagem ainda. Aguarde o atendimento.
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.senderType === 'admin'
              const isSystem = msg.senderType === 'system'
              const isBlockedMsg = msg.message.startsWith('🔇')
              const isUnblockedMsg = msg.message.startsWith('🔊')
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isSystem
                      ? isBlockedMsg
                        ? 'bg-red-500/10 border border-red-500/30'
                        : isUnblockedMsg
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-green-neon/10 border border-green-neon/30'
                      : isAdmin
                        ? 'bg-green-neon/20 rounded-br-md'
                        : 'bg-dark-50 border border-dark-100 rounded-bl-md'
                  }`}>
                    {isSystem && !isBlockedMsg && !isUnblockedMsg && <span className="text-lg mb-1 block">🎉</span>}
                    <p className={`text-sm whitespace-pre-wrap ${
                      isSystem ? 'text-green-neon font-medium' : 'text-white'
                    } ${isBlockedMsg ? '!text-red-400' : ''} ${isUnblockedMsg ? '!text-green-400' : ''}`}>
                      {msg.message}
                    </p>
                    <p className={`text-xs mt-1.5 ${isSystem ? 'text-green-700' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleString('pt-BR')}
                      {isAdmin && ' · Admin'}
                      {isSystem && ' · Sistema'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEnd} />
        </div>
      </div>

      {isDelivered ? (
        <div className="border-t-2 border-green-neon/30 p-4 bg-green-neon/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-green-400 flex items-center justify-center gap-2">
              <HiCheckCircle /> Produto entregue com sucesso!
            </p>
          </div>
        </div>
      ) : isBlocked ? (
        <div className="border-t-2 border-red-500/30 p-4 bg-red-500/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-red-400 flex items-center justify-center gap-2">
              <HiBan /> Você foi bloqueado neste ticket pelo administrador
            </p>
          </div>
        </div>
      ) : isClosed ? (
        <div className="border-t-2 border-dark-100 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-500">Ticket fechado</p>
          </div>
        </div>
      ) : canReply ? (
        <div className="border-t-2 border-green-neon/10 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                className="input-cartoon flex-1"
                placeholder="Digite sua mensagem..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMsg.trim()}
                className="btn-cartoon !px-4 disabled:opacity-50"
              >
                <HiPaperAirplane className={`text-xl ${sending ? 'animate-spin' : ''}`} />
              </button>
            </form>
          </div>
        </div>
      ) : isDelivery && !ticket.allowUserReply ? (
        <div className="border-t-2 border-green-neon/10 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <HiKey className="text-purple-400" />
              Este é um ticket de entrega. A equipe está preparando seu produto.
            </p>
          </div>
        </div>
      ) : null}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
