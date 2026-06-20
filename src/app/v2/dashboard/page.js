'use client'

import useSWR from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { useState, useMemo } from 'react'
import { HiTrendingUp, HiTrendingDown, HiCalendar } from 'react-icons/hi'

function formatMoney(v) {
  return `R$ ${(v || 0).toFixed(2)}`
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
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1)
  const lucroSemanal = all.filter(o => new Date(o.data || o.createdAt) >= weekAgo).reduce((s, o) => s + o.resultado, 0)
  const lucroMensal = all.filter(o => new Date(o.data || o.createdAt) >= monthAgo).reduce((s, o) => s + o.resultado, 0)

  let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0
  for (const o of [...all].sort((a, b) => new Date(a.data || a.createdAt) - new Date(b.data || b.createdAt))) {
    if (o.tipo === 'loss') { curLoss++; curWin = 0; if (curLoss > maxLossStreak) maxLossStreak = curLoss }
    else { curWin++; curLoss = 0; if (curWin > maxWinStreak) maxWinStreak = curWin }
  }
  return { total, win_direct, win_g1, win_g2, loss, winRate, lucroSemanal, lucroMensal, maxWinStreak, maxLossStreak }
}

function buildChart(all) {
  const byDay = {}
  for (const o of all) {
    const d = o.dia || o.data?.slice(0, 10)
    if (d) { if (!byDay[d]) byDay[d] = []; byDay[d].push(o) }
  }
  const sorted = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
  let acc = 0
  const chart = sorted.map(([, ops]) => { acc += ops.reduce((s, o) => s + o.resultado, 0); return Math.max(0, acc) })
  return chart
}

