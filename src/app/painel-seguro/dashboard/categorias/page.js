'use client'

import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { HiPlus, HiPencil, HiTrash, HiTag, HiLightBulb, HiInformationCircle } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

const defaultIcons = [
  { emoji: '🎬', label: 'Netflix' },
  { emoji: '📺', label: 'Disney+' },
  { emoji: '🎥', label: 'HBO' },
  { emoji: '🎵', label: 'Spotify' },
  { emoji: '📦', label: 'Amazon' },
  { emoji: '🎮', label: 'Jogos' },
  { emoji: '📱', label: 'Apps' },
  { emoji: '🛒', label: 'Outros' },
  { emoji: '💻', label: 'Programas' },
  { emoji: '🔒', label: 'Segurança' },
  { emoji: '📚', label: 'Cursos' },
  { emoji: '🎨', label: 'Design' },
]

export default function AdminCategorias() {
  const { mutate } = useSWRConfig()
  const { data: result, isLoading } = useSWR('/api/admin/categories', adminFetcher)
  const { toast, showToast, closeToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showGuide, setShowGuide] = useState(true)

  const [form, setForm] = useState({
    name: '',
    icon: '📦',
    active: true,
    order: 0,
  })

  const categories = result?.categories || []

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', icon: '📦', active: true, order: categories.length })
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      icon: cat.icon || '📦',
      active: cat.active,
      order: cat.order || 0,
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const data = { ...form, name: form.name.trim() }

    if (!data.name) {
      showToast('O nome da categoria é obrigatório', 'error')
      return
    }

    const url = editing ? '/api/admin/categories' : '/api/admin/categories'
    const method = editing ? 'PUT' : 'POST'

    const body = editing ? { id: editing.id, ...data } : data

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editing ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!', 'success')
      setShowModal(false)
      mutate('/api/admin/categories')
    } else {
      const err = await res.json()
      showToast(err.error || 'Erro ao salvar categoria', 'error')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${name}"?\n\nIsso não afeta os produtos existentes.`)) {
      return
    }

    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/categories?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      showToast('Categoria removida!', 'success')
      mutate('/api/admin/categories')
    } else {
      showToast('Erro ao remover categoria', 'error')
    }
  }

  const handleToggleActive = async (cat) => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: cat.id, active: !cat.active }),
    })

    if (res.ok) {
      showToast(`Categoria ${cat.active ? 'desativada' : 'ativada'}!`, 'success')
      mutate('/api/admin/categories')
    } else {
      showToast('Erro ao atualizar', 'error')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1 flex items-center gap-2">
            🏷️ Categorias
          </h2>
          <p className="text-gray-400 text-sm">
            Organize seus produtos em categorias para facilitar a navegação dos clientes
          </p>
        </div>
        <button onClick={openCreate} className="btn-cartoon text-sm gap-2">
          <HiPlus className="text-lg" /> Nova Categoria
        </button>
      </div>

      {/* Guia Didática */}
      {showGuide && (
        <div className="bg-gradient-to-r from-green-neon/10 to-emerald-500/5 border border-green-neon/30 rounded-2xl p-5 mb-6 relative animate-slide-up">
          <button
            onClick={() => setShowGuide(false)}
            className="absolute top-3 right-3 text-green-neon/50 hover:text-green-neon transition-colors text-lg"
            title="Fechar dica"
          >
            ✕
          </button>
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">💡</div>
            <div>
              <h3 className="font-cartoon text-green-neon text-lg mb-2">
                Como funcionam as Categorias?
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  <strong>Categorias</strong> são como <strong>prateleiras</strong> na sua loja. 
                  Cada produto pertence a uma categoria, facilitando a busca dos clientes.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1">
                    🎬 Netflix
                  </span>
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1">
                    📺 Disney+
                  </span>
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1">
                    🎥 HBO
                  </span>
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1">
                    🎵 Spotify
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚡ Dica: Crie categorias com nomes claros e use emojis para ficar visualmente atrativo!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-dark-50 border border-dark-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <HiInformationCircle className="text-blue-400 text-xl flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p>
            As categorias aparecem como filtros na página inicial da loja. 
            Crie quantas categorias precisar para organizar seus produtos.
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        /* Empty State */
        <div className="card-cartoon text-center py-12 animate-slide-up">
          <HiTag className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg mb-2">Nenhuma categoria ainda</p>
          <p className="text-gray-500 text-sm mb-6">
            Crie sua primeira categoria para começar a organizar seus produtos
          </p>
          <button onClick={openCreate} className="btn-cartoon text-sm gap-2">
            <HiPlus className="text-lg" /> Criar Primeira Categoria
          </button>
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`card-cartoon p-5 animate-slide-up relative ${
                !cat.active ? 'opacity-60' : ''
              }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* Active/Inactive badge */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    cat.active ? 'bg-green-neon' : 'bg-dark-200'
                  }`}
                  title={cat.active ? 'Desativar categoria' : 'Ativar categoria'}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    cat.active ? 'translate-x-4.5' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Icon */}
              <div className="text-5xl mb-3">{cat.icon || '📦'}</div>

              {/* Name */}
              <h3 className="font-cartoon text-lg text-white mb-1">{cat.name}</h3>

              {/* Info */}
              <div className="space-y-1 mb-4">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="text-green-neon">#</span> Ordem: {cat.order || 0}
                </p>
                <p className="text-xs text-gray-500">
                  Criada em {new Date(cat.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-dark-100">
                <button
                  onClick={() => openEdit(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
                >
                  <HiPencil /> Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                >
                  <HiTrash /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Create/Edit */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card-cartoon w-full max-w-lg p-8 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-cartoon text-xl text-white mb-1">
              {editing ? '✏️ Editar Categoria' : '🏷️ Nova Categoria'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {editing
                ? 'Altere as informações da categoria'
                : 'Crie uma nova categoria para organizar seus produtos'}
            </p>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Nome da Categoria <span className="text-red-400">*</span>
                </label>
                <input
                  className="input-cartoon"
                  placeholder="Ex: Netflix Premium"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escolha um nome claro que identifique bem a categoria
                </p>
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Ícone <span className="text-gray-500">(escolha um emoji)</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {defaultIcons.map(item => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => setForm({ ...form, icon: item.emoji })}
                      className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                        form.icon === item.emoji
                          ? 'border-green-neon bg-green-neon/10 scale-110'
                          : 'border-dark-100 bg-dark-50 hover:border-dark-200'
                      }`}
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                  <div className="col-span-6 mt-1">
                    <input
                      type="text"
                      className="input-cartoon text-center text-2xl py-1"
                      placeholder="Ou digite qualquer emoji"
                      value={form.icon}
                      onChange={e => setForm({ ...form, icon: e.target.value })}
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  className="input-cartoon"
                  placeholder="0"
                  value={form.order}
                  onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número menor aparece primeiro na loja
                </p>
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-green-neon"
                />
                <label htmlFor="active" className="text-sm text-gray-400">
                  Categoria ativa na loja
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cartoon-outline flex-1 text-sm"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-cartoon flex-1 text-sm">
                  {editing ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}