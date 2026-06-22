import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateUserToken } from '@/lib/auth'

const attempts = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const maxAttempts = 10
  const record = attempts.get(ip) || { count: 0, resetAt: now + windowMs }
  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }
  record.count++
  attempts.set(ip, record)
  return record.count <= maxAttempts
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
  }

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
