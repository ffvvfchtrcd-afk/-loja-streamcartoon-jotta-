'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { HiUser, HiLogout, HiClock, HiCheckCircle, HiXCircle, HiShoppingCart, HiTicket, HiKey, HiCash, HiViewGrid } from 'react-icons/hi'

const statusConfig = {
  pending: { icon: HiClock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Aguardando Pagamento' },
  paid: { icon: HiCheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Pago' },
  cancelled: { icon: HiXCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelado' },
}

export default function MinhaConta() {
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) router.push('/login')
  }, [router])

  const { data: user, error, isLoading } = useSWR('/api/auth/me', userFetcher)

  useEffect(() => {
    if (error?.status === 401) {
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_username')
      router.push('/login')
    }
  }, [error, router])

  const handleLogout = () => {
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_username')
    router.push('/')
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  const s = user.stats || {}
  const orders = user.orders || []
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const navCards = [
    { icon: HiShoppingCart, label: 'Meus Pedidos', desc: `${s.totalOrders || 0} pedidos`, href: '/minha-conta', color: 'text-green-neon' },
    { icon: HiTicket, label: 'Meus Tickets', desc: `${s.openTickets || 0} abertos`, href: '/minha-conta/tickets', color: 'text-purple-400' },
    { icon: HiKey, label: 'Produtos Entregues', desc: `${s.deliveredCount || 0} códigos`, href: '/minha-conta?filter=paid', color: 'text-green-400' },
    { icon: HiUser, label: 'Meu Perfil', desc: `Membro desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}`, href: '/minha-conta/perfil', color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-cartoon text-xl text-white">Stream<span className="text-green-neon">Cartoon</span></h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 flex items-center gap-1.5">
              <HiUser className="text-green-neon" /> {user.username}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors">
              <HiLogout /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="title-cartoon text-3xl text-white mb-1">Minha Conta</h2>
            <p className="text-gray-400 text-sm">Bem-vindo, {user.username}!</p>
          </div>
          <Link href="/" className="btn-cartoon text-sm gap-2">← Comprar Mais</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {navCards.map((card, i) => (
            <Link
              key={i}
              href={card.href}
              className={`card-cartoon p-5 flex items-center gap-4 hover:border-green-neon/40 transition-all group animate-slide-up ${card.href === '/minha-conta' ? 'border-green-neon/30' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={card.href === '/minha-conta?filter=paid' ? (e) => { e.preventDefault(); setFilter('paid') } : undefined}
            >
              <div className="w-14 h-14 rounded-2xl bg-green-neon/10 border-2 border-green-neon/30 flex items-center justify-center text-3xl group-hover:animate-wiggle">
                <card.icon className={card.color} />
              </div>
              <div className="flex-1">
                <h3 className="font-cartoon text-lg text-white group-hover:text-green-neon transition-colors">{card.label}</h3>
                <p className="text-sm text-gray-400">{card.desc}</p>
              </div>
              <span className="text-green-neon text-2xl">→</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cartoon text-xl text-white flex items-center gap-2">
            <HiShoppingCart className="text-green-neon" /> Meus Pedidos
          </h3>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { label: 'Todos', value: 'all' },
            { label: 'Pendentes', value: 'pending' },
            { label: 'Entregues', value: 'paid' },
            { label: 'Cancelados', value: 'cancelled' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30'
              }`}
            >
              {f.label} {f.value !== 'all' && `(${f.value === 'pending' ? s.pendingCount || 0 : f.value === 'paid' ? s.deliveredCount || 0 : s.cancelledCount || 0})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card-cartoon text-center py-12">
            <HiShoppingCart className="text-5xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">
              {filter === 'paid' ? 'Nenhum produto entregue ainda' : filter === 'pending' ? 'Nenhum pedido pendente' : 'Nenhum pedido encontrado'}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-sm text-green-neon hover:underline">Ver todos os pedidos</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const st = statusConfig[order.status] || statusConfig.pending
              const Icon = st.icon
              return (
                <Link
                  key={order.id}
                  href={`/minha-conta/pedidos/${order.id}`}
                  className="card-cartoon p-5 block hover:border-green-neon/40 transition-all animate-slide-up group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-cartoon text-green-neon">#{order.id}</span>
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium ${st.bg} ${st.color}`}>
                          <Icon className="text-sm" /> {st.label}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">{order.product?.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-green-neon font-bold text-lg">R$ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 uppercase">{order.paymentMethod}</p>
                    </div>
                  </div>
                  {order.deliveredCode && (
                    <div className="mt-3 p-3 rounded-xl bg-green-neon/10 border border-green-neon/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Código de Acesso</p>
                        <p className="text-lg font-bold text-green-neon font-mono tracking-wider">{order.deliveredCode}</p>
                      </div>
                      <span className="text-green-neon text-lg">→</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
