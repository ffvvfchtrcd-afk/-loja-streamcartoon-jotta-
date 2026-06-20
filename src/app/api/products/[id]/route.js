import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export async function PUT(request, { params }) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  const data = await request.json()
  const { images, categoryId, ...productData } = data

  let catName = productData.category || ''
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } })
    if (cat) catName = cat.name
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      category: catName,
      categoryId: categoryId || null,
      images: {
        deleteMany: {},
        create: images?.length
          ? images.map((url, i) => ({ url, alt: productData.name || '', order: i }))
          : undefined,
      },
    },
    include: { images: { orderBy: { order: 'asc' } }, categoryRel: true },
  })
  await logActivity(admin.id, admin.username, 'product_update', `Atualizou produto: ${product.name}`)
  return NextResponse.json(product)
}

export async function DELETE(request, { params }) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  await prisma.$transaction([
    prisma.code.deleteMany({ where: { productId: id } }),
    prisma.review.deleteMany({ where: { productId: id } }),
    prisma.wishlistItem.deleteMany({ where: { productId: id } }),
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.orderItem.deleteMany({ where: { productId: id } }),
    prisma.order.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.product.delete({ where: { id } }),
  ])

  await logActivity(admin.id, admin.username, 'product_delete', `Removeu produto: ${product.name}`)
  return NextResponse.json({ success: true, message: 'Produto removido permanentemente' })
}

export async function GET(request, { params }) {
  const id = Number(params.id)
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      categoryRel: true,
      reviews: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  if (product.deliveryType === 'auto') {
    const codes = await prisma.code.findMany({ where: { productId: id, used: false } })
    product.stock = codes.length
  } else {
    product.stock = 999
  }
  return NextResponse.json(product)
}
