import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  const operacao = await prisma.bancaOperacao.findUnique({ where: { id } })
  if (!operacao) {
    return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })
  }

  const config = await prisma.bancaConfig.findFirst()
  if (config) {
    const novaBanca = Math.max(0, config.bancaAtual - operacao.resultado)
    await prisma.bancaConfig.update({
      where: { id: config.id },
      data: { bancaAtual: novaBanca },
    })
  }

  await prisma.bancaOperacao.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
