import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const formData = await request.formData()
    const files = formData.getAll('files')
    const uploaded = []

    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const blob = await put(filename, file, { access: 'public' })
      uploaded.push(blob.url)
    }

    return NextResponse.json({ urls: uploaded })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao fazer upload: ' + error.message }, { status: 500 })
  }
}
