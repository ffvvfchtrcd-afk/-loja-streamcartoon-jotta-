import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'
import { logActivity } from '@/lib/activity'


export async function POST(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { productId, values } = await request.json()
  if (!productId || !values || !values.length) {
    return NextResponse.json({ error: 'Dados invÃ¡lidos' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
  if (!product) return NextResponse.json({ error: 'Produto nÃ£o encontrado' }, { status: 404 })

  const created = []
  for (const value of values) {
    if (value.trim()) {
      await prisma.code.create({ data: { productId: Number(productId), value: value.trim() } })
      created.push(value.trim())
    }
  }

  await logActivity(admin.id, admin.username, 'import_codes', `Importou ${created.length} cÃ³digos para ${product.name}`)

  return NextResponse.json({ created: created.length })
}
