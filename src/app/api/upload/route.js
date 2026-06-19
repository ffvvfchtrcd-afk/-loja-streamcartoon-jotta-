import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request) {
  const { getAdminFromRequest } = await import('@/lib/auth')
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const formData = await request.formData()
    const files = formData.getAll('files')
    const uploaded = []

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = path.extname(file.name) || '.jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      uploaded.push(`/uploads/${filename}`)
    }

    return NextResponse.json({ urls: uploaded })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao fazer upload: ' + error.message }, { status: 500 })
  }
}