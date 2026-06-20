'use client'

import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { useState, useMemo } from 'react'
import Toast, { useToast } from '@/components/Toast'
import { HiTrash } from 'react-icons/hi'

function formatMoney(v) {
  return `R$ ${(v || 0).toFixed(2)}`
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

  const [confirmando, setConfirmando] = useState(null)
  const [valor, setValor] = useState('')

  const { data: config, mutate: mutateConfig } = useSWR('/api/admin/banca/config', adminFetcher)
  const { data: operacoes, mutate: mutateOps } = useSWR('/api/admin/banca/operacoes', adminFetcher)
  const ops = operacoes || []
  const hoje = new Date().toISOString().slice(0, 10)

  const bancaAtual = config?.bancaAtual || 0
  const hojeOps = ops.filter(o => o.dia === hoje)

  const hojeLucro = hojeOps.reduce((s, o) => s + o.resultado, 0)
  const hojeWins = hojeOps.filter(o => o.tipo.startsWith('win')).length
  const hojeLosses = hojeOps.filter(o => o.tipo === 'loss').length
  const hojeTotal = hojeOps.length

  const periodosMeta = useMemo(() => {
    if (!config) return PERIODOS.map(p => ({ ...p, meta: 0, lucro: 0, atingida: false }))
    return PERIODOS.map(p => {
      const key = 'meta' + p.key.charAt(0).toUpperCase() + p.key.slice(1)
      const meta = config[key] || 0
      const lucro = hojeOps.filter(o => o.periodo === p.key).reduce((s, o) => s + o.resultado, 0)
      return { ...p, meta, lucro, atingida: meta > 0 && lucro >= meta }
    })
  }, [config, hojeOps])

  const abrirPrompt = (tipo) => {
    setConfirmando(tipo)
    setValor('')
  }

  const confirmar = async () => {
    const v = parseFloat(valor)
    if (!v || v <= 0) return
    const resultado = confirmando === 'loss' ? -v : v
    const res = await fetch('/api/admin/banca/operacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ tipo: confirmando, periodo, resultado, entrada: v }),
    })
    if (res.ok) {
      showToast(`${confirmando === 'win' ? '✅' : '❌'} ${confirmando === 'win' ? 'Win' : 'Loss'} registrado!`, 'success')
      setConfirmando(null)
      setValor('')
      mutateConfig()
      mutateOps()
    } else {
      showToast('Erro ao registrar', 'error')
    }
  }

  const handleUndo = async (id) => {
    if (!confirm('Desfazer?')) return
    const res = await fetch(`/api/admin/banca/operacoes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    if (res.ok) { showToast('Desfeito', 'success'); mutateConfig(); mutateOps() }
    else { showToast('Erro ao desfazer', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">🎮 Operações</h2>
          <p className="text-gray-400 text-sm">Registre Win ou Loss com o valor</p>
        </div>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="input-cartoon text-sm py-1.5 px-2 w-auto">
          {PERIODOS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      <div className="card-cartoon p-4 text-center bg-dark-950/80">
        <p className="text-xs text-gray-400 mb-0.5">💰 Saldo atual</p>
        <p className={`text-3xl font-cartoon ${bancaAtual >= 0 ? 'text-green-neon' : 'text-red-400'}`}>
          {formatMoney(bancaAtual)}
        </p>
      </div>

      {confirmando ? (
        <div className="card-cartoon p-6 text-center animate-slide-up">
          <div className="text-5xl mb-3">{confirmando === 'win' ? '✅' : '❌'}</div>
          <h3 className="text-white font-medium text-lg mb-1">
            {confirmando === 'win' ? 'Valor do WIN (lucro)' : 'Valor do LOSS (prejuízo)'}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {confirmando === 'win' ? 'Quanto você lucrou?' : 'Quanto você perdeu?'}
          </p>
          <div className="max-w-xs mx-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
              <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)}
                className="input-cartoon w-full text-center text-2xl font-bold pl-12" placeholder="0,00" autoFocus
                onKeyDown={e => e.key === 'Enter' && valor && confirmar()} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 max-w-xs mx-auto">
            <button onClick={() => setConfirmando(null)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
            <button onClick={confirmar} disabled={!valor || parseFloat(valor) <= 0}
              className={`btn-cartoon flex-1 text-sm disabled:opacity-50 ${confirmando === 'win' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              Confirmar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => abrirPrompt('win')}
            className="card-cartoon p-8 text-center hover:border-green-neon/40 transition-all group">
            <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">✅</div>
            <p className="text-2xl font-cartoon text-green-neon">WIN</p>
            <p className="text-xs text-gray-500 mt-1">Clique para registrar lucro</p>
          </button>
          <button onClick={() => abrirPrompt('loss')}
            className="card-cartoon p-8 text-center hover:border-red-500/40 transition-all group">
            <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">❌</div>
            <p className="text-2xl font-cartoon text-red-400">LOSS</p>
            <p className="text-xs text-gray-500 mt-1">Clique para registrar prejuízo</p>
          </button>
        </div>
      )}

      {hojeTotal > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm px-1">
          <span className="text-gray-400">Hoje: <strong className="text-white">{hojeTotal}</strong></span>
          <span className="text-gray-400">Wins: <strong className="text-green-neon">{hojeWins}</strong></span>
          <span className="text-gray-400">Losses: <strong className="text-red-400">{hojeLosses}</strong></span>
          <span className="text-gray-400">Lucro: <strong className={hojeLucro >= 0 ? 'text-green-neon' : 'text-red-400'}>{formatMoney(hojeLucro)}</strong></span>
          <span className="text-gray-400">Taxa: <strong className="text-white">{((hojeWins / hojeTotal) * 100).toFixed(0)}%</strong></span>
        </div>
      )}

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

      {hojeOps.length > 0 && (
        <div className="card-cartoon p-5">
          <h3 className="text-white font-medium mb-3">📋 Histórico de Hoje</h3>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {[...hojeOps].reverse().map(op => (
              <div key={op.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-50 text-sm">
                <div className="flex items-center gap-2">
                  <span>{op.tipo.startsWith('win') ? '✅' : '❌'}</span>
                  <span className="text-xs text-gray-500">{PERIODOS.find(p => p.key === op.periodo)?.label}</span>
                  <span className="text-xs text-gray-400">{new Date(op.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={op.resultado >= 0 ? 'text-green-neon' : 'text-red-400'}>
                    {op.resultado >= 0 ? '+' : ''}{formatMoney(op.resultado)}
                  </span>
                  <span className="text-xs text-gray-500">Saldo: {formatMoney(op.saldoPos)}</span>
                  <button onClick={() => handleUndo(op.id)} className="text-gray-500 hover:text-red-400">
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
