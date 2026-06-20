'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiHeart, HiOutlineHeart, HiShoppingCart, HiArrowLeft, HiClock, HiShieldCheck, HiLightningBolt, HiStar, HiTag, HiCheck, HiInformationCircle } from 'react-icons/hi'
import ProductCard from '@/components/ProductCard'

function StarRating({ rating, size = 'md', interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0)
  const value = interactive ? (hovered || rating) : rating
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(value)
    stars.push(
      <button
        key={i}
        type={interactive ? 'button' : undefined}
        disabled={!interactive}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform ${
          filled ? 'text-yellow-400' : 'text-gray-600'
        } ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}
        onClick={() => interactive && onChange?.(i)}
        onMouseEnter={() => interactive && setHovered(i)}
        onMouseLeave={() => interactive && setHovered(0)}
      >
        {filled ? '★' : '☆'}
      </button>
    )
  }
  return <div className="flex gap-0.5">{stars}</div>
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id

  const { data: product, error, isLoading } = useSWR(
    id ? `/api/products/${id}` : null,
    fetcher
  )

  const { data: allProducts } = useSWR('/api/products?limit=100', fetcher)

  const [userToken] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_token')
    return null
  })

  const { data: wishlist } = useSWR(
    userToken ? '/api/wishlist' : null,
    fetcher
  )

  const isWishlisted = wishlist?.items?.some(item => item.productId === Number(id)) || false
  const [togglingWishlist, setTogglingWishlist] = useState(false)

  const toggleWishlist = async () => {
    if (!userToken) {
      router.push(`/login?redirect=/produto/${id}`)
      return
    }
    setTogglingWishlist(true)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ productId: Number(id) }),
      })
      if (res.ok) mutate('/api/wishlist')
    } catch {}
    setTogglingWishlist(false)
  }

  const reviewsContainerRef = useRef(null)
  const [scrollIndex, setScrollIndex] = useState(0)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  const handleDragStart = (e) => {
    const el = reviewsContainerRef.current
    if (!el) return
    dragState.current.isDragging = true
    dragState.current.startX = e.pageX - el.offsetLeft
    dragState.current.scrollLeft = el.scrollLeft
  }

  const handleDragMove = (e) => {
    if (!dragState.current.isDragging) return
    e.preventDefault()
    const el = reviewsContainerRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - dragState.current.startX) * 1.5
    el.scrollLeft = dragState.current.scrollLeft - walk
  }

  const handleDragEnd = () => {
    dragState.current.isDragging = false
  }

  const handleTouchStart = (e) => {
    const el = reviewsContainerRef.current
    if (!el) return
    dragState.current.isDragging = true
    dragState.current.startX = e.touches[0].pageX - el.offsetLeft
    dragState.current.scrollLeft = el.scrollLeft
  }

  const handleTouchMove = (e) => {
    if (!dragState.current.isDragging) return
    const el = reviewsContainerRef.current
    if (!el) return
    const x = e.touches[0].pageX - el.offsetLeft
    const walk = (x - dragState.current.startX) * 1.5
    el.scrollLeft = dragState.current.scrollLeft - walk
  }

  useEffect(() => {
    const el = reviewsContainerRef.current
    if (!el || !product?.reviews?.length) return
    const onScroll = () => {
      const cardWidth = (el.children[0]?.offsetWidth || 300) + 16
      const idx = Math.round(el.scrollLeft / cardWidth)
      setScrollIndex(Math.min(idx, el.children.length - 1))
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [product?.reviews?.length])

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const submitReview = async (e) => {
    e.preventDefault()
    if (!userToken) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ productId: Number(id), rating: reviewRating, comment: reviewComment }),
      })
      if (res.ok) {
        mutate(`/api/products/${id}`)
        setReviewComment('')
        setReviewRating(5)
      } else {
        const errData = await res.json().catch(() => ({}))
        if (errData.error) alert(errData.error)
      }
    } catch {}
    setSubmittingReview(false)
  }

  // Produtos relacionados (mesma categoria, excluindo o atual)
  const relatedProducts = allProducts?.products
    ?.filter(p => p.category === product?.category && p.id !== Number(id))
    ?.slice(0, 3) || []

  const [selectedImage, setSelectedImage] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando produto...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-6xl">😕</span>
          <p className="text-gray-400 mt-4 text-lg">{error ? 'Erro ao carregar produto' : 'Produto não encontrado'}</p>
          <Link href="/" className="btn-cartoon mt-6 inline-flex">← Voltar para Loja</Link>
        </div>
      </div>
    )
  }

  const deliveryType = product.deliveryType || 'auto'
  const isV2 = deliveryType === 'auto_v2'
  const outOfStock = !isV2 && product.stock === 0
  const productImages = product.images?.length > 0
    ? product.images
    : [{ url: null }]

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-cartoon text-xl text-white">
              Stream<span className="text-green-neon">Cartoon</span>
            </h1>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-green-neon transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/?category=${encodeURIComponent(product.category)}`} className="hover:text-green-neon transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-400">{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Gallery */}
          <div>
            <div className="card-cartoon p-0 overflow-hidden mb-4">
              {productImages[selectedImage]?.url ? (
                <img
                  src={productImages[selectedImage].url}
                  alt={product.name}
                  className="w-full aspect-video object-cover transition-all duration-500"
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center text-8xl transition-all duration-500">
                  {product.category.split(' ')[0] || '📦'}
                </div>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-video rounded-xl overflow-hidden transition-all duration-200 ${
                      selectedImage === i
                        ? 'ring-2 ring-green-neon ring-offset-2 ring-offset-dark-900 scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {img.url ? (
                      <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center text-2xl">
                        {product.category.split(' ')[0] || '📦'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="title-cartoon text-3xl md:text-4xl text-white mb-2">{product.name}</h1>
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">{product.category}</p>
              </div>
              <button
                onClick={toggleWishlist}
                disabled={togglingWishlist}
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                  isWishlisted
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30'
                    : 'bg-dark-50 text-gray-500 border-2 border-dark-100 hover:border-red-500/30 hover:text-red-400'
                }`}
              >
                {isWishlisted ? <HiHeart /> : <HiOutlineHeart />}
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <StarRating rating={product.avgRating || 0} />
                <span className="text-yellow-400 font-medium text-sm ml-1">
                  {product.avgRating ? product.avgRating.toFixed(1) : '0.0'}
                </span>
              </div>
              <span className="text-sm text-gray-500">({product.reviewCount || 0} avaliações)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="text-4xl font-bold text-green-neon mb-2">
                R$ {Number(product.price).toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">À vista no PIX</p>
            </div>

            {/* Stock / Availability */}
            <div className="flex flex-wrap gap-3 mb-6">
              {outOfStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Fora de estoque
                </div>
              ) : isV2 ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 text-sm font-medium">
                  <HiTag className="text-base" />
                  Entrega via Ticket
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  {product.stock} em estoque
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-sm font-medium">
                <HiLightningBolt className="text-base" />
                Entrega imediata
              </div>
            </div>

            {/* Description */}
            <div className="card-cartoon p-5 mb-8">
              <h3 className="font-cartoon text-white text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                <HiInformationCircle className="text-green-neon" /> Descrição
              </h3>
              <p className="text-gray-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-neon/5 border border-green-neon/20">
                <HiShieldCheck className="text-green-neon text-xl flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Pagamento Seguro</p>
                  <p className="text-gray-500 text-xs">Via PIX</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-neon/5 border border-green-neon/20">
                <HiLightningBolt className="text-green-neon text-xl flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Entrega Imediata</p>
                  <p className="text-gray-500 text-xs">Após confirmação</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-neon/5 border border-green-neon/20">
                <HiClock className="text-green-neon text-xl flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Suporte</p>
                  <p className="text-gray-500 text-xs">Via WhatsApp</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/checkout?productId=${id}`}
              className={`btn-cartoon gap-2 inline-flex w-full sm:w-auto justify-center text-lg !py-4 ${outOfStock ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <HiShoppingCart className="text-xl" /> {outOfStock ? 'Indisponível' : 'Comprar Agora'}
            </Link>
          </div>
        </div>

        {/* Product Details Table */}
        <div className="card-cartoon p-6 mb-12">
          <h2 className="title-cartoon text-2xl text-white mb-6">📋 Detalhes do Produto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
              <span className="text-gray-400">Categoria</span>
              <span className="text-white font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
              <span className="text-gray-400">Tipo de Entrega</span>
              <span className="text-white font-medium">{isV2 ? 'Via Ticket' : 'Automática'}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
              <span className="text-gray-400">Disponibilidade</span>
              <span className={`font-medium ${outOfStock ? 'text-red-400' : 'text-green-400'}`}>
                {outOfStock ? 'Indisponível' : 'Em estoque'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
              <span className="text-gray-400">Avaliação Média</span>
              <span className="text-yellow-400 font-medium">
                {product.avgRating ? `${product.avgRating.toFixed(1)} / 5.0` : 'Sem avaliações'}
              </span>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <h2 className="title-cartoon text-2xl text-white mb-6">📝 Avaliações ({product.reviewCount || 0})</h2>

          {product.reviews && product.reviews.length > 0 ? (
            <div className="relative">
              <div
                ref={reviewsContainerRef}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleDragEnd}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {product.reviews.map((review, i) => (
                  <div key={i} className="card-cartoon min-w-[280px] max-w-[320px] snap-start flex-shrink-0 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-neon/20 border-2 border-green-neon/30 flex items-center justify-center text-green-neon font-bold flex-shrink-0">
                          {review.user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{review.user?.username || 'Anônimo'}</p>
                          <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
              {product.reviews.length > 2 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {product.reviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => reviewsContainerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })}
                      className={`w-2 h-2 rounded-full transition-all ${
                        scrollIndex === i ? 'bg-green-neon w-4' : 'bg-dark-100 hover:bg-dark-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 card-cartoon">
              <span className="text-4xl">💬</span>
              <p className="text-gray-500 mt-4">Nenhuma avaliação ainda. Seja o primeiro!</p>
            </div>
          )}
        </div>

        {/* Review Form */}
        {userToken && (
          <div className="card-cartoon p-6 mb-12">
            <h3 className="font-cartoon text-lg text-white mb-4">✏️ Escreva uma Avaliação</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sua nota</label>
                <StarRating rating={reviewRating} size="lg" interactive onChange={setReviewRating} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Comentário (opcional)</label>
                <textarea
                  className="input-cartoon min-h-[120px] resize-y"
                  placeholder="Conte sua experiência com este produto..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="btn-cartoon disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </form>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="title-cartoon text-2xl text-white">🎯 Produtos Relacionados</h2>
              <Link
                href={`/?category=${encodeURIComponent(product.category)}`}
                className="text-sm text-green-neon hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((related, i) => (
                <div
                  key={related.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <ProductCard product={related} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="title-cartoon text-2xl text-white">🤖 Quem viu tamb\u00e9m viu</h2>
          </div>
          <div id="ai-recommendations" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[100px]">
            <div className="col-span-full text-center text-gray-500 text-sm py-8" id="ai-recommendations-loading">
              Carregando recomenda\u00e7\u00f5es...
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            fetch('/api/ai/recommend?productId=${id}')
              .then(r => r.json())
              .then(data => {
                const el = document.getElementById('ai-recommendations')
                const loading = document.getElementById('ai-recommendations-loading')
                if (!data.results || !data.results.length) {
                  if (loading) loading.textContent = 'Nenhuma recomenda\u00e7\u00e3o dispon\u00edvel'
                  return
                }
                if (el) el.innerHTML = data.results.map(p => {
                  const img = p.images?.[0]?.url || ''
                  const category = (p.category || '').split(' ').slice(1).join(' ')
                  return \`
                    <a href="/produto/\${p.id}" class="card-cartoon group animate-slide-up block">
                      <div class="relative h-24 rounded-lg overflow-hidden mb-2 bg-dark-950">
                        \${img ? '<img src="' + img + '" alt="' + p.name + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />'
                          : '<div class="w-full h-full bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center"><span class="text-3xl opacity-50">' + (p.category?.split(' ')[0] || '') + '</span></div>'}
                        <div class="absolute inset-0 bg-gradient-to-t from-dark-50/80 to-transparent" />
                        <span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border bg-green-500/20 text-green-400 border-green-500/30">
                          \${p.stock || 0}
                        </span>
                      </div>
                      <h3 class="font-cartoon text-xs text-white mb-0.5 group-hover:text-green-neon transition-colors leading-tight truncate">\${p.name}</h3>
                      <div class="text-xs text-gray-500 truncate">\${category || p.category}</div>
                      <div class="text-green-neon font-bold text-sm mt-1">R$ \${Number(p.price).toFixed(2)}</div>
                    </a>
                  \`
                }).join('')
              })
              .catch(() => {
                const loading = document.getElementById('ai-recommendations-loading')
                if (loading) loading.textContent = 'Recomenda\u00e7\u00f5es indispon\u00edveis no momento'
              })
          `
        }} />
      </div>
    </div>
  )
}