'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import Link from 'next/link'
import { HiUser, HiSearch, HiEye, HiShoppingCart, HiTicket, HiCash, HiDownload } from 'react-icons/hi'

export default function AdminUsuarios() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: users, isLoading } = useSWR(
    `/api/admin/users${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`,
    adminFetcher
  )

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQuery(search)
  }

  const totalRevenue = (users || []).reduce((s, u) => s + u.totalSpent, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Usuários</h2>
          <p className="text-gray-400 text-sm">Gerencie os usuários da plataforma</p>
        </div>
        <a href="/api/admin/export?type=users" className="btn-cartoon-outline text-sm gap-2">
          <HiDownload className="text-lg" /> Exportar CSV
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-cartoon p-4 text-center">
          <HiUser className="text-3xl text-blue-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{(users || []).length}</p>
          <p className="text-sm text-gray-400">Total de Usuários</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <HiShoppingCart className="text-3xl text-green-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{(users || []).reduce((s, u) => s + u.orderCount, 0)}</p>
          <p className="text-sm text-gray-400">Total de Pedidos</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <HiCash className="text-3xl text-green-neon mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-400">Receita Total</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            className="input-cartoon pl-10"
            placeholder="Buscar por username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : (users || []).length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiUser className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <Link
              key={u.id}
              href={`/admin/dashboard/usuarios/${u.id}`}
              className="card-cartoon p-5 flex items-center gap-4 hover:border-green-neon/40 transition-all animate-slide-up group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-neon/20 to-green-neon/5 border-2 border-green-neon/30 flex items-center justify-center text-xl flex-shrink-0">
                <HiUser className="text-green-neon" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white group-hover:text-green-neon transition-colors">{u.username}</h3>
                <p className="text-xs text-gray-500">Membro desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-white font-bold">{u.orderCount}</p>
                  <p className="text-xs text-gray-500">Pedidos</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{u.ticketCount}</p>
                  <p className="text-xs text-gray-500">Tickets</p>
                </div>
                <div className="text-center">
                  <p className="text-green-neon font-bold">{u.paidOrders}</p>
                  <p className="text-xs text-gray-500">Pagos</p>
                </div>
                <div className="text-center">
                  <p className="text-green-neon font-bold">R$ {u.totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
              <HiEye className="text-gray-500 group-hover:text-green-neon text-xl" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
