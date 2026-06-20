'use client'

import { useState, Suspense } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { HiShieldCheck, HiLightningBolt, HiEmojiHappy, HiSearch, HiFilter, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import ProductCard from '@/components/ProductCard'

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900" />}>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const selectedCategory = searchParams.get('category') || 'Todas'
  const q = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const [searchInput, setSearchInput] = useState(q)
  const [showFilters, setShowFilters] = useState(false)

  const apiParams = new URLSearchParams()
  if (q) apiParams.set('q', q)
  if (sort) apiParams.set('sort', sort.split('-')[0])
  if (sort && sort.includes('-desc')) apiParams.set('order', 'desc')
  if (minPrice) apiParams.set('minPrice', minPrice)
  if (maxPrice) apiParams.set('maxPrice', maxPrice)
  apiParams.set('page', page.toString())
  apiParams.set('limit', '50')

  const { data: result, isLoading } = useSWR(
    `/api/products?${apiParams.toString()}`
  )
  const products = result?.products || []
  const totalPages = result?.totalPages || 1
  const total = result?.total || 0

  const getCatName = (p) => p.category || ''

  const allCategories = products.length > 0
    ? ['Todas', ...new Set(products.map(getCatName).filter(Boolean))]
    : ['Todas']

  const filtered = selectedCategory === 'Todas'
    ? products
    : products.filter(p => getCatName(p) === selectedCategory)

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParams({ q: searchInput.trim(), page: '' })
  }

  const clearSearch = () => {
    setSearchInput('')
    updateParams({ q: '', page: '' })
  }

  return (
    <div className="min-h-screen">
      <header className="relative border-b-2 border-green-neon/20">
        <div className="cartoon-divider absolute top-0 left-0 right-0" />
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-xl group-hover:animate-wiggle">🟢</span>
            <h1 className="title-cartoon text-lg md:text-xl text-white">
              Green<span className="text-green-neon">Hub</span>
            </h1>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden py-4 md:py-6">
        <div className="absolute inset-0 bg-gradient-to-b from-green-neon/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="title-cartoon text-lg md:text-2xl text-white mb-1 animate-slide-up">
            Assinaturas Premium
          </h2>
          <p className="text-xs text-gray-400 mb-3 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Streaming com preços imperdíveis. Pagamento via <span className="text-green-neon font-bold">PIX</span> e entrega <span className="text-green-neon font-bold">imediata</span>!
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="badge-cartoon flex items-center gap-0.5">
              <HiShieldCheck className="text-[10px]" /> Pagamento Seguro
            </span>
            <span className="badge-cartoon flex items-center gap-0.5">
              <HiLightningBolt className="text-[10px]" /> Entrega Imediata
            </span>
            <span className="badge-cartoon flex items-center gap-0.5">
              <HiEmojiHappy className="text-[10px]" /> Suporte
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full px-4 py-3 pl-12 pr-10 rounded-xl bg-dark-100 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-neon transition-colors"
          />
          {q && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          )}
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            showFilters || sort || minPrice || maxPrice
              ? 'bg-green-neon text-dark-950'
              : 'bg-dark-100 text-gray-400 border border-gray-700 hover:border-green-neon/30'
          }`}
        >
          <HiFilter className="text-lg" />
          Filtros
          {(sort || minPrice || maxPrice) && <span className="w-2 h-2 rounded-full bg-yellow-400" />}
        </button>
      </div>

      {showFilters && (
        <div className="max-w-6xl mx-auto px-4 pb-6">
          <div className="card-cartoon p-4 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Ordenar por</label>
                <select
                  value={sort}
                  onChange={e => updateParams({ sort: e.target.value, page: '' })}
                  className="input-cartoon text-sm"
                >
                  <option value="">Padrão</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="name-asc">A-Z</option>
                  <option value="name-desc">Z-A</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Preço mínimo</label>
                <input
                  type="number"
                  placeholder="R$ 0"
                  value={minPrice}
                  onChange={e => updateParams({ minPrice: e.target.value, page: '' })}
                  className="input-cartoon text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Preço máximo</label>
                <input
                  type="number"
                  placeholder="R$ 999"
                  value={maxPrice}
                  onChange={e => updateParams({ maxPrice: e.target.value, page: '' })}
                  className="input-cartoon text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            {(sort || minPrice || maxPrice) && (
              <button
                onClick={() => updateParams({ sort: '', minPrice: '', maxPrice: '', page: '' })}
                className="mt-3 text-sm text-green-neon hover:underline flex items-center gap-1"
              >
                <HiX /> Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="max-w-6xl mx-auto px-4 pb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => updateParams({ category: cat === 'Todas' ? '' : cat, page: '' })}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green-neon text-dark-950'
                  : 'bg-dark-50 text-gray-400 border-2 border-dark-100 hover:border-green-neon/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card-cartoon animate-pulse h-72">
                <div className="bg-dark-100 rounded-xl h-48 mb-4" />
                <div className="bg-dark-100 rounded-lg h-4 w-2/3 mb-2" />
                <div className="bg-dark-100 rounded-lg h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{total} produto(s) encontrado(s)</p>
            </div>

            {selectedCategory === 'Todas' ? (
              <div className="space-y-8">
                {allCategories.filter(c => c !== 'Todas').map(cat => {
                  const catProducts = filtered.filter(p => getCatName(p) === cat)
                  if (!catProducts.length) return null
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-cartoon text-lg text-white">{cat}</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-green-neon/30 to-transparent" />
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {catProducts.map((product, i) => (
                          <div key={product.id} className="min-w-[220px] max-w-[220px] snap-start flex-shrink-0 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                            <ProductCard product={product} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-20">
                    <span className="text-6xl">📭</span>
                    <p className="text-gray-400 mt-4 text-lg">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-20">
                    <span className="text-6xl">📭</span>
                    <p className="text-gray-400 mt-4 text-lg">Nenhum produto encontrado</p>
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button onClick={() => updateParams({ page: String(page - 1) })} disabled={page <= 1}
                      className="p-2 rounded-xl bg-dark-50 border border-dark-100 text-gray-400 hover:text-white hover:border-green-neon/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    ><HiChevronLeft className="text-lg" /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => updateParams({ page: String(p) })}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === p ? 'bg-green-neon text-dark-950' : 'bg-dark-50 text-gray-400 border border-dark-100 hover:border-green-neon/30 hover:text-white'}`}
                      >{p}</button>
                    ))}
                    <button onClick={() => updateParams({ page: String(page + 1) })} disabled={page >= totalPages}
                      className="p-2 rounded-xl bg-dark-50 border border-dark-100 text-gray-400 hover:text-white hover:border-green-neon/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    ><HiChevronRight className="text-lg" /></button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      <section className="py-8 border-t-2 border-green-neon/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="title-cartoon text-xl text-white mb-5">
            Como <span className="text-green-neon">Funciona</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🛒', title: 'Escolha', desc: 'Selecione o produto e clique em comprar' },
              { icon: '💚', title: 'Pague', desc: 'Pagamento via PIX, rápido e seguro' },
              { icon: '⚡', title: 'Receba', desc: 'Receba o código imediatamente' },
            ].map((step, i) => (
              <div key={i} className="card-cartoon text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="text-3xl block mb-2">{step.icon}</span>
                <h4 className="font-cartoon text-sm text-green-neon mb-1">{step.title}</h4>
                <p className="text-gray-400 text-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-6 border-t-2 border-green-neon/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🟢</span>
                <h3 className="font-cartoon text-base text-white">Green<span className="text-green-neon">Hub</span></h3>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                Sua loja de assinaturas de streaming com os melhores preços.
              </p>
            </div>
            <div>
              <h4 className="font-cartoon text-white text-xs mb-2 uppercase tracking-wider">Institucional</h4>
              <div className="space-y-1">
                <Link href="/termos" className="block text-xs text-gray-500 hover:text-green-neon transition-colors">Termos de Uso</Link>
                <Link href="/privacidade" className="block text-xs text-gray-500 hover:text-green-neon transition-colors">Política de Privacidade</Link>
              </div>
            </div>
            <div>
              <h4 className="font-cartoon text-white text-xs mb-2 uppercase tracking-wider">Suporte</h4>
              <div className="space-y-1">
                <Link href="/minha-conta/tickets" className="block text-xs text-gray-500 hover:text-green-neon transition-colors">Abrir Ticket</Link>
                <Link href="/minha-conta" className="block text-xs text-gray-500 hover:text-green-neon transition-colors">Minha Conta</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-green-neon/10 pt-4 text-center">
            <p className="text-gray-500 text-xs">
              © 2024 <span className="text-green-neon font-cartoon">GreenHub</span>. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}