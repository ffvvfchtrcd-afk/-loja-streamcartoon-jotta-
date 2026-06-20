'use client'

import { useState, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { HiPlus, HiPencil, HiTrash, HiCube, HiKey, HiTicket, HiTag, HiPhotograph, HiChevronLeft, HiChevronRight, HiCheck, HiX } from 'react-icons/hi'
import { adminFetcher } from '@/lib/fetcher'
import Toast, { useToast } from '@/components/Toast'

const deliveryTypes = [
  { value: 'auto', label: 'Entrega Automática', desc: 'Usa códigos de estoque. Mostra quantidade na loja.', icon: HiKey },
  { value: 'auto_v2', label: 'Entrega via Ticket', desc: 'Sem estoque. Cria um ticket de entrega.', icon: HiTicket },
]

const steps = [
  { id: 1, label: 'Informações' },
  { id: 2, label: 'Fotos' },
  { id: 3, label: 'Configurações' },
  { id: 4, label: 'Revisão' },
]

export default function AdminProdutos() {
  const { data, isLoading } = useSWR('/api/products', adminFetcher)
  const products = data?.products || []
  const { data: categoriesResult } = useSWR('/api/admin/categories', adminFetcher)
  const { mutate } = useSWRConfig()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showGuide, setShowGuide] = useState(true)
  const [step, setStep] = useState(1)
  const { toast, showToast, closeToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [pendingImages, setPendingImages] = useState([])
  const [cleaning, setCleaning] = useState(false)
  const fileInputRef = useRef(null)


  const categories = categoriesResult?.categories || []
  const defaultCategory = categories.length > 0 ? categories[0].name : ''

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: defaultCategory, active: true, deliveryType: 'auto', images: [],
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '', category: defaultCategory, active: true, deliveryType: 'auto', images: [] })
    setPendingImages([])
    setStep(1)
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      active: product.active,
      deliveryType: product.deliveryType || 'auto',
      images: product.images?.map(i => i.url) || [],
    })
    setPendingImages([])
    setStep(1)
    setShowModal(true)
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    const total = form.images.length + pendingImages.length + files.length
    if (total > 9) {
      showToast('Máximo de 9 fotos', 'error')
      return
    }
    setUploading(true)
    const newPending = await Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = (ev) => resolve({ file, preview: ev.target.result })
      reader.readAsDataURL(file)
    })))
    setPendingImages(prev => [...prev, ...newPending])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index) => {
    const imagesCount = form.images.length
    if (index < imagesCount) {
      setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    } else {
      setPendingImages(prev => prev.filter((_, i) => i !== index - imagesCount))
    }
  }

  const allImages = [...form.images, ...pendingImages.map(p => p.preview)]

  const addUrlImage = () => {
    const url = urlInput.trim()
    if (!url) return
    if (form.images.length + pendingImages.length >= 9) {
      showToast('Máximo de 9 fotos', 'error')
      return
    }
    setForm(prev => ({ ...prev, images: [...prev.images, url] }))
    setUrlInput('')
    showToast('Imagem adicionada!', 'success')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    let uploadedUrls = [...form.images]
    if (pendingImages.length > 0) {
      const formData = new FormData()
      pendingImages.forEach(p => formData.append('files', p.file))
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        uploadedUrls = [...uploadedUrls, ...uploadData.urls]
      }
    }

    const data = {
      ...form,
      price: parseFloat(form.price),
      images: uploadedUrls,
    }

    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        showToast(editing ? `Produto atualizado! (Categoria: ${form.category})` : 'Produto criado!', 'success')
        setShowModal(false)
        mutate('/api/products')
      } else {
        const errData = await res.json().catch(() => ({}))
        showToast(errData.error || `Erro ao salvar (${res.status})`, 'error')
      }
    } catch (err) {
      showToast('Erro de rede', 'error')
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

  const nextStep = () => setStep(s => Math.min(s + 1, 4))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const canNext = () => {
    if (step === 1) return form.name && form.price && form.description
    if (step === 2) return true
    if (step === 3) return form.category
    return true
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">📝</span>
              <h4 className="text-lg font-cartoon text-white">Informações do Produto</h4>
              <p className="text-sm text-gray-400">Dados básicos do produto</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nome do Produto *</label>
              <input
                className="input-cartoon text-lg"
                placeholder="Ex: Netflix 1 Mês"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Preço (R$) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-neon font-bold text-lg">R$</span>
                <input
                  type="number" step="0.01" min="0"
                  className="input-cartoon text-lg pl-12"
                  placeholder="19,90"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Descrição *</label>
              <div className="relative">
                <textarea
                  className="input-cartoon h-28 resize-none"
                  placeholder="Descreva os detalhes do produto, o que está incluído, benefícios..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
                {form.name && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.name) return
                      const token = localStorage.getItem('token')
                      const res = await fetch('/api/ai/generate-description', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ productName: form.name }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        const title = data.text.match(/TÍTULO:\s*(.+)/)?.[1] || ''
                        const desc = data.text.match(/DESCRIÇÃO:\s*(.+?)(?:\nPALAVRAS-CHAVE:|$)/s)?.[1]?.trim() || data.text
                        if (title) setForm(prev => ({ ...prev, name: title, description: desc }))
                        else setForm(prev => ({ ...prev, description: desc }))
                      }
                    }}
                    className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                  >
                    ✨ Gerar com IA
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{form.description.length} caracteres</p>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">🖼️</span>
              <h4 className="text-lg font-cartoon text-white">Fotos do Produto</h4>
              <p className="text-sm text-gray-400">Adicione até 9 fotos (opcional)</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {allImages.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dark-100 bg-dark-950">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <HiX className="text-white text-xs" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}

              {allImages.length < 9 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-dark-200 hover:border-green-neon/50 bg-dark-50/50 hover:bg-dark-50 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiPhotograph className="text-2xl text-gray-500" />
                      <span className="text-[10px] text-gray-500">Adicionar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />

            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addUrlImage()}
                placeholder="Ou cole uma URL de imagem..."
                className="input-cartoon flex-1 text-sm"
              />
              <button
                type="button"
                onClick={addUrlImage}
                disabled={!urlInput.trim() || allImages.length >= 9}
                className="btn-cartoon bg-green-neon/20 text-green-neon border border-green-neon/30 hover:bg-green-neon/30 px-3 rounded-lg disabled:opacity-30 text-sm"
              >
                Adicionar
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              {allImages.length}/9 fotos • Upload do PC ou URL externa
            </p>
          </div>
        )
      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">⚙️</span>
              <h4 className="text-lg font-cartoon text-white">Configurações</h4>
              <p className="text-sm text-gray-400">Categoria e tipo de entrega</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Categoria *
                <Link href="/admin/dashboard/categorias" className="text-green-neon hover:underline text-xs ml-2">(Gerenciar)</Link>
              </label>
              <div className="flex gap-2">
                <select className="input-cartoon flex-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {categories.length === 0 ? (
                    <option value="">Nenhuma categoria. Crie uma em Categorias</option>
                  ) : (
                    categories.filter(c => c.active).map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))
                  )}
                </select>
                {form.name && (
                  <button
                    type="button"
                    onClick={async () => {
                      const token = localStorage.getItem('token')
                      const res = await fetch('/api/ai/suggest-category', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ productName: form.name }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        const match = categories.find(c => c.name.toLowerCase().includes(data.category.toLowerCase()))
                        if (match) setForm(prev => ({ ...prev, category: match.name }))
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors text-xs whitespace-nowrap"
                  >
                    ✨ Sugerir
                  </button>
                )}
              </div>
              {categories.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">⚠️ Crie uma categoria primeiro em <Link href="/admin/dashboard/categorias" className="underline">Categorias</Link></p>
              )}
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
          </div>
        )
      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">✅</span>
              <h4 className="text-lg font-cartoon text-white">Revisão</h4>
              <p className="text-sm text-gray-400">Confira os dados antes de salvar</p>
            </div>

            <div className="bg-dark-50 rounded-xl p-4 space-y-3 border border-dark-100">
              <div>
                <span className="text-xs text-gray-500">Nome</span>
                <p className="text-white font-medium">{form.name}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Preço</span>
                  <p className="text-green-neon font-bold text-lg">R$ {parseFloat(form.price || 0).toFixed(2)}</p>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Categoria</span>
                  <p className="text-white">{form.category}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Descrição</span>
                <p className="text-gray-300 text-sm">{form.description}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Tipo de Entrega</span>
                <p className="text-white capitalize">{form.deliveryType === 'auto' ? 'Automática' : 'Via Ticket'}</p>
              </div>
              {allImages.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500">Fotos ({allImages.length})</span>
                  <div className="flex gap-2 mt-1">
                    {allImages.map((url, i) => (
                      <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-dark-100">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 border border-dark-100">
              <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-green-neon" />
              <label htmlFor="active" className="text-sm text-gray-400 cursor-pointer">
                {form.active ? '🟢 Produto ativo na loja' : '🔴 Produto inativo (não aparece na loja)'}
              </label>
            </div>
          </div>
        )
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Produtos</h2>
          <p className="text-gray-400 text-sm">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="btn-cartoon text-sm gap-2">
            <HiPlus className="text-lg" /> Novo Produto
          </button>
          <button
            onClick={async () => {
              setCleaning(true)
              try {
                const token = localStorage.getItem('token')
                const res = await fetch('/api/admin/cleanup-categories', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                showToast(data.message || 'Feito!', res.ok ? 'success' : 'error')
                if (res.ok) mutate('/api/products')
              } catch { showToast('Erro ao limpar', 'error') }
              setCleaning(false)
            }}
            disabled={cleaning}
            className="btn-cartoon-outline text-sm gap-2"
          >
            {cleaning ? 'Limpando...' : '🧹 Limpar Categorias'}
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="bg-gradient-to-r from-green-neon/10 to-emerald-500/5 border border-green-neon/30 rounded-2xl p-5 mb-6 relative animate-slide-up">
          <button
            onClick={() => setShowGuide(false)}
            className="absolute top-3 right-3 text-green-neon/50 hover:text-green-neon transition-colors text-lg"
          >✕</button>
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">💡</div>
            <div>
              <h3 className="font-cartoon text-green-neon text-lg mb-2">Como cadastrar um Produto?</h3>
              <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">1️⃣ Informações básicas</span>
                <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">2️⃣ Fotos (opcional)</span>
                <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">3️⃣ Configurações</span>
                <span className="bg-dark-50 border border-dark-100 rounded-lg px-2.5 py-1 text-xs text-gray-400">4️⃣ Revisão e salvar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiCube className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum produto cadastrado</p>
          <button onClick={openCreate} className="btn-cartoon text-sm mt-4">Criar Primeiro Produto</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map(product => (
              <div key={product.id} className={`card-cartoon flex items-center gap-4 p-4 animate-slide-up ${!product.category ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-dark-100 to-dark-950 flex-shrink-0">
                {product.images?.length > 0 ? (
                  <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {product.category.split(' ')[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-white">{product.name}</h3>
                  {product.images?.length > 1 && (
                    <span className="text-[10px] text-gray-500">+{product.images.length - 1} fotos</span>
                  )}
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
                {product.category ? (
                  <p className="text-xs text-gray-500">{product.category}</p>
                ) : (
                  <p className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded inline-block">⚠️ SEM CATEGORIA</p>
                )}
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
            {/* Steps Indicator */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step === s.id
                      ? 'bg-green-neon text-dark-950'
                      : step > s.id
                      ? 'bg-green-neon/20 text-green-neon'
                      : 'bg-dark-100 text-gray-500'
                  }`}>
                    {step > s.id ? <HiCheck className="text-lg" /> : s.id}
                  </div>
                  <span className={`text-xs hidden sm:block ${step >= s.id ? 'text-white' : 'text-gray-600'}`}>
                    {s.label}
                  </span>
                  {s.id < 4 && <div className={`w-6 h-0.5 ${step > s.id ? 'bg-green-neon' : 'bg-dark-100'}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSave}>
              {renderStep()}

              <div className="flex gap-3 mt-8 pt-4 border-t border-dark-100">
                {step > 1 ? (
                  <button type="button" onClick={prevStep} className="btn-cartoon-outline flex-1 text-sm gap-2">
                    <HiChevronLeft /> Voltar
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cartoon-outline flex-1 text-sm">
                    Cancelar
                  </button>
                )}

                {step < 4 ? (
                  <button type="button" onClick={nextStep} disabled={!canNext()} className="btn-cartoon flex-1 text-sm gap-2 disabled:opacity-50">
                    Avançar <HiChevronRight />
                  </button>
                ) : (
                  <button type="submit" className="btn-cartoon flex-1 text-sm">
                    {editing ? 'Atualizar Produto' : 'Criar Produto'}
                  </button>
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