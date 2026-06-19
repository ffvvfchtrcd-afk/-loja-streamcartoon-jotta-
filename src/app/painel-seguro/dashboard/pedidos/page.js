'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { HiCheck, HiX, HiEye, HiShoppingCart, HiRefresh, HiSearch, HiUser, HiTicket, HiKey, HiDownload } from 'react-icons/hi'
import Link from 'next/link'
import Toast, { useToast } from '@/components/Toast'
import { Suspense } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'

function PedidosContent() {
  const searchParams = useSearchParams()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search, setSearch] = useState('')
  const { toast, showToast, closeToast } = useToast()
  const { mutate } = useSWRConfig()
  const filterStatus = searchParams.get('status') || ''
  const { data: orders, isLoading } = useSWR(
    filterStatus ? `/api/orders?status=${filterStatus}` : '/api/orders',
    adminFetcher
  )

  const filtered = (orders || []).filter(o => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return o.id.toString().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.product?.name?.toLowerCase().includes(q)
  })

  const handleStatus = async (id, status) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })

    const data = await res.json()
    if (res.ok) {
      const msg = status === 'paid' ? `Pedido #${id} confirmado!` : `Pedido #${id} ${status === 'cancelled' ? 'cancelado' : 'atualizado'}`
      showToast(msg, 'success')
      mutate('/api/orders')
      if (selectedOrder?.id === id) setSelectedOrder(data)
    } else {
      showToast(data.error || 'Erro ao atualizar pedido', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Pedidos</h2>
          <p className="text-gray-400 text-sm">Gerencie os pedidos da loja</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export?type=orders" className="btn-cartoon-outline text-sm gap-2">
            <HiDownload className="text-lg" /> Exportar CSV
          </a>
          <button onClick={() => mutate('/api/orders')} className="btn-cartoon-outline text-sm gap-2">
            <HiRefresh className="text-lg" /> Atualizar
          </button>
        </div>
      </div>

      <div className="relative max-w-md mb-4">
        <input
          type="text"
          className="input-cartoon pl-10"
          placeholder="Buscar por ID, nome, email ou produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: 'Todos', value: '' },
          { label: 'Pendentes', value: 'pending' },
          { label: 'Pagos', value: 'paid' },
          { label: 'Entregues', value: 'delivered' },
          { label: 'Cancelados', value: 'cancelled' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => window.location.href = `/admin/dashboard/pedidos${f.value ? `?status=${f.value}` : ''}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === f.value
                ? 'bg-green-neon text-dark-950'
                : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30 hover:text-green-neon'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiShoppingCart className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{search ? 'Nenhum pedido encontrado para esta busca' : 'Nenhum pedido encontrado'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="card-cartoon p-5 animate-slide-up">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-cartoon text-green-neon">#{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium uppercase
                      ${order.status === 'paid' ? 'status-paid' : order.status === 'cancelled' ? 'status-cancelled' : order.status === 'delivered' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'status-pending'}`}>
                      {order.status === 'paid' ? 'Pago' : order.status === 'delivered' ? 'Entregue' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                      order.product?.deliveryType === 'auto_v2'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                      {order.product?.deliveryType === 'auto_v2' ? 'Via Ticket' : 'Auto'}
                    </span>
                    {order.ticket && (
                      <Link href={`/admin/dashboard/tickets`} className="flex items-center gap-1 text-xs text-purple-400 hover:underline">
                        <HiTicket className="text-sm" /> Ticket #{order.ticket.id}
                      </Link>
                    )}
                  </div>
                  <h3 className="text-white font-medium">{order.customerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{order.customerEmail}</span>
                    {order.user && (
                      <Link href={`/admin/dashboard/usuarios/${order.user.id}`} className="flex items-center gap-1 text-green-neon hover:underline">
                        <HiUser className="text-sm" /> {order.user.username}
                      </Link>
                    )}
                  </div>
                  {order.customerWhats && <p className="text-sm text-gray-500">{order.customerWhats}</p>}
                  <p className="text-sm text-gray-400 mt-1">
                    {order.product?.name} — <span className="text-green-neon font-medium">R$ {order.total.toFixed(2)}</span>
                  </p>
                  {order.deliveredCode && (
                    <p className="text-xs text-green-400 mt-1 font-mono flex items-center gap-1">
                      <HiKey className="text-xs" /> Código: {order.deliveredCode}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    title="Detalhes"
                  >
                    <HiEye className="text-lg" />
                  </button>
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatus(order.id, 'paid')}
                        className="p-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Confirmar pagamento"
                      >
                        <HiCheck className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleStatus(order.id, 'cancelled')}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Cancelar"
                      >
                        <HiX className="text-lg" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="card-cartoon w-full max-w-lg p-8 animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-cartoon text-xl text-white mb-4">
              Pedido #{selectedOrder.id}
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Cliente:</span> <span className="text-white">{selectedOrder.customerName}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="text-white">{selectedOrder.customerEmail}</span></div>
              {selectedOrder.customerWhats && <div><span className="text-gray-500">WhatsApp:</span> <span className="text-white">{selectedOrder.customerWhats}</span></div>}
              {selectedOrder.user && (
                <div><span className="text-gray-500">Usuário:</span> <Link href={`/admin/dashboard/usuarios/${selectedOrder.user.id}`} className="text-green-neon hover:underline">{selectedOrder.user.username}</Link></div>
              )}
              <div><span className="text-gray-500">Produto:</span> <span className="text-white">{selectedOrder.product?.name}</span></div>
              <div><span className="text-gray-500">Entrega:</span> <span className={`text-xs font-medium uppercase ${selectedOrder.product?.deliveryType === 'auto_v2' ? 'text-purple-400' : 'text-green-400'}`}>{selectedOrder.product?.deliveryType === 'auto_v2' ? 'Via Ticket' : 'Automática'}</span></div>
              <div><span className="text-gray-500">Total:</span> <span className="text-green-neon font-bold">R$ {selectedOrder.total.toFixed(2)}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={`font-medium uppercase ${selectedOrder.status === 'paid' ? 'text-green-400' : selectedOrder.status === 'delivered' ? 'text-green-300' : selectedOrder.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}`}>{selectedOrder.status === 'delivered' ? 'Entregue' : selectedOrder.status}</span></div>
              <div><span className="text-gray-500">Data:</span> <span className="text-white">{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</span></div>
              {selectedOrder.deliveredCode && (
                <div>
                  <span className="text-gray-500">Código entregue:</span>
                  <p className="text-green-neon font-bold text-lg font-mono mt-1 select-all">{selectedOrder.deliveredCode}</p>
                </div>
              )}
              {selectedOrder.pixCode && (
                <div>
                  <span className="text-gray-500">Código PIX:</span>
                  <p className="text-gray-400 text-xs font-mono break-all mt-1">{selectedOrder.pixCode}</p>
                </div>
              )}
              {selectedOrder.ticket && (
                <div>
                  <span className="text-gray-500">Ticket:</span>
                  <Link href={`/admin/dashboard/tickets`} className="text-purple-400 hover:underline">
                    #{selectedOrder.ticket.id} - {selectedOrder.ticket.subject}
                  </Link>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              {selectedOrder.status === 'pending' && (
                <>
                  <button onClick={() => { handleStatus(selectedOrder.id, 'paid'); setSelectedOrder(null) }} className="btn-cartoon flex-1 text-sm">
                    Confirmar Pagamento
                  </button>
                  <button onClick={() => { handleStatus(selectedOrder.id, 'cancelled'); setSelectedOrder(null) }} className="btn-cartoon-outline flex-1 text-sm text-red-400 border-red-400 hover:bg-red-500/10">
                    Cancelar
                  </button>
                </>
              )}
              <button onClick={() => setSelectedOrder(null)} className="btn-cartoon-outline flex-1 text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}

export default function AdminPedidos() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" /></div>}>
      <PedidosContent />
    </Suspense>
  )
}
