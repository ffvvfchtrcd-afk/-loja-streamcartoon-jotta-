import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'


export async function GET(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const codes = await prisma.code.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(codes)
}


export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { productId, values } = await request.json()

  const codes = await prisma.code.createMany({
    data: values.map(value => ({ productId, value: value.trim() })),
  })

  return NextResponse.json({ created: codes.count })
}
