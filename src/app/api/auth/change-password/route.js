import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'


export async function POST(request) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Senha atual e nova senha sÃ£o obrigatÃ³rias' }, { status: 400 })
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ error: 'Nova senha deve ter no mÃ­nimo 4 caracteres' }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'UsuÃ¡rio Não encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, dbUser.password)
  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  return NextResponse.json({ success: true })
}
