import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateUserToken } from '@/lib/auth'

export async function POST(request) {
  const { username, password } = await request.json()

  let user = await prisma.user.findUnique({ where: { username } })
  let isAdmin = false

  if (!user || !(await bcrypt.compare(password, user.password))) {
    const admin = await prisma.admin.findUnique({ where: { username } })
    if (admin && (await bcrypt.compare(password, admin.password))) {
      isAdmin = true
      user = await prisma.user.findUnique({ where: { username } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            username,
            password: admin.password,
          },
        })
      }
    } else {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }
  }

  const token = generateUserToken(user)

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username },
    isAdmin,
  })
}
