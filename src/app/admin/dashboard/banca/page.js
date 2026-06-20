'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import Toast, { useToast } from '@/components/Toast'
import { HiCog, HiChevronDown, HiChevronUp, HiTrash, HiCalendar, HiChartBar, HiTrendingUp, HiTrendingDown, HiRefresh, HiCheck, HiX } from 'react-icons/hi'

const PASSWORD = 'jotta1@@'
const PERIODOS = [
  { key: 'manha', label: '🌅 Manhã' },
  { key: 'tarde', label: '☀️ Tarde' },
  { key: 'noite', label: '🌙 Noite' },
]

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
  results.g1Entry = g1Entry
  results.g2Entry = g2Entry
  return results
}

export default function BancaPage() {
  const { mutate } = useSWRConfig()
  const { toast, showToast, closeToast } = useToast()

  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [periodo, setPeriodo] = useState(() => {
    const h = new Date().getHours()
    if (h < 12) return 'manha'
    if (h < 18) return 'tarde'
    return 'noite'
  })

  const [mes, setMes] = useState(() => new Date().getMonth() + 1)
  const [ano, setAno] = useState(() => new Date().getFullYear())

  const { data: config, mutate: mutateConfig } = useSWR('/api/admin/banca/config', adminFetcher)
  const { data: operacoes, mutate: mutateOps } = useSWR(`/api/admin/banca/operacoes?mes=${mes}&ano=${ano}`, adminFetcher)
  const { data: allOps } = useSWR('/api/admin/banca/operacoes', adminFetcher)

  const ops = operacoes || []
  const all = allOps || []

  const hoje = new Date().toISOString().slice(0, 10)

  const hojeOps = useMemo(() => ops.filter(o => o.dia === hoje), [ops, hoje])
  const stats = useMemo(() => calcStats(all), [all])
  const calendario = useMemo(() => buildCalendario(all, mes, ano), [all, mes, ano])
  const chartData = useMemo(() => buildChart(all), [all])

  const galeCalc = useMemo(() => {
    if (!config) return null
    return calcGaleEntries(config.valorEntrada, config.payout, config.galeMultiplier1, config.galeMultiplier2, config.maxGales)
  }, [config])

  const hojeLucro = hojeOps.reduce((s, o) => s + o.resultado, 0)
  const hojeWins = hojeOps.filter(o => o.tipo !== 'loss').length
  const hojeLosses = hojeOps.filter(o => o.tipo === 'loss').length
  const hojeTotal = hojeOps.length

  const metaRestante = config ? Math.max(0, config.metaDiaria - hojeLucro) : 0
  const progressoMeta = config && config.metaDiaria > 0 ? Math.min(100, (hojeLucro / config.metaDiaria) * 100) : 0
  const metaAtingida = config && config.metaDiaria > 0 && hojeLucro >= config.metaDiaria
  const stopAtingido = config && config.stopLoss > 0 && hojeLucro <= -config.stopLoss

  const entradaRec = config ? Math.max(1, config.bancaAtual * 0.02) : 0

  const periodosMeta = useMemo(() => {
    if (!config) return PERIODOS.map(p => ({ ...p, meta: 0, lucro: 0, atingida: false }))
    return PERIODOS.map(p => {
      const meta = config[`meta${p.key.charAt(0).toUpperCase() + p.key.slice(1)}`] || 0
      const lucro = hojeOps.filter(o => o.periodo === p.key).reduce((s, o) => s + o.resultado, 0)
      return { ...p, meta, lucro, atingida: meta > 0 && lucro >= meta }
    })
  }, [config, hojeOps])

  const handleLogin = () => {
    if (pwd === PASSWORD) {
      setUnlocked(true)
      setPwdError(false)
    } else {
      setPwdError(true)
    }
  }

  const handleOperacao = async (tipo) => {
    const res = await fetch('/api/admin/banca/operacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ tipo, periodo }),
    })
    if (res.ok) {
      const nomes = { win_direct: 'Win Direto', win_g1: 'Win G1', win_g2: 'Win G2', loss: 'Loss' }
      showToast(`${nomes[tipo]} registrado!`, 'success')
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
    if (res.ok) {
      showToast('Operação desfeita', 'success')
      mutateConfig()
      mutateOps()
    } else {
      showToast('Erro ao desfazer', 'error')
    }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const data = {}
    for (const [key, val] of form.entries()) {
      if (key === 'payout') {
        data[key] = (parseFloat(val) || 0) / 100
      } else {
        data[key] = parseFloat(val) || 0
      }
    }
    if (data.maxGales !== undefined) data.maxGales = parseInt(data.maxGales) || 0
    const res = await fetch('/api/admin/banca/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      showToast('Configurações salvas!', 'success')
      mutateConfig()
    } else {
      showToast('Erro ao salvar', 'error')
    }
  }

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card-cartoon p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-cartoon text-xl text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400 text-sm mb-6">Digite a senha para acessar o Gerenciamento de Banca</p>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="input-cartoon w-full mb-3 text-center text-lg"
            placeholder="Senha"
            autoFocus
          />
          {pwdError && <p className="text-red-400 text-sm mb-3">Senha incorreta!</p>}
          <button onClick={handleLogin} className="btn-cartoon w-full text-sm">
            Acessar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">📊 Gerenciamento de Banca</h2>
          <p className="text-gray-400 text-sm">Controle de operações e evolução da banca</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {PERIODOS.find(p => p.key === periodo)?.label}
          </span>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="input-cartoon text-sm py-1.5 px-2 w-auto">
            {PERIODOS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Config Panel */}
      <div className="card-cartoon p-5">
        <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-2 text-white font-medium w-full text-left">
          <HiCog className="text-lg text-green-neon" />
          Configurações
          {showConfig ? <HiChevronUp className="ml-auto text-gray-400" /> : <HiChevronDown className="ml-auto text-gray-400" />}
        </button>
        {showConfig && config && (
          <form onSubmit={handleSaveConfig} className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-dark-100">
            <div>
              <label className="block text-xs text-gray-400 mb-1">💰 Banca Atual</label>
              <input name="bancaAtual" defaultValue={config.bancaAtual} step="0.01" type="number" className="input-cartoon text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">💵 Valor Entrada</label>
              <input name="valorEntrada" defaultValue={config.valorEntrada} step="0.01" type="number" className="input-cartoon text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">📈 Payout (%)</label>
              <input name="payout" defaultValue={config.payout * 100} step="1" type="number" className="input-cartoon text-sm" placeholder="80" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">🎯 Meta Diária</label>
              <input name="metaDiaria" defaultValue={config.metaDiaria} step="0.01" type="number" className="input-cartoon text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">🛑 Stop Loss</label>
              <input name="stopLoss" defaultValue={config.stopLoss} step="0.01" type="number" className="input-cartoon text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">🔄 Máx Gales</label>
              <select name="maxGales" defaultValue={config.maxGales} className="input-cartoon text-sm">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">📊 Mult. G1</label>
              <input name="galeMultiplier1" defaultValue={config.galeMultiplier1} step="0.1" type="number" className="input-cartoon text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">📊 Mult. G2</label>
              <input name="galeMultiplier2" defaultValue={config.galeMultiplier2} step="0.1" type="number" className="input-cartoon text-sm" />
            </div>
            <div className="col-span-2 md:col-span-3 lg:col-span-4 pt-2 border-t border-dark-100">
              <p className="text-xs text-gray-400 mb-3 font-medium">Metas por Período</p>
              <div className="grid grid-cols-3 gap-4">
                {PERIODOS.map(p => (
                  <div key={p.key}>
                    <label className="block text-xs text-gray-400 mb-1">{p.label}</label>
                    <input name={`meta${p.key.charAt(0).toUpperCase() + p.key.slice(1)}`} defaultValue={config[`meta${p.key.charAt(0).toUpperCase() + p.key.slice(1)}`] || 0} step="0.01" type="number" className="input-cartoon text-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-full flex justify-end pt-2">
              <button type="submit" className="btn-cartoon text-sm">Salvar Configurações</button>
            </div>
          </form>
        )}
      </div>

      {/* Growth Display */}
      {config && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">Banca Atual</p>
            <p className={`text-3xl font-cartoon ${config.bancaAtual >= 0 ? 'text-green-neon' : 'text-red-400'}`}>
              {formatMoney(config.bancaAtual)}
            </p>
          </div>
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">Próxima Entrada Recomendada</p>
            <p className="text-3xl font-cartoon text-white">{formatMoney(entradaRec)}</p>
            <p className="text-[10px] text-gray-500 mt-1">2% da banca</p>
          </div>
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">Meta do Dia</p>
            <p className="text-3xl font-cartoon text-white">{formatMoney(config.metaDiaria)}</p>
          </div>
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">Faltam</p>
            <p className={`text-3xl font-cartoon ${metaAtingida ? 'text-green-neon' : metaRestante > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {metaAtingida ? '✅' : formatMoney(metaRestante)}
            </p>
          </div>
        </div>
      )}

      {/* Meta Progress Bar */}
      {config && config.metaDiaria > 0 && (
        <div className="card-cartoon p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Progresso da Meta</span>
            <span className={`text-xs font-medium ${metaAtingida ? 'text-green-neon' : 'text-white'}`}>
              {formatMoney(hojeLucro)} / {formatMoney(config.metaDiaria)}
            </span>
          </div>
          <div className="w-full h-3 bg-dark-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${metaAtingida ? 'bg-green-neon' : stopAtingido ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, progressoMeta)}%` }}
            />
          </div>
          {metaAtingida && <p className="text-green-neon text-xs mt-2">🎉 Meta do dia atingida!</p>}
          {stopAtingido && <p className="text-red-400 text-xs mt-2">⚠️ Stop Loss atingido!</p>}
        </div>
      )}

      {/* Day Division */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periodosMeta.map(p => (
          <div key={p.key} className={`card-cartoon p-4 ${p.atingida ? 'border-green-neon/40' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">{p.label}</span>
              <span className={`text-lg ${p.atingida ? 'text-green-neon' : 'text-gray-500'}`}>
                {p.atingida ? '✅' : '⏳'}
              </span>
            </div>
            <p className="text-xs text-gray-400">Meta: {formatMoney(p.meta)}</p>
            <p className={`text-sm font-medium ${p.lucro >= 0 ? 'text-green-neon' : 'text-red-400'}`}>
              Lucro: {formatMoney(p.lucro)}
            </p>
            {p.meta > 0 && (
              <div className="w-full h-1.5 bg-dark-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${p.atingida ? 'bg-green-neon' : 'bg-dark-200'}`} style={{ width: `${Math.min(100, (p.lucro / p.meta) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Operations Buttons */}
      <div className="card-cartoon p-5">
        <h3 className="text-white font-medium mb-4">Operações do Dia</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => handleOperacao('win_direct')} className="btn-cartoon bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 text-sm py-4">
            ✅ Win Direto
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.win_direct)}</span>}
          </button>
          <button onClick={() => handleOperacao('win_g1')} className="btn-cartoon bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 text-sm py-4">
            🟡 Win G1
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.win_g1)}</span>}
          </button>
          <button onClick={() => handleOperacao('win_g2')} className="btn-cartoon bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 text-sm py-4">
            🟠 Win G2
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.win_g2)}</span>}
          </button>
          <button onClick={() => handleOperacao('loss')} className="btn-cartoon bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 text-sm py-4">
            ❌ Loss
            {galeCalc && <span className="block text-[10px] opacity-70 font-normal mt-0.5">{formatMoney(galeCalc.loss)}</span>}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
          <span>Operações hoje: <strong className="text-white">{hojeTotal}</strong></span>
          <span>Wins: <strong className="text-green-neon">{hojeWins}</strong></span>
          <span>Losses: <strong className="text-red-400">{hojeLosses}</strong></span>
          <span>Lucro: <strong className={hojeLucro >= 0 ? 'text-green-neon' : 'text-red-400'}>{formatMoney(hojeLucro)}</strong></span>
          {hojeTotal > 0 && (
            <span>Taxa: <strong className="text-white">{((hojeWins / hojeTotal) * 100).toFixed(0)}%</strong></span>
          )}
        </div>
      </div>

      {/* Today's Operations History */}
      {hojeOps.length > 0 && (
        <div className="card-cartoon p-5">
          <h3 className="text-white font-medium mb-3">Histórico de Hoje</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {hojeOps.slice().reverse().map(op => (
              <div key={op.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-50 text-sm">
                <div className="flex items-center gap-2">
                  <span>
                    {op.tipo === 'win_direct' && '✅'}
                    {op.tipo === 'win_g1' && '🟡'}
                    {op.tipo === 'win_g2' && '🟠'}
                    {op.tipo === 'loss' && '❌'}
                  </span>
                  <span className="text-xs text-gray-500">{PERIODOS.find(p => p.key === op.periodo)?.label}</span>
                  <span className="text-xs text-gray-400">{new Date(op.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={op.resultado >= 0 ? 'text-green-neon' : 'text-red-400'}>
                    {op.resultado >= 0 ? '+' : ''}{formatMoney(op.resultado)}
                  </span>
                  <button onClick={() => handleUndo(op.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <HiTrash className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="card-cartoon p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <HiChartBar className="text-green-neon" /> Estatísticas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Total Operações</p>
            <p className="text-xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Wins Diretos</p>
            <p className="text-xl font-bold text-green-400">{stats.win_direct}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Wins G1</p>
            <p className="text-xl font-bold text-yellow-400">{stats.win_g1}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Wins G2</p>
            <p className="text-xl font-bold text-orange-400">{stats.win_g2}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Losses</p>
            <p className="text-xl font-bold text-red-400">{stats.loss}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Win Rate</p>
            <p className="text-xl font-bold text-white">{stats.winRate}%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Lucro Semanal</p>
            <p className={`text-xl font-bold ${stats.lucroSemanal >= 0 ? 'text-green-neon' : 'text-red-400'}`}>{formatMoney(stats.lucroSemanal)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Lucro Mensal</p>
            <p className={`text-xl font-bold ${stats.lucroMensal >= 0 ? 'text-green-neon' : 'text-red-400'}`}>{formatMoney(stats.lucroMensal)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Maior Sequência Wins</p>
            <p className="text-xl font-bold text-green-neon">{stats.maxWinStreak}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-50">
            <p className="text-xs text-gray-400">Maior Sequência Losses</p>
            <p className="text-xl font-bold text-red-400">{stats.maxLossStreak}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card-cartoon p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <HiTrendingUp className="text-green-neon" /> Evolução da Banca
        </h3>
        {chartData.length > 1 ? (
          <div className="w-full h-48 md:h-64">
            <svg viewBox={`0 0 ${chartData.length * 60} 200`} className="w-full h-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                points={chartData.map((p, i) => `${i * 60 + 30},${200 - ((p - chartData[0]) / (Math.max(...chartData) - Math.min(...chartData) || 1)) * 160 - 20}`).join(' ')}
              />
              {chartData.map((p, i) => {
                if (i % Math.max(1, Math.floor(chartData.length / 7)) !== 0 && i !== chartData.length - 1) return null
                const x = i * 60 + 30
                const y = 200 - ((p - chartData[0]) / (Math.max(...chartData) - Math.min(...chartData) || 1)) * 160 - 20
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#22c55e" />
                    <text x={x} y="195" textAnchor="middle" fill="#6b7280" fontSize="10">{i + 1}d</text>
                  </g>
                )
              })}
            </svg>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">Poucos dados para exibir o gráfico</p>
        )}
      </div>

      {/* Calendar */}
      <div className="card-cartoon p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <HiCalendar className="text-green-neon" /> Calendário
        </h3>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => { if (mes === 1) { setMes(12); setAno(ano - 1) } else { setMes(mes - 1) } }} className="btn-cartoon-outline text-xs px-3 py-1">&lt;</button>
          <span className="text-sm text-white font-medium">{new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => { if (mes === 12) { setMes(1); setAno(ano + 1) } else { setMes(mes + 1) } }} className="btn-cartoon-outline text-xs px-3 py-1">&gt;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-[10px] text-gray-500 font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: calendario.offset }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {calendario.dias.map((dia, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs cursor-default transition-colors ${
                dia.cor === 'verde' ? 'bg-green-500/20 text-green-400' :
                dia.cor === 'vermelho' ? 'bg-red-500/20 text-red-400' :
                dia.cor === 'amarelo' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-dark-50 text-gray-500'
              }`}
              title={dia.ops ? dia.ops.map(o => `${o.tipo} ${o.resultado >= 0 ? '+' : ''}R$${o.resultado.toFixed(2)}`).join('\n') : ''}
            >
              {dia.num}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/20" /> Verde: Positivo</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20" /> Vermelho: Negativo</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/20" /> Amarelo: Não operou</span>
        </div>
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}

function calcStats(all) {
  const total = all.length
  const win_direct = all.filter(o => o.tipo === 'win_direct').length
  const win_g1 = all.filter(o => o.tipo === 'win_g1').length
  const win_g2 = all.filter(o => o.tipo === 'win_g2').length
  const loss = all.filter(o => o.tipo === 'loss').length
  const wins = win_direct + win_g1 + win_g2
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0'

  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const lucroSemanal = all.filter(o => new Date(o.data || o.createdAt) >= weekAgo).reduce((s, o) => s + o.resultado, 0)
  const lucroMensal = all.filter(o => new Date(o.data || o.createdAt) >= monthAgo).reduce((s, o) => s + o.resultado, 0)

  let maxWinStreak = 0, maxLossStreak = 0
  let curWin = 0, curLoss = 0
  for (const o of all.sort((a, b) => new Date(a.data || a.createdAt) - new Date(b.data || b.createdAt))) {
    if (o.tipo === 'loss') {
      curLoss++
      curWin = 0
      if (curLoss > maxLossStreak) maxLossStreak = curLoss
    } else {
      curWin++
      curLoss = 0
      if (curWin > maxWinStreak) maxWinStreak = curWin
    }
  }

  return { total, win_direct, win_g1, win_g2, loss, wins, winRate, lucroSemanal, lucroMensal, maxWinStreak, maxLossStreak }
}

function buildCalendario(all, mes, ano) {
  const firstDay = new Date(ano, mes - 1, 1)
  const lastDay = new Date(ano, mes, 0)
  const offset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const opsByDay = {}
  for (const o of all) {
    const d = o.dia || o.data?.slice(0, 10)
    if (d) {
      if (!opsByDay[d]) opsByDay[d] = []
      opsByDay[d].push(o)
    }
  }

  const dias = []
  for (let i = 1; i <= daysInMonth; i++) {
    const ds = `${ano}-${String(mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dayOps = opsByDay[ds] || []
    const lucro = dayOps.reduce((s, o) => s + o.resultado, 0)
    let cor = 'amarelo'
    if (dayOps.length > 0) {
      cor = lucro > 0 ? 'verde' : 'vermelho'
    }
    dias.push({ num: i, cor, ops: dayOps })
  }

  return { offset, dias }
}

function buildChart(all) {
  const opsByDay = {}
  for (const o of all) {
    const d = o.dia || o.data?.slice(0, 10)
    if (d) {
      if (!opsByDay[d]) opsByDay[d] = []
      opsByDay[d].push(o)
    }
  }

  const sorted = Object.entries(opsByDay).sort(([a], [b]) => a.localeCompare(b))
  let acc = 0
  const chart = sorted.map(([dia, ops]) => {
    acc += ops.reduce((s, o) => s + o.resultado, 0)
    return acc
  })

  if (chart.length === 0) return []
  const min = Math.min(...chart)
  return chart.map(v => v - min + 1)
}
