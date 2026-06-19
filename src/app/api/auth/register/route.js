import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateUserToken } from '@/lib/auth'

export async function POST(request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username e senha são obrigatórios' }, { status: 400 })
  }

  if (username.length < 3) {
    return NextResponse.json({ error: 'Username deve ter no mínimo 3 caracteres' }, { status: 400 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 4 caracteres' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username já está em uso' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, password: hashed },
  })

  const token = generateUserToken(user)

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username },
  })
}
