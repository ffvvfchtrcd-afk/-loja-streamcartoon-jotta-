'use client'

import { useState, useRef } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { HiPlus, HiKey, HiFilter, HiClipboardCopy, HiCheck, HiCube, HiDownload } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

export default function AdminCodigos() {
  const { mutate } = useSWRConfig()
  const { data: codes, isLoading: codesLoading } = useSWR('/api/codes', adminFetcher)
  const { data: productsData } = useSWR('/api/products', adminFetcher)
  const products = productsData?.products || []
  const isLoading = codesLoading
  const [showModal, setShowModal] = useState(false)
  const [filterProduct, setFilterProduct] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const { toast, showToast, closeToast } = useToast()

  const [form, setForm] = useState({
    productId: '',
    values: '',
  })
  const fileInputRef = useRef(null)

  const handleFileImport = (e, doOpen = true) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        const codes = text.split('\n').map(v => v.trim()).filter(v => v).join('\n')
        setForm(prev => ({ ...prev, values: codes }))
        if (doOpen) setShowModal(true)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const autoProducts = products.filter(pr => pr.deliveryType === 'auto')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const values = form.values.split('\n').map(v => v.trim()).filter(v => v)

    const res = await fetch('/api/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: Number(form.productId), values }),
    })

    if (res.ok) {
      showToast(`${values.length} código(s) adicionado(s)!`, 'success')
      setShowModal(false)
      setForm({ productId: '', values: '' })
      mutate('/api/codes')
      mutate('/api/products')
    } else {
      showToast('Erro ao adicionar códigos', 'error')
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code.value)
    setCopiedId(code.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = filterProduct
    ? (codes || []).filter(c => c.productId === Number(filterProduct))
    : (codes || [])

  const usedCount = (codes || []).filter(c => c.used).length
  const availableCount = (codes || []).filter(c => !c.used).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Códigos</h2>
          <p className="text-gray-400 text-sm">Gerencie o estoque de códigos dos produtos com entrega automática</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-cartoon-outline text-sm gap-2">
            <HiDownload className="text-lg" /> Importar CSV
          </button>
          <button onClick={() => setShowModal(true)} className="btn-cartoon text-sm gap-2">
            <HiPlus className="text-lg" /> Adicionar Códigos
          </button>
          <a href="/api/admin/export?type=codes" className="btn-cartoon-outline text-sm gap-2">
            <HiDownload className="text-lg" /> Exportar CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-cartoon p-4 text-center">
          <p className="text-3xl font-bold text-white">{(codes || []).length}</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{availableCount}</p>
          <p className="text-gray-400 text-sm">Disponíveis</p>
        </div>
        <div className="card-cartoon p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{usedCount}</p>
          <p className="text-gray-400 text-sm">Usados</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <HiFilter className="text-gray-400" />
        <select
          className="input-cartoon w-auto"
          value={filterProduct}
          onChange={e => setFilterProduct(e.target.value)}
        >
          <option value="">Todos os produtos</option>
          {autoProducts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {autoProducts.length === 0 && (
          <p className="text-xs text-gray-500">Nenhum produto com entrega automática cadastrado</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiKey className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum código encontrado</p>
        </div>
      ) : (
        <div className="card-cartoon overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-dark-100">
                  <th className="text-left pb-3 font-medium">Produto</th>
                  <th className="text-left pb-3 font-medium">Código</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Pedido</th>
                  <th className="text-left pb-3 font-medium">Data</th>
                  <th className="text-left pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(code => (
                  <tr key={code.id} className="border-b border-dark-100/50 hover:bg-dark-50/50 transition-colors">
                    <td className="py-3 text-gray-300">{code.product?.name}</td>
                    <td className="py-3">
                      <code className="text-green-neon font-mono bg-dark-950 px-2 py-0.5 rounded text-xs">
                        {code.value}
                      </code>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${code.used ? 'status-pending' : 'status-paid'}`}>
                        {code.used ? 'Usado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{code.orderId ? `#${code.orderId}` : '-'}</td>
                    <td className="py-3 text-gray-500 text-xs">
                      {new Date(code.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleCopy(code)}
                        className="p-1.5 rounded-lg bg-dark-100 text-gray-400 hover:text-green-neon hover:bg-dark-200 transition-colors"
                        title="Copiar"
                      >
                        {copiedId === code.id ? <HiCheck className="text-green-neon" /> : <HiClipboardCopy />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card-cartoon w-full max-w-lg p-8 animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-cartoon text-xl text-white mb-2">Adicionar Códigos</h3>
            <p className="text-gray-400 text-sm mb-6">Adicione um ou mais códigos por vez</p>

            {autoProducts.length === 0 ? (
              <div className="text-center py-6">
                <HiCube className="text-4xl text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum produto com entrega automática disponível</p>
                <p className="text-gray-500 text-xs mt-1">Crie um produto com tipo "Entrega Automática" primeiro</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Produto</label>
                  <select className="input-cartoon" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required>
                    <option value="">Selecione um produto</option>
                    {autoProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Códigos <span className="text-gray-500">(um por linha)</span>
                  </label>
                  <textarea
                    className="input-cartoon h-40 resize-none font-mono text-sm"
                    placeholder={`NF1M-ABC123\nNF1M-DEF456\nNF1M-GHI789`}
                    value={form.values}
                    onChange={e => setForm({ ...form, values: e.target.value })}
                    required
                  />
                </div>
                <div className="border-t border-dark-100 pt-4">
                  <p className="text-sm text-gray-400 mb-2">Ou importar arquivo</p>
                  <input type="file" accept=".csv,.txt" onChange={e => handleFileImport(e, false)} className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-dark-100 file:text-gray-300 hover:file:bg-dark-200 cursor-pointer" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
                  <button type="submit" className="btn-cartoon flex-1 text-sm">Adicionar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
