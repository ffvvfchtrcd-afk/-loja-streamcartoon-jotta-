import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'


export async function POST(request) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'FaÃ§a login' }, { status: 401 })

  const { code, total } = await request.json()
  if (!code) return NextResponse.json({ error: 'CÃ³digo Ã© obrigatÃ³rio' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (!coupon) return NextResponse.json({ error: 'Cupom Não encontrado' }, { status: 404 })
  if (!coupon.active) return NextResponse.json({ error: 'Cupom inativo' }, { status: 400 })
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
  }
  if (total < coupon.minPurchase) {
    return NextResponse.json({ error: `Valor mÃ­nimo: R$ ${coupon.minPurchase.toFixed(2)}` }, { status: 400 })
  }

  let discount = 0
  if (coupon.discountType === 'percentage') {
    discount = total * (coupon.discount / 100)
  } else {
    discount = coupon.discount
  }
  if (discount > total) discount = total

  return NextResponse.json({ discount, couponId: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discount })
}
