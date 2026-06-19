import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function POST(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { productId, values } = await request.json()
  if (!productId || !values || !values.length) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  const created = []
  for (const value of values) {
    if (value.trim()) {
      await prisma.code.create({ data: { productId: Number(productId), value: value.trim() } })
      created.push(value.trim())
    }
  }

  await logActivity(admin.id, admin.username, 'import_codes', `Importou ${created.length} códigos para ${product.name}`)

  return NextResponse.json({ created: created.length })
}
