import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'


export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}


export async function POST(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const data = await request.json()
  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      discount: Number(data.discount),
      discountType: data.discountType || 'percentage',
      minPurchase: Number(data.minPurchase) || 0,
      maxUses: Number(data.maxUses) || 0,
      active: true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })
  return NextResponse.json(coupon)
}


export async function PUT(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, ...data } = await request.json()
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
  })
  return NextResponse.json(coupon)
}


export async function DELETE(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await request.json()
  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
