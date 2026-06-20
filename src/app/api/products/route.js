import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'


export async function GET(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = searchParams.get('order') || 'asc'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit

  const where = admin ? {} : { active: true, category: { not: '' } }

  const orClauses = []

  if (q) {
    orClauses.push(
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    )
  }

  if (category) {
    orClauses.push(
      { category },
      { categoryRel: { name: category } },
    )
  }

  if (orClauses.length > 0) where.OR = orClauses

  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = parseFloat(minPrice)
    if (maxPrice) where.price.lte = parseFloat(maxPrice)
  }

  const orderBy = {}
  if (sort === 'price') {
    orderBy.price = order
  } else if (sort === 'name') {
    orderBy.name = order
  } else {
    orderBy.createdAt = order
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { images: { orderBy: { order: 'asc' } }, categoryRel: true },
    }),
  ])

  const autoIds = products.filter(p => p.deliveryType === 'auto').map(p => p.id)
  const stockCounts = autoIds.length
    ? await prisma.code.groupBy({
        by: ['productId'],
        where: { used: false, productId: { in: autoIds } },
        _count: { id: true },
      })
    : []

  const stockMap = {}
  stockCounts.forEach(s => { stockMap[s.productId] = s._count.id })

  const productsWithStock = products.map(product => ({
    ...product,
    stock: product.deliveryType === 'auto' ? (stockMap[product.id] || 0) : 999,
  }))

  return NextResponse.json({
    products: productsWithStock,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}


export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const data = await request.json()
  const { images, categoryId, ...productData } = data

  let catName = productData.category || ''
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } })
    if (cat) catName = cat.name
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      category: catName,
      categoryId: categoryId || null,
      images: images?.length ? {
        create: images.map((url, i) => ({
          url,
          alt: productData.name || '',
          order: i,
        })),
      } : undefined,
    },
    include: { images: { orderBy: { order: 'asc' } }, categoryRel: true },
  })
  await logActivity(admin.id, admin.username, 'product_create', `Criou produto: ${product.name}`)
  return NextResponse.json({ ...product, stock: product.deliveryType === 'auto' ? 0 : 999 })
}
