'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { HiTicket, HiChat, HiCheckCircle, HiClock, HiPlus, HiArrowLeft, HiKey, HiFilter } from 'react-icons/hi'

const statusConfig = {
  open: { icon: HiChat, label: 'Aberto', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  waiting: { icon: HiClock, label: 'Aguardando', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  closed: { icon: HiCheckCircle, label: 'Fechado', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' },
}

const categoryConfig = {
  support: { label: 'Suporte', icon: '🛟', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  delivery: { label: 'Entrega', icon: '📦', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  complaint: { label: 'Reclamação', icon: '😤', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  question: { label: 'Dúvida', icon: '❓', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  other: { label: 'Outro', icon: '📝', color: 'text-gray-400 border-gray-500/30 bg-gray-500/10' },
}

export default function UserTickets() {
  const router = useRouter()
  const [filterCat, setFilterCat] = useState('')
  const { data: tickets, isLoading } = useSWR(
    filterCat ? `/api/tickets?mine=true&category=${filterCat}` : '/api/tickets?mine=true',
    userFetcher
  )

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/minha-conta" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-cartoon text-xl text-white">Stream<span className="text-green-neon">Cartoon</span></h1>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="title-cartoon text-3xl text-white mb-1">Meus Tickets</h2>
            <p className="text-gray-400 text-sm">Acompanhe seus chamados de suporte e entregas</p>
          </div>
          <Link href="/minha-conta/tickets/novo" className="btn-cartoon gap-2 text-sm">
            <HiPlus className="text-lg" /> Novo Ticket
          </Link>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              !filterCat ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30'
            }`}
          >Todas</button>
          {Object.entries(categoryConfig).map(([key, cat]) => (
            <button key={key} onClick={() => setFilterCat(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterCat === key ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30'
              }`}
            >{cat.icon} {cat.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
          </div>
        ) : (tickets || []).length === 0 ? (
          <div className="card-cartoon text-center py-12">
            <HiTicket className="text-5xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum ticket encontrado</p>
            <Link href="/minha-conta/tickets/novo" className="btn-cartoon mt-4 inline-flex gap-2">
              <HiPlus className="text-lg" /> Criar Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(tickets || []).map(ticket => {
              const st = statusConfig[ticket.status] || statusConfig.open
              const Icon = st.icon
              const lastMsg = ticket.messages?.[0]
              const isDelivery = ticket.type === 'delivery'
              const isDelivered = ticket.order?.status === 'delivered'
              const cat = categoryConfig[ticket.category] || categoryConfig.other
              return (
                <Link
                  key={ticket.id}
                  href={`/minha-conta/tickets/${ticket.id}`}
                  className="card-cartoon p-5 block hover:border-green-neon/40 transition-all animate-slide-up"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-cartoon text-green-neon">#{ticket.id}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${st.bg} ${st.color}`}>
                          <Icon className="text-sm" /> {st.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.color}`}>
                          {cat.icon} {cat.label}
                        </span>
                        {isDelivered && (
                          <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded text-[10px]">✅ Entregue</span>
                        )}
                        {ticket.assignedTo && (
                          <span className="text-[10px] text-gray-500">👤 Atribuído</span>
                        )}
                        {ticket.blockedAt && (
                          <span className="text-[10px] text-red-400">🔇 Bloqueado</span>
                        )}
                      </div>
                      <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                      {lastMsg && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{lastMsg.message}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {isDelivery ? <HiKey className="text-2xl text-purple-500/50" /> : <HiChat className="text-2xl text-gray-600" />}
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
