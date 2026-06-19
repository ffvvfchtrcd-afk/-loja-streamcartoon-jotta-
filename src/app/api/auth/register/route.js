import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateUserToken } from '@/lib/auth'


export async function POST(request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username e senha sÃ£o obrigatÃ³rios' }, { status: 400 })
  }

  if (username.length < 3) {
    return NextResponse.json({ error: 'Username deve ter no mÃ­nimo 3 caracteres' }, { status: 400 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: 'Senha deve ter no mÃ­nimo 4 caracteres' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username jÃ¡ estÃ¡ em uso' }, { status: 400 })
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
