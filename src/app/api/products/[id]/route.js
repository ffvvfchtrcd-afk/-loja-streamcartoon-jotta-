import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export async function PUT(request, { params }) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const id = Number(params.id)
  const data = await request.json()
  const { images, ...productData } = data

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      images: {
        deleteMany: {},
        create: images?.length
          ? images.map((url, i) => ({ url, alt: productData.name || '', order: i }))
          : undefined,
      },
    },
    include: { images: { orderBy: { order: 'asc' } } },
  })
  await logActivity(admin.id, admin.username, 'product_update', `Atualizou produto: ${product.name}`)
  return NextResponse.json(product)
}

export async function DELETE(request, { params }) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const id = Number(params.id)
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Produto nÃ£o encontrado' }, { status: 404 })
  await prisma.product.delete({ where: { id } })
  await logActivity(admin.id, admin.username, 'product_delete', `Removeu produto: ${product.name}`)
  return NextResponse.json({ success: true })
}

export async function GET(request, { params }) {
  const id = Number(params.id)
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      reviews: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!product) return NextResponse.json({ error: 'Produto nÃ£o encontrado' }, { status: 404 })
  if (product.deliveryType === 'auto') {
    const codes = await prisma.code.findMany({ where: { productId: id, used: false } })
    product.stock = codes.length
  } else {
    product.stock = 999
  }
  return NextResponse.json(product)
}
