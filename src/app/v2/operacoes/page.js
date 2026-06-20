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

const botoes = [
  { tipo: 'win_direct', label: 'Win Direto', icon: '✅', cor: 'green', corClasse: 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' },
  { tipo: 'win_g1', label: 'Win G1', icon: '🟡', cor: 'yellow', corClasse: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20' },
  { tipo: 'win_g2', label: 'Win G2', icon: '🟠', cor: 'orange', corClasse: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' },
  { tipo: 'win_g3', label: 'Win G3', icon: '🟣', cor: 'purple', corClasse: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20' },
  { tipo: 'loss', label: 'Loss', icon: '❌', cor: 'red', corClasse: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' },
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

  const [activeOp, setActiveOp] = useState(null)
  const [amountField, setAmountField] = useState('')

  const { data: config, mutate: mutateConfig } = useSWR('/api/admin/banca/config', adminFetcher)
  const { data: operacoes, mutate: mutateOps } = useSWR('/api/admin/banca/operacoes', adminFetcher)
  const ops = operacoes || []
  const hoje = new Date().toISOString().slice(0, 10)
  const hojeOps = ops.filter(o => o.dia === hoje)

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

  const abrirConfirmacao = (tipo) => {
    if (metaAtingida && tipo !== 'loss') {
      if (!confirm('🎉 Meta do dia já foi atingida! Deseja continuar?')) return
    }
    if (stopAtingido) {
      if (!confirm('⚠️ Stop Loss atingido! Deseja continuar?')) return
    }
    const entrada = config?.valorEntrada || 0
    setActiveOp(tipo)
    if (tipo === 'loss') {
      setAmountField(entrada.toString())
    } else {
      setAmountField((entrada * 1.5).toFixed(2))
    }
  }

  const confirmarOperacao = async () => {
    const entrada = config?.valorEntrada || 0
    const valor = parseFloat(amountField) || 0
    const isLoss = activeOp === 'loss'

    let resultado
    if (isLoss) {
      resultado = -Math.abs(valor)
    } else {
      resultado = valor - entrada
    }

    const res = await fetch('/api/admin/banca/operacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ tipo: activeOp, periodo, entrada, resultado }),
    })

    if (res.ok) {
      const bt = botoes.find(b => b.tipo === activeOp)
      showToast(`${bt?.icon} ${bt?.label} registrado!`, 'success')
      setActiveOp(null)
      setAmountField('')
      mutateConfig()
      mutateOps()
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

  const entradaAtual = config?.valorEntrada || 0
  const isLoss = activeOp === 'loss'
  const valorRecebido = parseFloat(amountField) || 0
  const resultadoPreview = isLoss ? -Math.abs(valorRecebido) : valorRecebido - entradaAtual
  const btAtivo = botoes.find(b => b.tipo === activeOp)

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

      {/* Entrada atual */}
      <div className="card-cartoon p-4 text-center">
        <p className="text-xs text-gray-400 mb-1">💵 Entrada atual</p>
        <p className="text-2xl font-cartoon text-white">{formatMoney(entradaAtual)}</p>
      </div>

      {/* Botões */}
      <div className="card-cartoon p-6">
        <h3 className="text-white font-medium mb-4">Clique no resultado da operação</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {botoes.map(bt => (
            <button
              key={bt.tipo}
              onClick={() => abrirConfirmacao(bt.tipo)}
              disabled={activeOp !== null && activeOp !== bt.tipo}
              className={`${bt.corClasse} btn-cartoon text-sm py-5 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${activeOp === bt.tipo ? 'ring-2 ring-white/30 scale-[1.02]' : ''}`}
            >
              {bt.icon} {bt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmação inline */}
      {activeOp && (
        <div className="card-cartoon p-5 border-2 border-white/10 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{btAtivo?.icon}</span>
            <span className="text-white font-medium">{btAtivo?.label}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {isLoss ? '💰 Valor perdido (R$)' : '💰 Valor recebido (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={amountField}
                onChange={e => setAmountField(e.target.value)}
                className="input-cartoon text-lg font-bold text-center"
                autoFocus
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-gray-400">
                Entrada: <span className="text-white">{formatMoney(entradaAtual)}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Resultado:{' '}
                <span className={resultadoPreview >= 0 ? 'text-green-neon font-bold' : 'text-red-400 font-bold'}>
                  {resultadoPreview >= 0 ? '+' : ''}{formatMoney(resultadoPreview)}
                </span>
              </p>
              {!isLoss && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Lucro = Valor recebido - Entrada
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setActiveOp(null); setAmountField('') }} className="btn-cartoon-outline flex-1 text-sm">
              Cancelar
            </button>
            <button onClick={confirmarOperacao} disabled={!amountField || parseFloat(amountField) <= 0}
              className={`btn-cartoon flex-1 text-sm disabled:opacity-50 ${isLoss ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'}`}>
              Confirmar {btAtivo?.icon}
            </button>
          </div>
        </div>
      )}

      {/* Resumo do dia */}
      {config && (
        <div className="card-cartoon p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-400">
            <span>Operações hoje: <strong className="text-white">{hojeTotal}</strong></span>
            <span>Wins: <strong className="text-green-neon">{hojeWins}</strong></span>
            <span>Losses: <strong className="text-red-400">{hojeLosses}</strong></span>
            <span>Lucro: <strong className={hojeLucro >= 0 ? 'text-green-neon' : 'text-red-400'}>{formatMoney(hojeLucro)}</strong></span>
            {hojeTotal > 0 && <span>Taxa: <strong className="text-white">{((hojeWins / hojeTotal) * 100).toFixed(0)}%</strong></span>}
          </div>
        </div>
      )}

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
                  <span>{op.tipo === 'win_direct' ? '✅' : op.tipo === 'win_g1' ? '🟡' : op.tipo === 'win_g2' ? '🟠' : op.tipo === 'win_g3' ? '🟣' : '❌'}</span>
                  <span className="text-xs text-gray-500">{PERIODOS.find(p => p.key === op.periodo)?.label}</span>
                  <span className="text-xs text-gray-400">{new Date(op.createdAt).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-gray-500">Ent: {formatMoney(op.entrada)}</span>
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
