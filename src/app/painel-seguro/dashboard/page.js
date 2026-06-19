'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { adminFetcher } from '@/lib/fetcher'
import { HiCube, HiShoppingCart, HiKey, HiCash, HiTrendingUp, HiClock, HiUser, HiExclamation, HiEye, HiTicket } from 'react-icons/hi'

export default function Dashboard() {
  const { data: products } = useSWR('/api/products', adminFetcher)
  const { data: orders } = useSWR('/api/orders', adminFetcher)
  const { data: codes } = useSWR('/api/codes', adminFetcher)
  const { data: notifs } = useSWR('/api/notifications', adminFetcher)
  const { data: chartData } = useSWR('/api/admin/stats', adminFetcher)
  const isLoading = !products || !orders || !codes || !notifs

  const pending = (orders || []).filter(o => o.status === 'pending').length
  const paid = (orders || []).filter(o => o.status === 'paid').length
  const revenue = (orders || []).filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0)

  const stats = {
    products: (products || []).length,
    orders: (orders || []).length,
    pending,
    paid,
    codes: (codes || []).length,
    revenue,
  }

  const aux = {
    totalUsers: notifs?.totalUsers || 0,
    lowStockCount: notifs?.lowStockCount || 0,
    lowStockProducts: notifs?.lowStockProducts || [],
    pendingDeliveries: notifs?.deliveryTickets || 0,
  }

  const recentOrders = (orders || []).slice(0, 5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: 'Produtos', value: stats.products, icon: HiCube, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', href: '/admin/dashboard/produtos' },
    { label: 'Pedidos', value: stats.orders, icon: HiShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', href: '/admin/dashboard/pedidos' },
    { label: 'Usuários', value: aux.totalUsers, icon: HiUser, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', href: '/admin/dashboard/usuarios' },
    { label: 'Aguardando', value: stats.pending, icon: HiClock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', href: '/admin/dashboard/pedidos?status=pending' },
    { label: 'Faturamento', value: `R$ ${stats.revenue.toFixed(2)}`, icon: HiCash, color: 'text-green-neon', bg: 'bg-green-neon/10 border-green-neon/30', href: '/admin/dashboard/pedidos' },
    { label: 'Pagos', value: stats.paid, icon: HiTrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', href: '/admin/dashboard/pedidos?status=paid' },
    { label: 'Códigos', value: stats.codes, icon: HiKey, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30', href: '/admin/dashboard/codigos' },
    { label: 'Baixo Estoque', value: aux.lowStockCount, icon: HiExclamation, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', href: '/admin/dashboard/produtos' },
    { label: 'Entregas Pendentes', value: aux.pendingDeliveries || 0, icon: HiTicket, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', href: '/admin/dashboard/tickets?type=delivery' },
  ]

  return (
    <div>
      <h2 className="title-cartoon text-3xl text-white mb-2">Dashboard</h2>
      <p className="text-gray-400 text-sm mb-8">Visão geral da sua loja</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <Link key={i} href={card.href}
              className={`${card.bg} border-2 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-slide-up`}
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={card.color}><Icon className="text-2xl" /></span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-gray-400 text-sm">{card.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-cartoon">
          <h3 className="font-cartoon text-lg text-white mb-4 flex items-center gap-2">
            <HiClock className="text-green-neon" /> Pedidos Recentes
          </h3>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Nenhum pedido ainda</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-dark-100">
                    <th className="text-left pb-3 font-medium">#</th>
                    <th className="text-left pb-3 font-medium">Cliente</th>
                    <th className="text-left pb-3 font-medium">Produto</th>
                    <th className="text-left pb-3 font-medium">Total</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-dark-100/50 hover:bg-dark-50/50 transition-colors">
                      <td className="py-3 text-gray-400">#{order.id}</td>
                      <td className="py-3 text-white">{order.customerName}</td>
                      <td className="py-3 text-gray-300">{order.product?.name}</td>
                      <td className="py-3 text-green-neon font-medium">R$ {order.total.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium uppercase
                          ${order.status === 'paid' ? 'status-paid' : order.status === 'cancelled' ? 'status-cancelled' : 'status-pending'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link href="/admin/dashboard/pedidos" className="text-sm text-green-neon hover:underline">Ver todos →</Link>
          </div>
        </div>

        <div className="card-cartoon">
          <h3 className="font-cartoon text-lg text-white mb-4 flex items-center gap-2">
            <HiExclamation className="text-yellow-400" /> Produtos com Estoque Baixo
          </h3>
          {aux.lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Todos os produtos têm estoque suficiente ✅</p>
          ) : (
            <div className="space-y-3">
              {aux.lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <span className="text-white text-sm">{p.name}</span>
                  <span className="text-yellow-400 font-bold text-sm">{p.stock} unidade(s)</span>
                </div>
              ))}
              <div className="text-center mt-2">
                <Link href="/admin/dashboard/codigos" className="text-sm text-green-neon hover:underline">Adicionar códigos →</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="card-cartoon p-6">
            <h3 className="font-cartoon text-lg text-white mb-4">📈 Receita Mensal</h3>
            <div className="space-y-2">
              {chartData.monthlyRevenue.map((item, i) => {
                const max = Math.max(...chartData.monthlyRevenue.map(r => r.revenue), 1)
                const pct = (item.revenue / max) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.month}</span>
                      <span className="text-green-neon font-medium">R$ {item.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-dark-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-neon to-green-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card-cartoon p-6">
            <h3 className="font-cartoon text-lg text-white mb-4">📊 Pedidos por Dia</h3>
            <div className="flex items-end gap-1 h-40">
              {chartData.dailyOrders.map((item, i) => {
                const max = Math.max(...chartData.dailyOrders.map(d => d.count), 1)
                const pct = (item.count / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500">{item.count || ''}</span>
                    <div className="w-full bg-gradient-to-t from-green-neon to-green-400 rounded-t transition-all duration-500" style={{ height: `${pct}%`, minHeight: item.count > 0 ? '4px' : '2px' }} />
                    <span className="text-[8px] text-gray-600 rotate-45 origin-left whitespace-nowrap">{item.day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card-cartoon p-6 lg:col-span-2">
            <h3 className="font-cartoon text-lg text-white mb-4">🏆 Produtos Mais Vendidos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {chartData.topProducts.map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-dark-50 border border-dark-100">
                  <p className="text-2xl font-bold text-green-neon">{item.sales}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
