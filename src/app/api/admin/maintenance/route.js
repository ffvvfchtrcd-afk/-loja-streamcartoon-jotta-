import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: 'maintenance_mode' } })
  return NextResponse.json({ enabled: setting?.value === 'true' })
}

export async function PUT(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { enabled } = await request.json()
  await prisma.setting.upsert({
    where: { key: 'maintenance_mode' },
    update: { value: enabled ? 'true' : 'false' },
    create: { key: 'maintenance_mode', value: enabled ? 'true' : 'false' },
  })

  return NextResponse.json({ enabled })
}
