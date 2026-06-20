import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let config = await prisma.bancaConfig.findFirst()
  if (!config) {
    config = await prisma.bancaConfig.create({ data: {} })
  }

  return NextResponse.json(config)
}

export async function PUT(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const allowed = ['bancaAtual','valorEntrada','payout','metaDiaria','stopLoss','maxGales','galeMultiplier1','galeMultiplier2','metaManha','metaTarde','metaNoite']

  const data = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  let config = await prisma.bancaConfig.findFirst()
  if (config) {
    config = await prisma.bancaConfig.update({ where: { id: config.id }, data })
  } else {
    config = await prisma.bancaConfig.create({ data })
  }

  return NextResponse.json(config)
}
