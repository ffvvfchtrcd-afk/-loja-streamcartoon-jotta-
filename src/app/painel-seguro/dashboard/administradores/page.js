'use client'

import { useState } from 'react'
import { HiPlus, HiTrash, HiShieldCheck } from 'react-icons/hi'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import Toast, { useToast } from '@/components/Toast'

export default function AdminAdministradores() {
  const { data: admins, isLoading } = useSWR('/api/admin/admins', adminFetcher)
  const { mutate } = useSWRConfig()
  const [showModal, setShowModal] = useState(false)
  const { toast, showToast, closeToast } = useToast()

  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' })

  const openCreate = () => {
    setForm({ username: '', password: '', confirmPassword: '' })
    setShowModal(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      showToast('Senhas não conferem', 'error')
      return
    }
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: form.username, password: form.password }),
    })
    if (res.ok) {
      showToast('Administrador criado!', 'success')
      setShowModal(false)
      mutate('/api/admin/admins')
    } else {
      const data = await res.json()
      showToast(data.error || 'Erro ao criar administrador', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este administrador?')) return
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      showToast('Administrador removido!', 'success')
      mutate('/api/admin/admins')
    } else {
      const data = await res.json()
      showToast(data.error || 'Erro ao remover administrador', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Administradores</h2>
          <p className="text-gray-400 text-sm">Gerencie os administradores do sistema</p>
        </div>
        <button onClick={openCreate} className="btn-cartoon text-sm gap-2">
          <HiPlus className="text-lg" /> Novo Admin
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : (admins || []).length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiShieldCheck className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum administrador encontrado</p>
        </div>
      ) : (
        <div className="card-cartoon overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-dark-100">
                <th className="text-left text-gray-500 font-medium px-4 py-3">ID</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Username</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Função</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">Data de criação</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(admins || []).map((admin, index) => (
                <tr key={admin.id} className={`border-b border-dark-100/50 hover:bg-dark-50 transition-colors ${index % 2 === 0 ? 'bg-dark-950/30' : ''}`}>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{admin.id}</td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{admin.username}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                      admin.role === 'superadmin'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}>
                      {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(admin.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remover administrador"
                    >
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card-cartoon w-full max-w-lg p-8 animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-cartoon text-xl text-white mb-6">Novo Administrador</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input className="input-cartoon" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Senha</label>
                <input type="password" className="input-cartoon" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirmar Senha</label>
                <input type="password" className="input-cartoon" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
                <button type="submit" className="btn-cartoon flex-1 text-sm">Criar Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
