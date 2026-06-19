import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'


export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(logs)
}