export default function V2Dashboard() {
  const { data: config } = useSWR('/api/admin/banca/config', adminFetcher)
  const { data: allOps } = useSWR('/api/admin/banca/operacoes', adminFetcher)
  const all = allOps || []

  const hoje = new Date().toISOString().slice(0, 10)
  const hojeOps = all.filter(o => o.dia === hoje)
  const stats = useMemo(() => calcStats(all), [all])
  const chartData = useMemo(() => buildChart(all), [all])

  const hojeLucro = hojeOps.reduce((s, o) => s + o.resultado, 0)
  const metaRestante = config ? Math.max(0, config.metaDiaria - hojeLucro) : 0
  const progressoMeta = config && config.metaDiaria > 0 ? Math.min(100, (hojeLucro / config.metaDiaria) * 100) : 0
  const metaAtingida = config && config.metaDiaria > 0 && hojeLucro >= config.metaDiaria
  const stopAtingido = config && config.stopLoss > 0 && hojeLucro <= -config.stopLoss
  const entradaRec = config ? Math.max(1, config.bancaAtual * 0.02) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="title-cartoon text-3xl text-white mb-1">📊 Visão Geral</h2>
        <p className="text-gray-400 text-sm">Resumo da banca e desempenho</p>
      </div>

      {/* Cards */}
      {config && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">💰 Banca Atual</p>
            <p className={`text-3xl font-cartoon ${config.bancaAtual >= 0 ? 'text-green-neon' : 'text-red-400'}`}>{formatMoney(config.bancaAtual)}</p>
          </div>
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">🎯 Meta do Dia</p>
            <p className="text-3xl font-cartoon text-white">{formatMoney(config.metaDiaria)}</p>
            <p className={`text-xs mt-1 ${metaAtingida ? 'text-green-neon' : 'text-gray-500'}`}>
              {metaAtingida ? '✅ Atingida!' : `Faltam ${formatMoney(metaRestante)}`}
            </p>
          </div>
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">📈 Lucro Hoje</p>
            <p className={`text-3xl font-cartoon ${hojeLucro >= 0 ? 'text-green-neon' : 'text-red-400'}`}>
              {hojeLucro >= 0 ? '+' : ''}{formatMoney(hojeLucro)}
            </p>
          </div>
          <div className="card-cartoon p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">💵 Próx. Entrada</p>
            <p className="text-3xl font-cartoon text-white">{formatMoney(entradaRec)}</p>
            <p className="text-[10px] text-gray-500 mt-1">2% da banca</p>
          </div>
        </div>
      )}

      {/* Meta progress bar */}
      {config && config.metaDiaria > 0 && (
        <div className="card-cartoon p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Progresso da Meta</span>
            <span className={`text-xs font-medium ${metaAtingida ? 'text-green-neon' : 'text-white'}`}>
              {formatMoney(hojeLucro)} / {formatMoney(config.metaDiaria)}
            </span>
          </div>
          <div className="w-full h-3 bg-dark-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${metaAtingida ? 'bg-green-neon' : stopAtingido ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, progressoMeta)}%` }} />
          </div>
          {metaAtingida && <p className="text-green-neon text-xs mt-2">🎉 Meta do dia atingida!</p>}
          {stopAtingido && <p className="text-red-400 text-xs mt-2">⚠️ Stop Loss atingido!</p>}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-cartoon p-4 text-center">
          <p className="text-xs text-gray-400">Total Ops</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <p className="text-xs text-gray-400">Wins</p>
          <p className="text-2xl font-bold text-green-400">{stats.win_direct + stats.win_g1 + stats.win_g2}</p>
          <p className="text-[10px] text-gray-500">{stats.win_direct}D / {stats.win_g1}G1 / {stats.win_g2}G2</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <p className="text-xs text-gray-400">Losses</p>
          <p className="text-2xl font-bold text-red-400">{stats.loss}</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <p className="text-xs text-gray-400">Maior Streak</p>
          <p className="text-2xl font-bold text-green-neon">{stats.maxWinStreak}</p>
          <p className="text-[10px] text-gray-500">Wins consecutivos</p>
        </div>
      </div>

      {/* Lucro semanal/mensal + streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-cartoon p-4 flex items-center gap-4">
          <HiTrendingUp className="text-3xl text-green-neon" />
          <div>
            <p className="text-xs text-gray-400">Lucro Semanal</p>
            <p className={`text-xl font-bold ${stats.lucroSemanal >= 0 ? 'text-green-neon' : 'text-red-400'}`}>{formatMoney(stats.lucroSemanal)}</p>
          </div>
        </div>
        <div className="card-cartoon p-4 flex items-center gap-4">
          <HiCalendar className="text-3xl text-green-neon" />
          <div>
            <p className="text-xs text-gray-400">Lucro Mensal</p>
            <p className={`text-xl font-bold ${stats.lucroMensal >= 0 ? 'text-green-neon' : 'text-red-400'}`}>{formatMoney(stats.lucroMensal)}</p>
          </div>
        </div>
        <div className="card-cartoon p-4 flex items-center gap-4">
          <HiTrendingDown className="text-3xl text-red-400" />
          <div>
            <p className="text-xs text-gray-400">Maior Sequência de Losses</p>
            <p className="text-xl font-bold text-red-400">{stats.maxLossStreak}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card-cartoon p-5">
        <h3 className="text-white font-medium mb-4">📈 Evolução da Banca</h3>
        {chartData.length > 1 ? (
          <div className="w-full h-48 md:h-64">
            <svg viewBox={`0 0 ${Math.max(chartData.length * 60, 300)} 200`} className="w-full h-full" preserveAspectRatio="none">
              <polyline fill="none" stroke="#22c55e" strokeWidth="2"
                points={chartData.map((p, i) => {
                  const x = i * 60 + 30
                  const y = 200 - ((p - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData) || 1)) * 160 - 20
                  return `${x},${y}`
                }).join(' ')}
              />
              {chartData.map((p, i) => {
                if (i % Math.max(1, Math.floor(chartData.length / 7)) !== 0 && i !== chartData.length - 1) return null
                const x = i * 60 + 30
                const y = 200 - ((p - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData) || 1)) * 160 - 20
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
    </div>
  )
}
