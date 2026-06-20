import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function GET(request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('GET /api/admin/categories error:', error)
    return NextResponse.json({ error: 'Erro ao listar categorias' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, active, order } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nome da categoria Ã© obrigatÃ³rio' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || 'ðŸ“¦',
        active: active !== false,
        order: order || 0,
      },
    })

    await logActivity(admin.id, admin.username, 'category_create', `Criou categoria: ${category.name}`)

    return NextResponse.json(category)
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'JÃ¡ existe uma categoria com este nome' }, { status: 409 })
    }
    console.error('POST /api/admin/categories error:', error)
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, icon, active, order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria Ã© obrigatÃ³rio' }, { status: 400 })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (icon !== undefined) updateData.icon = icon
    if (active !== undefined) updateData.active = active
    if (order !== undefined) updateData.order = order

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: updateData,
    })

    await logActivity(admin.id, admin.username, 'category_update', `Atualizou categoria: ${category.name}`)

    return NextResponse.json(category)
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'JÃ¡ existe uma categoria com este nome' }, { status: 409 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Categoria Não encontrada' }, { status: 404 })
    }
    console.error('PUT /api/admin/categories error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria Ã© obrigatÃ³rio' }, { status: 400 })
    }

    const category = await prisma.category.delete({
      where: { id: Number(id) },
    })

    await logActivity(admin.id, admin.username, 'category_delete', `Removeu categoria: ${category.name}`)

    return NextResponse.json({ message: 'Categoria removida com sucesso' })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Categoria Não encontrada' }, { status: 404 })
    }
    console.error('DELETE /api/admin/categories error:', error)
    return NextResponse.json({ error: 'Erro ao remover categoria' }, { status: 500 })
  }
}
