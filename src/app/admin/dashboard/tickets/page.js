'use client'

import { useState, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { HiPaperAirplane, HiCheckCircle, HiClock, HiRefresh, HiX, HiKey, HiDownload, HiBan, HiShieldCheck, HiUserAdd } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'
import { useNotification } from '@/hooks/useNotification'
import { adminFetcher } from '@/lib/fetcher'

const tabs = [
  { label: 'Todos', key: '', icon: '📋' },
  { label: 'Suporte', key: 'support', icon: '🛟' },
  { label: 'Reclamação', key: 'complaint', icon: '😤' },
  { label: 'Dúvida', key: 'question', icon: '❓' },
  { label: 'Entregas', key: 'delivery', icon: '📦' },
  { label: 'Outro', key: 'other', icon: '📝' },
]

export default function AdminTickets() {
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [filterTab, setFilterTab] = useState('')
  const [sidebarTicket, setSidebarTicket] = useState(null)
  const [delivering, setDelivering] = useState(false)
  const [togglingReply, setTogglingReply] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const chatEnd = useRef(null)
  const { toast, showToast, closeToast } = useToast()
  const { mutate } = useSWRConfig()
  useNotification()

  const { data: tickets, isLoading } = useSWR(
    filterTab ? `/api/tickets?type=${filterTab}` : '/api/tickets',
    adminFetcher
  )

  const { data: messagesData } = useSWR(
    sidebarTicket?.id ? `/api/tickets/${sidebarTicket.id}/messages` : null,
    adminFetcher,
    { refreshInterval: 500 }
  )

  const messages = messagesData || []

  const refreshTicket = async () => {
    if (!sidebarTicket?.id) return
    const data = await adminFetcher(`/api/tickets/${sidebarTicket.id}`)
    setSidebarTicket(data)
  }

  const selectTicket = (ticket) => {
    setSidebarTicket(ticket)
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !sidebarTicket) return
    setSending(true)
    const token = localStorage.getItem('token')

    const res = await fetch(`/api/tickets/${sidebarTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: newMsg.trim() }),
    })

    if (res.ok) {
      setNewMsg('')
      mutate('/api/tickets')
      mutate(`/api/tickets/${sidebarTicket.id}/messages`)
      await refreshTicket()
      chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      showToast('Erro ao enviar', 'error')
    }
    setSending(false)
  }

  const handleAssign = async () => {
    if (!sidebarTicket) return
    setAssigning(true)
    const token = localStorage.getItem('token')
    const action = sidebarTicket.assignedTo ? 'unassign' : 'assign'
    const res = await fetch(`/api/tickets/${sidebarTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      showToast(sidebarTicket.assignedTo ? 'Atribuição removida' : 'Ticket assumido!', 'success')
      mutate('/api/tickets')
      await refreshTicket()
    } else {
      showToast('Erro', 'error')
    }
    setAssigning(false)
  }

  const handleBlock = async () => {
    if (!sidebarTicket) return
    setBlocking(true)
    const token = localStorage.getItem('token')
    const action = sidebarTicket.blockedAt ? 'unblock' : 'block'
    const res = await fetch(`/api/tickets/${sidebarTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      showToast(sidebarTicket.blockedAt ? 'Usuário desbloqueado' : 'Usuário bloqueado', 'success')
      mutate('/api/tickets')
      mutate(`/api/tickets/${sidebarTicket.id}/messages`)
      await refreshTicket()
      chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      showToast('Erro', 'error')
    }
    setBlocking(false)
  }

  const handleClose = async (id) => {
    const token = localStorage.getItem('token')
    await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'closed' }),
    })
    mutate('/api/tickets')
    mutate(`/api/tickets/${id}`)
    mutate(`/api/tickets/${id}/messages`)
    if (sidebarTicket?.id === id) setSidebarTicket(prev => ({ ...prev, status: 'closed' }))
    await refreshTicket()
    showToast('Ticket fechado', 'success')
  }

  const handleDeliver = async () => {
    if (!sidebarTicket) return
    setDelivering(true)
    const token = localStorage.getItem('token')

    const res = await fetch(`/api/tickets/${sidebarTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'deliver' }),
    })

    if (res.ok) {
      showToast('Produto entregue com sucesso!', 'success')
      mutate('/api/tickets')
      mutate(`/api/tickets/${sidebarTicket.id}`)
      mutate(`/api/tickets/${sidebarTicket.id}/messages`)
      setSidebarTicket(prev => ({ ...prev, status: 'closed' }))
      await refreshTicket()
      chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      showToast('Erro ao entregar', 'error')
    }
    setDelivering(false)
  }

  const handleToggleReply = async () => {
    if (!sidebarTicket) return
    setTogglingReply(true)
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/tickets/${sidebarTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'toggleUserReply' }),
    })
    if (res.ok) {
      const data = await res.json()
      setSidebarTicket(prev => ({ ...prev, allowUserReply: data.allowUserReply }))
      showToast(data.allowUserReply ? 'Usuário pode responder' : 'Resposta do usuário bloqueada', 'success')
      mutate('/api/tickets')
      mutate(`/api/tickets/${sidebarTicket.id}`)
      mutate(`/api/tickets/${sidebarTicket.id}/messages`)
      await refreshTicket()
    } else {
      showToast('Erro ao alterar', 'error')
    }
    setTogglingReply(false)
  }

  const statusBadge = (ticket) => {
    if (ticket.deliveredAt) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">Entregue</span>
    if (ticket.blockedAt) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">Bloqueado</span>
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        ticket.status === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
        ticket.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
        'text-gray-400 bg-gray-500/10 border border-gray-500/30'
      }`}>
        {ticket.status === 'open' ? 'Aberto' : ticket.status === 'waiting' ? 'Aguardando' : 'Fechado'}
      </span>
    )
  }

  const typeBadge = (ticket) => {
    const map = {
      support: { label: 'Suporte', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      delivery: { label: 'Entrega', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      complaint: { label: 'Reclamação', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
      question: { label: 'Dúvida', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
      other: { label: 'Outro', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
    }
    const t = map[ticket.category] || map.support
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.color}`}>{t.label}</span>
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Tickets</h2>
          <p className="text-gray-400 text-sm">Atendimento ao cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export?type=tickets" className="btn-cartoon-outline text-sm gap-2">
            <HiDownload className="text-lg" /> Exportar CSV
          </a>
          <button onClick={() => mutate('/api/tickets')} className="btn-cartoon-outline text-sm gap-2">
            <HiRefresh className="text-lg" /> Atualizar
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilterTab(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterTab === tab.key ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30 hover:text-green-neon'
            }`}
          >{tab.icon} {tab.label}</button>
        ))}
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-96 overflow-y-auto space-y-2 flex-shrink-0 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
            </div>
          ) : !tickets || tickets.length === 0 ? (
            <div className="card-cartoon text-center py-8">
              <p className="text-gray-400 text-sm">Nenhum ticket</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => selectTicket(ticket)}
                className={`w-full text-left card-cartoon p-3.5 transition-all ${
                  sidebarTicket?.id === ticket.id ? 'border-green-neon/50' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="font-cartoon text-xs text-green-neon">#{ticket.id}</span>
                  {statusBadge(ticket)}
                  {typeBadge(ticket)}
                </div>
                <p className="text-sm text-white truncate mb-0.5">{ticket.subject}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {ticket.user?.username}
                    {ticket.assignee && <span className="ml-1.5 text-green-500">· {ticket.assignee.username}</span>}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 bg-dark-50 border-2 border-dark-100 rounded-2xl flex flex-col overflow-hidden">
          {sidebarTicket ? (
            <>
              <div className={`p-4 border-b-2 flex items-center justify-between ${sidebarTicket.deliveredAt ? 'border-green-neon/30 bg-green-neon/5' : sidebarTicket.blockedAt ? 'border-red-500/30 bg-red-500/5' : 'border-dark-100'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-cartoon text-green-neon text-sm">#{sidebarTicket.id}</span>
                    {typeBadge(sidebarTicket)}
                    {sidebarTicket.deliveredAt && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/30">✓ Entregue</span>}
                    {sidebarTicket.blockedAt && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/30">🔇 Bloqueado</span>}
                  </div>
                  <h3 className="text-white font-medium text-sm truncate">{sidebarTicket.subject}</h3>
                  <p className="text-xs text-gray-500">
                    {sidebarTicket.user?.username}
                    {sidebarTicket.assignee && <> · 👤 {sidebarTicket.assignee.username}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <button onClick={handleAssign} disabled={assigning}
                    className={`flex items-center gap-1 text-xs transition-colors px-2.5 py-1.5 rounded-lg disabled:opacity-50 ${
                      sidebarTicket.assignedTo
                        ? 'text-gray-400 hover:text-gray-300 bg-gray-500/10'
                        : 'text-green-400 hover:text-green-300 bg-green-500/10'
                    }`}
                    title={sidebarTicket.assignedTo ? 'Remover atribuição' : 'Assumir ticket'}
                  >
                    <HiUserAdd className={assigning ? 'animate-spin' : ''} />
                    {sidebarTicket.assignedTo ? 'Sair' : 'Assumir'}
                  </button>

                  {!sidebarTicket.deliveredAt && (
                    <button onClick={handleBlock} disabled={blocking}
                      className={`flex items-center gap-1 text-xs transition-colors px-2.5 py-1.5 rounded-lg disabled:opacity-50 ${
                        sidebarTicket.blockedAt
                          ? 'text-green-400 hover:text-green-300 bg-green-500/10'
                          : 'text-red-400 hover:text-red-300 bg-red-500/10'
                      }`}
                      title={sidebarTicket.blockedAt ? 'Desbloquear usuário' : 'Bloquear usuário'}
                    >
                      <HiBan className={blocking ? 'animate-spin' : ''} />
                      {sidebarTicket.blockedAt ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  )}

                  {sidebarTicket.type === 'delivery' && !sidebarTicket.deliveredAt && (
                    <>
                      <button onClick={handleToggleReply} disabled={togglingReply}
                        className={`flex items-center gap-1 text-xs transition-colors px-2.5 py-1.5 rounded-lg disabled:opacity-50 ${
                          sidebarTicket.allowUserReply
                            ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-500/10'
                            : 'text-gray-400 hover:text-gray-300 bg-gray-500/10'
                        }`}
                      >
                        {togglingReply ? '...' : sidebarTicket.allowUserReply ? 'Bloquear User' : 'Permitir User'}
                      </button>
                      <button onClick={handleDeliver} disabled={delivering}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors px-2.5 py-1.5 rounded-lg bg-green-500/10 disabled:opacity-50"
                      >
                        <HiKey className={`${delivering ? 'animate-spin' : ''}`} />
                        {delivering ? '...' : 'Entregar'}
                      </button>
                    </>
                  )}

                  {sidebarTicket.status !== 'closed' && !sidebarTicket.deliveredAt && (
                    <button onClick={() => handleClose(sidebarTicket.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors px-2.5 py-1.5 rounded-lg bg-red-500/10"
                    >
                      <HiX /> Fechar
                    </button>
                  )}
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${sidebarTicket.deliveredAt ? 'bg-green-neon/[0.02]' : sidebarTicket.blockedAt ? 'bg-red-500/[0.02]' : ''}`}>
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Nenhuma mensagem</div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.senderType === 'admin'
                    const isSystem = msg.senderType === 'system'
                    const isBlockedMsg = msg.message.startsWith('🔇')
                    const isUnblockedMsg = msg.message.startsWith('🔊')
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isSystem
                            ? isBlockedMsg
                              ? 'bg-red-500/10 border border-red-500/30'
                              : isUnblockedMsg
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-green-neon/10 border border-green-neon/30'
                            : isAdmin
                              ? 'bg-green-neon/20 rounded-br-md'
                              : 'bg-dark-100 rounded-bl-md'
                        }`}>
                          {isSystem && !isBlockedMsg && !isUnblockedMsg && <span className="text-base block mb-0.5">🎉</span>}
                          <p className={`text-sm whitespace-pre-wrap ${
                            isSystem
                              ? isBlockedMsg
                                ? 'text-red-400 font-medium'
                                : isUnblockedMsg
                                  ? 'text-green-400 font-medium'
                                  : 'text-green-neon font-medium'
                              : 'text-gray-200'
                          }`}>
                            {msg.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(msg.createdAt).toLocaleString('pt-BR')}
                            {isAdmin ? ' · Você' : isSystem ? ' · Sistema' : ` · ${sidebarTicket.user?.username}`}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEnd} />
              </div>

              {sidebarTicket.status !== 'closed' && !sidebarTicket.deliveredAt && !sidebarTicket.blockedAt && (
                <div className="p-4 border-t-2 border-dark-100">
                  <form onSubmit={handleSend} className="flex gap-3">
                    <input
                      type="text"
                      className="input-cartoon flex-1 !bg-dark-900"
                      placeholder="Responder..."
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      disabled={sending}
                    />
                    <button type="submit" disabled={sending || !newMsg.trim()}
                      className="btn-cartoon !px-4 disabled:opacity-50"
                    >
                      <HiPaperAirplane className={`text-xl ${sending ? 'animate-spin' : ''}`} />
                    </button>
                  </form>
                </div>
              )}

              {sidebarTicket.blockedAt && !sidebarTicket.deliveredAt && (
                <div className="p-4 border-t-2 border-red-500/30 bg-red-500/5">
                  <div className="text-center">
                    <p className="text-xs text-red-400">Usuário bloqueado. Apenas admin pode ver mensagens.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-5xl mb-3">💬</p>
                <p>Selecione um ticket para responder</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
