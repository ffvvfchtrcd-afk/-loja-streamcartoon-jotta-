'use client'

import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { useState } from 'react'
import Toast, { useToast } from '@/components/Toast'

const PERIODOS = [
  { key: 'manha', label: '🌅 Manhã' },
  { key: 'tarde', label: '☀️ Tarde' },
  { key: 'noite', label: '🌙 Noite' },
]

export default function V2Config() {
  const { mutate } = useSWRConfig()
  const { toast, showToast, closeToast } = useToast()
  const { data: config, mutate: mutateConfig } = useSWR('/api/admin/banca/config', adminFetcher)
  const { data: allOps } = useSWR('/api/admin/banca/operacoes', adminFetcher)
  const [resetting, setResetting] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const data = {}
    for (const [key, val] of form.entries()) {
      if (key === 'payout') data[key] = (parseFloat(val) || 0) / 100
      else if (key === 'maxGales') data[key] = parseInt(val) || 0
      else data[key] = parseFloat(val) || 0
    }
    const res = await fetch('/api/admin/banca/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(data),
    })
    if (res.ok) { showToast('Configurações salvas!', 'success'); mutateConfig() }
    else { showToast('Erro ao salvar', 'error') }
  }

  const handleResetBanca = () => {
    if (!confirm('Tem certeza? Isso vai zerar todas as operações e resetar a banca para 0.')) return
    setResetting(true)
    Promise.all((allOps || []).map(op =>
      fetch(`/api/admin/banca/operacoes/${op.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
    )).then(() => {
      fetch('/api/admin/banca/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bancaAtual: 0 }),
      }).then(() => {
        showToast('Banca resetada!', 'success')
        mutateConfig(); mutate()
        setResetting(false)
      })
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="title-cartoon text-3xl text-white mb-1">⚙️ Configurações</h2>
        <p className="text-gray-400 text-sm">Configure sua banca e estratégia</p>
      </div>

      {config && (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Banca */}
          <div className="card-cartoon p-5">
            <h3 className="text-white font-medium mb-4">💰 Banca</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Banca Atual (R$)</label>
                <input name="bancaAtual" defaultValue={config.bancaAtual} step="0.01" type="number" className="input-cartoon text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Valor da Entrada (R$)</label>
                <input name="valorEntrada" defaultValue={config.valorEntrada} step="0.01" type="number" className="input-cartoon text-sm" />
              </div>
            </div>
          </div>

          {/* Estratégia */}
          <div className="card-cartoon p-5">
            <h3 className="text-white font-medium mb-4">📈 Estratégia</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Payout (%)</label>
                <input name="payout" defaultValue={config.payout * 100} step="1" type="number" className="input-cartoon text-sm" placeholder="80" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Máx Gales</label>
                <select name="maxGales" defaultValue={config.maxGales} className="input-cartoon text-sm">
                  <option value="0">0 (sem gales)</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Multiplicador G1</label>
                <input name="galeMultiplier1" defaultValue={config.galeMultiplier1} step="0.1" type="number" className="input-cartoon text-sm" />
                <p className="text-[10px] text-gray-500 mt-0.5">Recomendado: 2x (entrada × 2)</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Multiplicador G2</label>
                <input name="galeMultiplier2" defaultValue={config.galeMultiplier2} step="0.1" type="number" className="input-cartoon text-sm" />
                <p className="text-[10px] text-gray-500 mt-0.5">Recomendado: 4x (entrada × 4)</p>
              </div>
            </div>
          </div>

          {/* Metas */}
          <div className="card-cartoon p-5">
            <h3 className="text-white font-medium mb-4">🎯 Metas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Meta Diária (R$)</label>
                <input name="metaDiaria" defaultValue={config.metaDiaria} step="0.01" type="number" className="input-cartoon text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Stop Loss (R$)</label>
                <input name="stopLoss" defaultValue={config.stopLoss} step="0.01" type="number" className="input-cartoon text-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3 font-medium">Metas por Período</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PERIODOS.map(p => {
                const key = 'meta' + p.key.charAt(0).toUpperCase() + p.key.slice(1)
                return (
                  <div key={p.key}>
                    <label className="block text-xs text-gray-400 mb-1">{p.label}</label>
                    <input name={key} defaultValue={config[key] || 0} step="0.01" type="number" className="input-cartoon text-sm" />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-cartoon text-sm flex-1">Salvar Configurações</button>
            <button type="button" onClick={handleResetBanca} disabled={resetting}
              className="btn-cartoon-outline text-sm bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20">
              {resetting ? 'Resetando...' : '🔄 Resetar Banca'}
            </button>
          </div>
        </form>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
