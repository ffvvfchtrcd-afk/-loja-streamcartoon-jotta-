'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { HiShoppingCart, HiTicket, HiHeart, HiOutlineHeart, HiPlusCircle, HiCheck } from 'react-icons/hi'
import { useState, useEffect, useCallback } from 'react'
import { useCart } from '@/context/CartContext'

const categoryIcons = {
  '🎬 Netflix': '/netflix.svg',
  '📺 Disney+': '/disney.svg',
  '🎥 HBO': '/hbomax.svg',
  '🎵 Spotify': '/spotify.svg',
  '📦 Amazon': '/prime.svg',
}

export default function ProductCard({ product }) {
  const router = useRouter()
  const { data: wishlistData } = useSWR('/api/wishlist', userFetcher)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const { addItem, getItemQuantity } = useCart()

  useEffect(() => {
    if (wishlistData?.wishlisted) {
      setWishlisted(wishlistData.wishlisted.some(item => item.productId === product.id))
    }
  }, [wishlistData, product.id])

  const handleWishlist = useCallback(async () => {
    const token = localStorage.getItem('user_token')
    if (!token) {
      router.push('/login')
      return
    }
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: product.id }),
    })
    if (res.ok) {
      setWishlisted(!wishlisted)
    }
  }, [router, product.id, wishlisted])

  const handleAddToCart = useCallback(() => {
    addItem(product.id, 1)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }, [addItem, product.id])

  const deliveryType = product.deliveryType || 'auto'
  const isV2 = deliveryType === 'auto_v2'
  const stock = product.stock ?? 0
  const outOfStock = !isV2 && stock === 0
  const qtyInCart = getItemQuantity(product.id)

  return (
    <div className={`card-cartoon group h-full flex flex-col ${outOfStock ? 'opacity-60 pointer-events-none' : ''}`}>
      <Link href={`/produto/${product.id}`} className="relative h-24 rounded-lg overflow-hidden mb-2 bg-dark-950 block">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center">
            <span className="text-3xl opacity-50">{product.category.split(' ')[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-50/80 to-transparent" />
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlist(); }} className="text-white hover:text-red-400 transition-colors">
            {wishlisted ? <HiHeart className="text-red-400 text-xs" /> : <HiOutlineHeart className="text-xs" />}
          </button>
          <span className="text-[8px] px-1 py-0.5 rounded bg-green-neon/20 text-green-neon border border-green-neon/30 font-bold uppercase tracking-wider">
            {product.category.split(' ').slice(1).join(' ')}
          </span>
        </div>

        {!isV2 && (
          <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
            outOfStock
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : stock <= 5
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30'
          }`}>
            {outOfStock ? 'Esgotado' : `${stock}`}
          </div>
        )}
      </Link>

      <div className="flex-1 flex flex-col">
        <Link href={`/produto/${product.id}`} className="inline-block">
          <h3 className="font-cartoon text-xs text-white mb-0.5 group-hover:text-green-neon transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-sm font-bold text-green-neon">
            R$ {product.price.toFixed(2)}
          </span>
          {outOfStock ? (
            <span className="text-[10px] text-red-400 font-medium">Indisponível</span>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleAddToCart}
                className={`!px-1.5 !py-1 transition-all duration-300 ${
                  addedFeedback
                    ? 'btn-cartoon-outline !border-green-500 !text-green-500'
                    : 'btn-cartoon'
                }`}
                title={addedFeedback ? 'Adicionado!' : 'Adicionar ao carrinho'}
              >
                {addedFeedback ? (
                  <HiCheck className="text-xs animate-bounce-in" />
                ) : (
                  <HiPlusCircle className="text-xs" />
                )}
              </button>
              <Link
                href={`/checkout?productId=${product.id}`}
                className="btn-cartoon !px-2 !py-1 gap-0.5"
              >
                {isV2 ? <HiTicket className="text-xs" /> : <HiShoppingCart className="text-xs" />}
                <span className="text-[10px]">Comprar</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}