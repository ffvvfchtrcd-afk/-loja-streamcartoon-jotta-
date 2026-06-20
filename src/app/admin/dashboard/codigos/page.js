'use client'

import { useState, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { HiPlus, HiKey, HiClipboardCopy, HiCheck, HiCube, HiDownload, HiEye, HiChevronDown, HiChevronUp, HiSearch, HiSortAscending, HiSortDescending } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

export default function AdminCodigos() {
  const { mutate } = useSWRConfig()
  const { data: codes, isLoading: codesLoading } = useSWR('/api/codes', adminFetcher)
  const { data: productsData } = useSWR('/api/products', adminFetcher)
  const products = productsData?.products || []
  const isLoading = codesLoading
  const [showModal, setShowModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [filterTab, setFilterTab] = useState('all')
  const [showCodesFor, setShowCodesFor] = useState(null)
  const [sortBy, setSortBy] = useState('stock_asc')
  const { toast, showToast, closeToast } = useToast()

  const [form, setForm] = useState({
    productId: '',
    values: '',
  })
  const fileInputRef = useRef(null)
  const urlInputRef = useRef(null)

  const autoProducts = useMemo(() =>
    products.filter(pr => pr.deliveryType === 'auto'),
    [products]
  )

  const stockData = useMemo(() => {
    if (!codes || !autoProducts.length) return []
    const allCodes = codes || []
    return autoProducts.map(product => {
      const productCodes = allCodes.filter(c => c.productId === product.id)
      const available = productCodes.filter(c => !c.used).length
      const used = productCodes.filter(c => c.used).length
      const recentCodes = productCodes.filter(c => !c.used).slice(-3)
      return { ...product, available, used, total: productCodes.length, recentCodes }
    })
  }, [codes, autoProducts])

  const filteredStock = useMemo(() => {
    let list = [...stockData]
    if (filterTab === 'in_stock') list = list.filter(p => p.available > 0)
    else if (filterTab === 'low_stock') list = list.filter(p => p.available > 0 && p.available <= 5)
    else if (filterTab === 'out_of_stock') list = list.filter(p => p.available === 0)

    list.sort((a, b) => {
      if (sortBy === 'stock_asc') return a.available - b.available
      if (sortBy === 'stock_desc') return b.available - a.available
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
    return list
  }, [stockData, filterTab, sortBy])

  const stats = useMemo(() => {
    const total = stockData.length
    const inStock = stockData.filter(p => p.available > 0).length
    const lowStock = stockData.filter(p => p.available > 0 && p.available <= 5).length
    const outOfStock = stockData.filter(p => p.available === 0).length
    const totalCodes = stockData.reduce((s, p) => s + p.total, 0)
    const totalAvailable = stockData.reduce((s, p) => s + p.available, 0)
    return { total, inStock, lowStock, outOfStock, totalCodes, totalAvailable }
  }, [stockData])

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

  const openAddStock = (productId = '') => {
    setSelectedProductId(productId || '')
    setForm({ productId: productId || '', values: '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const values = form.values.split('\n').map(v => v.trim()).filter(v => v)
    if (!values.length) return

    const res = await fetch('/api/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: Number(form.productId), values }),
    })

    if (res.ok) {
      showToast(`${values.length} c\u00f3digo(s) adicionado(s) ao estoque!`, 'success')
      setShowModal(false)
      setForm({ productId: '', values: '' })
      mutate('/api/codes')
      mutate('/api/products')
    } else {
      showToast('Erro ao adicionar c\u00f3digos', 'error')
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code.value)
    setCopiedId(code.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStockColor = (available) => {
    if (available === 0) return 'text-red-400'
    if (available <= 5) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStockBg = (available) => {
    if (available === 0) return 'bg-red-500/20'
    if (available <= 5) return 'bg-yellow-500/20'
    return 'bg-green-500/20'
  }

  const getStockBar = (available) => {
    const max = Math.max(...stockData.map(p => p.available), 1)
    const pct = Math.min((available / max) * 100, 100)
    if (available === 0) return 'bg-red-500'
    if (available <= 5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusLabel = (available) => {
    if (available === 0) return 'Sem estoque'
    if (available <= 5) return 'Estoque baixo'
    return 'Em estoque'
  }

  const getStatusColor = (available) => {
    if (available === 0) return 'bg-red-500/20 text-red-400'
    if (available <= 5) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-green-500/20 text-green-400'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Estoque</h2>
          <p className="text-gray-400 text-sm">Gerencie o estoque de c\u00f3digos dos produtos</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-cartoon-outline text-sm gap-2">
            <HiDownload className="text-lg" /> Importar
          </button>
          <button onClick={() => openAddStock()} className="btn-cartoon text-sm gap-2">
            <HiPlus className="text-lg" /> Adicionar Estoque
          </button>
          <a href="/api/admin/export?type=codes" className="btn-cartoon-outline text-sm gap-2">
            <HiDownload className="text-lg" /> Exportar
          </a>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="card-cartoon p-4">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-gray-500 text-xs mt-1">Produtos</p>
        </div>
        <div className="card-cartoon p-4">
          <p className="text-2xl font-bold text-white">{stats.totalAvailable}</p>
          <p className="text-gray-500 text-xs mt-1">C\u00f3digos dispon\u00edveis</p>
        </div>
        <div className="card-cartoon p-4">
          <p className="text-2xl font-bold text-green-400">{stats.inStock}</p>
          <p className="text-gray-500 text-xs mt-1">Em estoque</p>
        </div>
        <div className="card-cartoon p-4">
          <p className="text-2xl font-bold text-yellow-400">{stats.lowStock}</p>
          <p className="text-gray-500 text-xs mt-1">Estoque baixo</p>
        </div>
        <div className="card-cartoon p-4">
          <p className="text-2xl font-bold text-red-400">{stats.outOfStock}</p>
          <p className="text-gray-500 text-xs mt-1">Sem estoque</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { id: 'all', label: `Todos (${stockData.length})` },
          { id: 'in_stock', label: `Em estoque (${stats.inStock})` },
          { id: 'low_stock', label: `Estoque baixo (${stats.lowStock})` },
          { id: 'out_of_stock', label: `Sem estoque (${stats.outOfStock})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterTab === tab.id
                ? 'bg-green-neon/20 text-green-neon border border-green-neon/30'
                : 'bg-dark-100 text-gray-400 border border-dark-100 hover:border-dark-50'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <HiSortAscending className="text-gray-500 text-sm" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input-cartoon w-auto text-xs py-1.5"
          >
            <option value="stock_asc">Menor estoque</option>
            <option value="stock_desc">Maior estoque</option>
            <option value="name">Nome</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : filteredStock.length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiCube className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum produto encontrado</p>
          {filterTab !== 'all' && (
            <button onClick={() => setFilterTab('all')} className="text-green-neon text-sm mt-2 hover:underline">
              Limpar filtro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStock.map(product => {
            const maxStock = Math.max(...stockData.map(p => p.available), 1)
            const barWidth = Math.min((product.available / maxStock) * 100, 100)
            const isExpanded = showCodesFor === product.id

            return (
              <div key={product.id} className="card-cartoon overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">{product.categoryRel?.icon || product.category?.charAt(0) || '?'}</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{product.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(product.available)}`}>
                          {getStatusLabel(product.available)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{product.categoryRel?.icon} {product.category}</p>
                    </div>

                    <div className="text-center px-4">
                      <p className={`text-2xl font-bold ${getStockColor(product.available)}`}>{product.available}</p>
                      <p className="text-[10px] text-gray-500">dispon\u00edvel</p>
                    </div>

                    <div className="text-center px-4 border-l border-dark-100">
                      <p className="text-lg font-bold text-gray-400">{product.used}</p>
                      <p className="text-[10px] text-gray-600">usados</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddStock(product.id)}
                        className="btn-cartoon text-xs py-2 px-3 gap-1.5"
                      >
                        <HiPlus className="text-sm" /> Add Estoque
                      </button>
                      <button
                        onClick={() => setShowCodesFor(isExpanded ? null : product.id)}
                        className="btn-cartoon-outline text-xs py-2 px-3 gap-1.5"
                      >
                        <HiEye className="text-sm" /> {isExpanded ? 'Ocultar' : 'Ver C\u00f3digos'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getStockBar(product.available)}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-dark-100 bg-dark-950/50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs text-gray-400 font-medium">C\u00f3digos dispon\u00edveis</h4>
                        <span className="text-xs text-gray-500">{product.recentCodes.length} \u00faltimos</span>
                      </div>
                      {product.recentCodes.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-4">Nenhum c\u00f3digo dispon\u00edvel</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {product.recentCodes.map(code => (
                            <div key={code.id} className="flex items-center gap-1 bg-dark-100 rounded-lg px-3 py-1.5 group">
                              <code className="text-green-neon font-mono text-xs">{code.value}</code>
                              <button
                                onClick={() => handleCopy(code)}
                                className="p-0.5 text-gray-600 hover:text-green-neon opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedId === code.id ? <HiCheck className="text-green-neon text-xs" /> : <HiClipboardCopy className="text-xs" />}
                              </button>
                            </div>
                          ))}
                          {(codes || []).filter(c => c.productId === product.id && !c.used).length > 3 && (
                            <span className="text-xs text-gray-600 self-center">+{((codes || []).filter(c => c.productId === product.id && !c.used).length - 3)} mais</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card-cartoon w-full max-w-lg p-8 animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-cartoon text-xl text-white mb-2">Adicionar Estoque</h3>
            <p className="text-gray-400 text-sm mb-6">Adicione c\u00f3digos ao estoque do produto</p>

            {autoProducts.length === 0 ? (
              <div className="text-center py-6">
                <HiCube className="text-4xl text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum produto com entrega autom\u00e1tica</p>
                <p className="text-gray-500 text-xs mt-1">Crie um produto com tipo "Entrega Autom\u00e1tica" primeiro</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Produto</label>
                  <select className="input-cartoon" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required>
                    <option value="">Selecione um produto</option>
                    {autoProducts.map(p => {
                      const pStock = stockData.find(s => s.id === p.id)
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({pStock?.available || 0} disp.)
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    C\u00f3digos <span className="text-gray-500">(um por linha)</span>
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
                  <p className="text-sm text-gray-400 mb-2">Ou importar arquivo .txt</p>
                  <input type="file" accept=".csv,.txt" onChange={e => handleFileImport(e, false)} className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-dark-100 file:text-gray-300 hover:file:bg-dark-200 cursor-pointer" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
                  <button type="submit" className="btn-cartoon flex-1 text-sm">Adicionar ao Estoque</button>
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
