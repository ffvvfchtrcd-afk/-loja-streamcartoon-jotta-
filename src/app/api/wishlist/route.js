import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'


export async function GET(request) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ items: [] })

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ items })
}


export async function POST(request) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'FaÃ§a login' }, { status: 401 })

  const { productId } = await request.json()
  if (!productId) return NextResponse.json({ error: 'productId Ã© obrigatÃ³rio' }, { status: 400 })

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  })
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return NextResponse.json({ wishlisted: false })
  }

  await prisma.wishlistItem.create({
    data: { userId: user.id, productId },
  })
  return NextResponse.json({ wishlisted: true })
}
