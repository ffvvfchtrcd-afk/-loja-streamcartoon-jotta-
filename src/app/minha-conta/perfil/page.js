'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { HiUser, HiArrowLeft, HiSave, HiShoppingCart, HiTicket, HiCheckCircle, HiCash, HiKey, HiEye, HiEyeOff } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

export default function PerfilPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const router = useRouter()
  const { toast, showToast, closeToast } = useToast()

  const { data: user, error, isLoading } = useSWR('/api/auth/me', userFetcher)

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) router.push('/login')
  }, [router])

  useEffect(() => {
    if (error?.status === 401) router.push('/login')
  }, [error, router])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      showToast('Preencha todos os campos', 'warning')
      return
    }
    if (newPassword.length < 4) {
      showToast('Nova senha deve ter no mínimo 4 caracteres', 'warning')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Senhas não conferem', 'warning')
      return
    }

    setSaving(true)
    const token = localStorage.getItem('user_token')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    if (res.ok) {
      showToast('Senha alterada com sucesso!', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      const data = await res.json()
      showToast(data.error || 'Erro ao alterar senha', 'error')
    }
    setSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const stats = user.stats || {}

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/minha-conta" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-cartoon text-xl text-white">Stream<span className="text-green-neon">Cartoon</span></h1>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="title-cartoon text-3xl text-white mb-1">Meu Perfil</h2>
            <p className="text-gray-400 text-sm">Suas informações e configurações</p>
          </div>
        </div>

        <div className="card-cartoon p-8 mb-8 animate-bounce-in text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-neon/20 to-green-neon/5 border-4 border-green-neon/30 flex items-center justify-center text-5xl mx-auto mb-4">
            <HiUser className="text-green-neon" />
          </div>
          <h3 className="text-2xl font-bold text-white">{user.username}</h3>
          <p className="text-gray-400 text-sm">Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: HiShoppingCart, label: 'Total Pedidos', value: stats.totalOrders || 0, color: 'text-blue-400' },
            { icon: HiCheckCircle, label: 'Entregues', value: stats.deliveredCount || 0, color: 'text-green-400' },
            { icon: HiTicket, label: 'Tickets', value: stats.ticketCount || 0, color: 'text-purple-400' },
            { icon: HiCash, label: 'Total Gasto', value: `R$ ${(stats.totalSpent || 0).toFixed(2)}`, color: 'text-green-neon' },
          ].map((item, i) => (
            <div key={i} className="card-cartoon p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <item.icon className={`text-2xl mx-auto mb-2 ${item.color}`} />
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="card-cartoon p-6 animate-slide-up">
          <h3 className="font-cartoon text-lg text-white mb-6">Alterar Senha</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha Atual</label>
              <input type="password" className="input-cartoon" placeholder="••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input-cartoon pr-10" placeholder="mínimo 4 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPwd ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
              <input type="password" className="input-cartoon" placeholder="repita a nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={saving} className="btn-cartoon gap-2 disabled:opacity-50">
              <HiSave className="text-lg" /> {saving ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
