import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const productId = Number(searchParams.get('productId'))
  if (!productId) return NextResponse.json({ error: 'productId é obrigatório' }, { status: 400 })

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(reviews)
}

export async function POST(request) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Faça login' }, { status: 401 })

  const { productId, rating, comment } = await request.json()
  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  })
  if (existing) return NextResponse.json({ error: 'Você já avaliou este produto' }, { status: 400 })

  await prisma.review.create({
    data: { productId, userId: user.id, rating, comment: comment || '' },
  })

  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  })
  await prisma.product.update({
    where: { id: productId },
    data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count },
  })

  return NextResponse.json({ success: true })
}
