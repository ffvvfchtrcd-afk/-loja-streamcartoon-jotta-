'use client'

import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { useState, useMemo } from 'react'
import Toast, { useToast } from '@/components/Toast'
import { HiTrash } from 'react-icons/hi'

function formatMoney(v) {
  return `R$ ${(v || 0).toFixed(2)}`
}

function calcGaleEntries(entrada, payout, g1, g2, gales) {
  const g1Entry = entrada * g1
  const g2Entry = entrada * g2
  const results = {}
  results.win_direct = entrada * payout
  results.win_g1 = g1Entry * payout - entrada
  results.win_g2 = g2Entry * payout - entrada - g1Entry
  if (gales >= 2) results.loss = -(entrada + g1Entry + g2Entry)
  else if (gales === 1) results.loss = -(entrada + g1Entry)
  else results.loss = -entrada
  return results
}

const PERIODOS = [
  { key: 'manha', label: '🌅 Manhã' },
  { key: 'tarde', label: '☀️ Tarde' },
  { key: 'noite', label: '🌙 Noite' },
]

export default function V2Operacoes() {
  const { mutate } = useSWRConfig()
  const { toast, showToast, closeToast } = useToast()

  const [periodo, setPeriodo] = useState(() => {
    const h = new Date().getHours()
    if (h < 12) return 'manha'
    if (h < 18) return 'tarde'
    return 'noite'
  })

  const { data: config, mutate: mutateConfig } = useSWR('/api/admin/banca/config', adminFetcher)
  const { data: operacoes, mutate: mutateOps } = useSWR('/api/admin/banca/operacoes', adminFetcher)
  const ops = operacoes || []
  const hoje = new Date().toISOString().slice(0, 10)
  const hojeOps = ops.filter(o => o.dia === hoje)

  const galeCalc = useMemo(() => {
    if (!config) return null
    return calcGaleEntries(config.valorEntrada, config.payout, config.galeMultiplier1, config.galeMultiplier2, config.maxGales)
  }, [config])

  const hojeLucro = hojeOps.reduce((s, o) => s + o.resultado, 0)
  const hojeWins = hojeOps.filter(o => o.tipo !== 'loss').length
  const hojeLosses = hojeOps.filter(o => o.tipo === 'loss').length
  const hojeTotal = hojeOps.length

  const metaAtingida = config && config.metaDiaria > 0 && hojeLucro >= config.metaDiaria
  const stopAtingido = config && config.stopLoss > 0 && hojeLucro <= -config.stopLoss

  const periodosMeta = useMemo(() => {
    if (!config) return PERIODOS.map(p => ({ ...p, meta: 0, lucro: 0, atingida: false }))
    return PERIODOS.map(p => {
      const key = 'meta' + p.key.charAt(0).toUpperCase() + p.key.slice(1)
      const meta = config[key] || 0
      const lucro = hojeOps.filter(o => o.periodo === p.key).reduce((s, o) => s + o.resultado, 0)
      return { ...p, meta, lucro, atingida: meta > 0 && lucro >= meta }
    })
  }, [config, hojeOps])

  const handleOperacao = async (tipo) => {
    if (metaAtingida && tipo !== 'loss') {
      if (!confirm('🎉 Meta do dia já foi atingida! Deseja continuar operando?')) return
    }
    if (stopAtingido) {
      if (!confirm('⚠️ Stop Loss atingido! Deseja continuar operando?')) return
    }
    const res = await fetch('/api/admin/banca/operacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ tipo, periodo }),
    })
    if (res.ok) {
      const nomes = { win_direct: 'Win Direto ✅', win_g1: 'Win G1 🟡', win_g2: 'Win G2 🟠', loss: 'Loss ❌' }
      showToast(`${nomes[tipo]} registrado!`, 'success')
      mutateConfig(); mutateOps()
    } else {
      showToast('Erro ao registrar operação', 'error')
    }
  }

  const handleUndo = async (id) => {
    if (!confirm('Desfazer esta operação?')) return
    const res = await fetch(`/api/admin/banca/operacoes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    if (res.ok) { showToast('Operação desfeita', 'success'); mutateConfig(); mutateOps() }
    else { showToast('Erro ao desfazer', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">🎮 Operações</h2>
          <p className="text-gray-400 text-sm">Registre suas operações do dia</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Período:</span>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="input-cartoon text-sm py-1.5 px-2 w-auto">
            {PERIODOS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="card-cartoon p-6">
        <h3 className="text-white font-medium mb-4">Registrar Operação</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => handleOperacao('win_direct')}
            className="btn-cartoon bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 text-sm py-5">
            ✅ Win Direto
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.win_direct)}</span>}
          </button>
          <button onClick={() => handleOperacao('win_g1')}
            className="btn-cartoon bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 text-sm py-5">
            🟡 Win G1
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.win_g1)}</span>}
          </button>
          <button onClick={() => handleOperacao('win_g2')}
            className="btn-cartoon bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 text-sm py-5">
            🟠 Win G2
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.win_g2)}</span>}
          </button>
          <button onClick={() => handleOperacao('loss')}
            className="btn-cartoon bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 text-sm py-5">
            ❌ Loss
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.loss)}</span>}
          </button>
        </div>

        {config && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-400">
            <span>Operações hoje: <strong className="text-white">{hojeTotal}</strong></span>
            <span>Wins: <strong className="text-green-neon">{hojeWins}</strong></span>
            <span>Losses: <strong className="text-red-400">{hojeLosses}</strong></span>
            <span>Lucro: <strong className={hojeLucro >= 0 ? 'text-green-neon' : 'text-red-400'}>{formatMoney(hojeLucro)}</strong></span>
            {hojeTotal > 0 && <span>Taxa: <strong className="text-white">{((hojeWins / hojeTotal) * 100).toFixed(0)}%</strong></span>}
            <span>Entrada: <strong className="text-white">{formatMoney(config.valorEntrada)}</strong></span>
          </div>
        )}
      </div>

      {/* Períodos do dia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periodosMeta.map(p => (
          <div key={p.key} className={`card-cartoon p-4 ${p.atingida ? 'border-green-neon/40' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">{p.label}</span>
              <span className={`text-lg ${p.atingida ? 'text-green-neon' : 'text-gray-500'}`}>{p.atingida ? '✅' : '⏳'}</span>
            </div>
            <p className="text-xs text-gray-400">Meta: {formatMoney(p.meta)}</p>
            <p className={`text-sm font-medium ${p.lucro >= 0 ? 'text-green-neon' : 'text-red-400'}`}>Lucro: {formatMoney(p.lucro)}</p>
            {p.meta > 0 && (
              <div className="w-full h-1.5 bg-dark-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${p.atingida ? 'bg-green-neon' : 'bg-dark-200'}`}
                  style={{ width: `${Math.min(100, (p.lucro / p.meta) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Histórico de hoje */}
      {hojeOps.length > 0 && (
        <div className="card-cartoon p-5">
          <h3 className="text-white font-medium mb-3">📋 Histórico de Hoje</h3>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {[...hojeOps].reverse().map(op => (
              <div key={op.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-50 text-sm">
                <div className="flex items-center gap-2">
                  <span>{op.tipo === 'win_direct' ? '✅' : op.tipo === 'win_g1' ? '🟡' : op.tipo === 'win_g2' ? '🟠' : '❌'}</span>
                  <span className="text-xs text-gray-500">{PERIODOS.find(p => p.key === op.periodo)?.label}</span>
                  <span className="text-xs text-gray-400">{new Date(op.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={op.resultado >= 0 ? 'text-green-neon' : 'text-red-400'}>
                    {op.resultado >= 0 ? '+' : ''}{formatMoney(op.resultado)}
                  </span>
                  <span className="text-xs text-gray-500">Saldo: {formatMoney(op.saldoPos)}</span>
                  <button onClick={() => handleUndo(op.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <HiTrash className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
