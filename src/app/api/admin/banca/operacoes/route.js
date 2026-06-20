import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mes = searchParams.get('mes')
  const ano = searchParams.get('ano')

  const where = {}
  if (mes && ano) {
    const prefix = `${ano}-${mes.padStart(2, '0')}`
    where.dia = { startsWith: prefix }
  }

  const operacoes = await prisma.bancaOperacao.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(operacoes)
}

export async function POST(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tipo, periodo } = await request.json()
  if (!tipo || !periodo) {
    return NextResponse.json({ error: 'tipo e periodo são obrigatórios' }, { status: 400 })
  }

  if (!['win_direct', 'win_g1', 'win_g2', 'loss'].includes(tipo)) {
    return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
  }
  if (!['manha', 'tarde', 'noite'].includes(periodo)) {
    return NextResponse.json({ error: 'periodo inválido' }, { status: 400 })
  }

  let config = await prisma.bancaConfig.findFirst()
  if (!config) {
    config = await prisma.bancaConfig.create({ data: {} })
  }

  const entrada = config.valorEntrada
  const payout = config.payout
  const g1 = config.galeMultiplier1
  const g2 = config.galeMultiplier2
  const gales = config.maxGales
  const g1Entry = entrada * g1
  const g2Entry = entrada * g2

  let resultado = 0

  if (tipo === 'win_direct') {
    resultado = entrada * payout
  } else if (tipo === 'win_g1') {
    resultado = g1Entry * payout - entrada
  } else if (tipo === 'win_g2') {
    resultado = g2Entry * payout - entrada - g1Entry
  } else if (tipo === 'loss') {
    if (gales >= 2) resultado = -(entrada + g1Entry + g2Entry)
    else if (gales === 1) resultado = -(entrada + g1Entry)
    else resultado = -entrada
  }

  const novaBanca = Math.max(0, config.bancaAtual + resultado)
  const today = new Date()
  const dia = today.toISOString().slice(0, 10)

  const [operacao] = await prisma.$transaction([
    prisma.bancaOperacao.create({
      data: { dia, periodo, tipo, entrada, resultado, saldoPos: novaBanca },
    }),
    prisma.bancaConfig.update({
      where: { id: config.id },
      data: { bancaAtual: novaBanca },
    }),
  ])

  return NextResponse.json({ operacao, bancaAtual: novaBanca })
}
