import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'


export async function GET(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const settings = await prisma.setting.findMany()
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  return NextResponse.json(map)
}


export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const data = await request.json()

  for (const [key, value] of Object.entries(data)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  await logActivity(admin.id, admin.username, 'settings_update', 'Atualizou configuraÃ§Ãµes')
  return NextResponse.json({ success: true })
}
