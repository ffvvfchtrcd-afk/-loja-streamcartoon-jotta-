'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiUser, HiShoppingCart, HiTicket, HiCash, HiClock, HiCheckCircle, HiXCircle, HiChat } from 'react-icons/hi'
import { adminFetcher } from '@/lib/fetcher'

const statusConfig = {
  pending: { icon: HiClock, label: 'Aguardando', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  paid: { icon: HiCheckCircle, label: 'Pago', color: 'text-green-400', bg: 'bg-green-500/10' },
  cancelled: { icon: HiXCircle, label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
}

export default function AdminUserDetail() {
  const params = useParams()
  const [tab, setTab] = useState('orders')

  const { data: user, isLoading } = useSWR(`/api/admin/users/${params.id}`, adminFetcher)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return (
    <div className="text-center py-12">
      <p className="text-gray-400">Usuário não encontrado</p>
      <Link href="/admin/dashboard/usuarios" className="btn-cartoon mt-4 inline-flex">← Voltar</Link>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard/usuarios" className="text-gray-400 hover:text-green-neon">
          <HiArrowLeft className="text-2xl" />
        </Link>
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Usuário</h2>
          <p className="text-gray-400 text-sm">Detalhes da conta</p>
        </div>
      </div>

      <div className="card-cartoon p-6 mb-6 animate-bounce-in">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-neon/20 to-green-neon/5 border-4 border-green-neon/30 flex items-center justify-center text-3xl">
            <HiUser className="text-green-neon" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">{user.username}</h3>
            <p className="text-sm text-gray-400">Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{user.orderCount}</p>
              <p className="text-xs text-gray-500">Pedidos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{user.paidCount}</p>
              <p className="text-xs text-gray-500">Pagos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{user.ticketCount}</p>
              <p className="text-xs text-gray-500">Tickets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-neon">R$ {user.totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Gasto</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('orders')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'orders' ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30'}`}>
          <HiShoppingCart className="inline mr-1.5" /> Pedidos ({user.orders?.length || 0})
        </button>
        <button onClick={() => setTab('tickets')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'tickets' ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30'}`}>
          <HiTicket className="inline mr-1.5" /> Tickets ({user.tickets?.length || 0})
        </button>
      </div>

      {tab === 'orders' && (
        <div className="space-y-3">
          {user.orders?.length === 0 ? (
            <div className="card-cartoon text-center py-8"><HiShoppingCart className="text-4xl text-gray-600 mx-auto mb-2" /><p className="text-gray-400">Nenhum pedido</p></div>
          ) : (
            user.orders?.map(order => {
              const st = statusConfig[order.status] || statusConfig.pending
              return (
                <div key={order.id} className="card-cartoon p-4 flex items-center gap-4 animate-slide-up">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-cartoon text-green-neon text-sm">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-white">{order.product?.name}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-neon font-bold">R$ {order.total.toFixed(2)}</p>
                    {order.deliveredCode && <p className="text-xs text-green-400 font-mono">{order.deliveredCode}</p>}
                    {order.tickets?.length > 0 && <p className="text-xs text-purple-400">{order.tickets.length} ticket(s)</p>}
                  </div>
                  <Link href={`/admin/dashboard/pedidos?search=${order.id}`} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                    <HiArrowLeft className="rotate-180" />
                  </Link>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-3">
          {user.tickets?.length === 0 ? (
            <div className="card-cartoon text-center py-8"><HiTicket className="text-4xl text-gray-600 mx-auto mb-2" /><p className="text-gray-400">Nenhum ticket</p></div>
          ) : (
            user.tickets?.map(ticket => {
              const lastMsg = ticket.messages?.[0]
              return (
                <Link key={ticket.id} href={`/admin/dashboard/tickets`} className="card-cartoon p-4 flex items-center gap-4 hover:border-green-neon/40 transition-all animate-slide-up">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-cartoon text-green-neon text-sm">#{ticket.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-green-500/10 text-green-400' :
                        ticket.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'
                      }`}>{ticket.status}</span>
                      {ticket.order && <span className="text-xs text-gray-500">Pedido #{ticket.order.id}</span>}
                    </div>
                    <p className="text-sm text-white truncate">{ticket.subject}</p>
                    {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.message}</p>}
                  </div>
                  <HiChat className="text-gray-500 text-xl" />
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
