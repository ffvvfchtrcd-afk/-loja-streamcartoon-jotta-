'use client'

import { useState, useEffect } from 'react'
import { HiSave, HiShieldCheck } from 'react-icons/hi'
import MaintenanceToggle from '@/components/MaintenanceToggle'
import Toast, { useToast } from '@/components/Toast'

export default function AdminConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast, showToast, closeToast } = useToast()

  const [form, setForm] = useState({
    store_name: 'StreamCartoon',
    mercadopago_token: '',
  })

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data) {
        setForm(prev => ({ ...prev, ...data }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      showToast('Configurações salvas com sucesso!', 'success')
    } else {
      showToast('Erro ao salvar configurações', 'error')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="title-cartoon text-3xl text-white mb-1">Configurações</h2>
        <p className="text-gray-400 text-sm">Configure sua loja e integrações</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card-cartoon p-6">
          <h3 className="font-cartoon text-lg text-white mb-4">Informações da Loja</h3>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome da Loja</label>
            <input
              className="input-cartoon"
              value={form.store_name}
              onChange={e => setForm({ ...form, store_name: e.target.value })}
            />
          </div>
        </div>

        <div className="card-cartoon p-6 border-green-neon/30">
          <h3 className="font-cartoon text-lg text-white mb-4 flex items-center gap-2">
            <HiShieldCheck className="text-green-neon" /> Mercado Pago
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Access Token (Produção)</label>
              <div className="relative">
                <input
                  className="input-cartoon font-mono text-sm pr-20"
                  type="password"
                  placeholder="APP_USR-..."
                  value={form.mercadopago_token}
                  onChange={e => setForm({ ...form, mercadopago_token: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {form.mercadopago_token ? '🟢 Configurado' : '⚪ Usando .env'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Token de produção do Mercado Pago. Deixe em branco para usar o token do arquivo <code className="text-green-neon">.env</code>.
              </p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-cartoon gap-2 disabled:opacity-50">
          <HiSave className="text-xl" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>

      <MaintenanceToggle />

      <div className="card-cartoon p-6 mt-8">
        <h3 className="font-cartoon text-lg text-white mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Versão:</span> <span className="text-white">1.0.0</span></div>
          <div><span className="text-gray-500">Plataforma:</span> <span className="text-white">Next.js + Prisma</span></div>
          <div><span className="text-gray-500">PIX:</span> <span className="text-white">{form.mercadopago_token ? '🟢 Mercado Pago (configurado)' : '🟢 Mercado Pago (.env)'}</span></div>
          <div><span className="text-gray-500">Admin:</span> <span className="text-white">Configurado</span></div>
        </div>
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}


