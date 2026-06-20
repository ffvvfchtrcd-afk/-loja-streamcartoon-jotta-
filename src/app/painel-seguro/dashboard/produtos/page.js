'use client'

import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { HiPlus, HiPencil, HiTrash, HiCube, HiKey, HiTicket, HiTag } from 'react-icons/hi'
import { adminFetcher } from '@/lib/fetcher'
import Toast, { useToast } from '@/components/Toast'

const deliveryTypes = [
  { value: 'auto', label: 'Entrega Automática', desc: 'Usa códigos de estoque. Mostra quantidade na loja. Entrega imediata ao confirmar pagamento.', icon: HiKey },
  { value: 'auto_v2', label: 'Entrega via Ticket', desc: 'Sem estoque. Cria um ticket de entrega ao confirmar pagamento. Admin entrega manualmente no ticket.', icon: HiTicket },
]

export default function AdminProdutos() {
  const { data: products, isLoading } = useSWR('/api/products', adminFetcher)
  const { data: categoriesResult } = useSWR('/api/admin/categories', adminFetcher)
  const { mutate } = useSWRConfig()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showGuide, setShowGuide] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const { toast, showToast, closeToast } = useToast()

  const categories = categoriesResult?.categories || []
  const defaultCategory = categories.length > 0 ? categories[0].name : ''

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: defaultCategory, active: true, deliveryType: 'auto',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '', category: defaultCategory, active: true, deliveryType: 'auto' })
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category || '',
      active: product.active,
      deliveryType: product.deliveryType || 'auto',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    const data = { ...form, price: parseFloat(form.price) }
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })

    setConfirming(false)
    if (res.ok) {
      showToast(editing ? 'Produto atualizado!' : 'Produto criado!', 'success')
      setShowModal(false)
      mutate('/api/products')
    } else {
      showToast('Erro ao salvar produto', 'error')
    }
  }

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      showToast('Produto removido!', 'success')
      mutate('/api/products')
    } else {
      showToast('Erro ao remover produto', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Produtos</h2>
          <p className="text-gray-400 text-sm">Gerencie seu catálogo de produtos</p>
        </div>
        <button onClick={openCreate} className="btn-cartoon text-sm gap-2">
          <HiPlus className="text-lg" /> Novo Produto
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
                Como cadastrar um Produto?
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  <strong>Produtos</strong> são os itens que você vende na sua loja. 
                  Cada produto precisa de um <strong>nome</strong>, <strong>preço</strong> e 
                  uma <strong>categoria</strong> para aparecer corretamente.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">
                    1️⃣ Escolha um nome claro
                  </span>
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">
                    2️⃣ Defina o preço
                  </span>
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">
                    3️⃣ Selecione a categoria
                  </span>
                  <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">
                    4️⃣ Escolha o tipo de entrega
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ⚡ As categorias são gerenciadas em <strong>Categorias</strong> no menu ao lado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : (products || []).length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiCube className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum produto cadastrado</p>
          <button onClick={openCreate} className="btn-cartoon text-sm mt-4">Criar Primeiro Produto</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {(products || []).map(product => (
            <div key={product.id} className="card-cartoon flex items-center gap-4 p-4 animate-slide-up">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center text-2xl flex-shrink-0">
                {product.category?.split(' ')[0] || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-white">{product.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                    product.deliveryType === 'auto_v2'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-green-500/10 text-green-400 border border-green-500/30'
                  }`}>
                    {product.deliveryType === 'auto_v2' ? 'Via Ticket' : 'Auto'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{product.description}</p>
              </div>
              <div className="text-right">
                <p className="text-green-neon font-bold">R$ {product.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(product)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                  <HiPencil />
                </button>
                <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                  <HiTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card-cartoon w-full max-w-lg p-8 animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-cartoon text-xl text-white mb-6">
              {editing ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={e => e.preventDefault()} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input className="input-cartoon" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea className="input-cartoon h-20 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" className="input-cartoon" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Categoria <Link href="/admin/dashboard/categorias" className="text-green-neon hover:underline text-xs ml-1">(Gerenciar)</Link>
                  </label>
                  <select className="input-cartoon" value={form.category} onChange={e => {
                    const cat = categories.find(c => c.name === e.target.value)
                    setForm({ ...form, category: cat?.name || e.target.value })
                  }}>
                    {categories.length === 0 ? (
                      <option value="">Nenhuma categoria. Crie uma em Categorias</option>
                    ) : (
                      <>
                        <option value="">Selecione uma categoria</option>
                        {categories.filter(c => c.active).map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Nenhuma categoria cadastrada. Vá em <Link href="/admin/dashboard/categorias" className="underline">Categorias</Link> para criar.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">Tipo de Entrega</label>
                <div className="space-y-2">
                  {deliveryTypes.map(dt => {
                    const Icon = dt.icon
                    return (
                      <label key={dt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        form.deliveryType === dt.value
                          ? 'border-green-neon/50 bg-green-neon/5'
                          : 'border-dark-100 bg-dark-50 hover:border-dark-200'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryType"
                          value={dt.value}
                          checked={form.deliveryType === dt.value}
                          onChange={e => setForm({ ...form, deliveryType: e.target.value })}
                          className="mt-0.5 accent-green-neon"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className={`text-sm ${form.deliveryType === dt.value ? 'text-green-neon' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${form.deliveryType === dt.value ? 'text-green-neon' : 'text-white'}`}>
                              {dt.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{dt.desc}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-green-neon" />
                <label htmlFor="active" className="text-sm text-gray-400">Produto ativo na loja</label>
              </div>
              <div className="flex gap-3 pt-2">
                {confirming ? (
                  <>
                    <button type="button" onClick={() => setConfirming(false)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
                    <button type="button" onClick={handleSave} className="btn-cartoon flex-1 text-sm bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">✓ Confirmar</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
                    <button type="button" onClick={() => setConfirming(true)} className="btn-cartoon flex-1 text-sm">Salvar</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
