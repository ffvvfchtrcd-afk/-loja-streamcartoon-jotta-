import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'


export async function GET(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (admin.role !== 'superadmin') return NextResponse.json({ error: 'Apenas superadmin' }, { status: 403 })

  const admins = await prisma.admin.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(admins)
}


export async function POST(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (admin.role !== 'superadmin') return NextResponse.json({ error: 'Apenas superadmin' }, { status: 403 })

  const { username, password, role } = await request.json()
  if (!username || !password) return NextResponse.json({ error: 'Dados invÃ¡lidos' }, { status: 400 })

  const existing = await prisma.admin.findUnique({ where: { username } })
  if (existing) return NextResponse.json({ error: 'Username jÃ¡ existe' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  const newAdmin = await prisma.admin.create({
    data: { username, password: hashed, role: role || 'admin' },
  })

  const { logActivity } = await import('@/lib/activity')
  await logActivity(admin.id, admin.username, 'admin_create', `Criou admin: ${username}`)

  return NextResponse.json({ id: newAdmin.id, username: newAdmin.username, role: newAdmin.role })
}


export async function DELETE(request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (admin.role !== 'superadmin') return NextResponse.json({ error: 'Apenas superadmin' }, { status: 403 })

  const { id } = await request.json()
  if (id === admin.id) return NextResponse.json({ error: 'Não pode remover a si mesmo' }, { status: 400 })

  await prisma.admin.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
