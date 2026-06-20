'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  HiTrash, HiShoppingCart, HiArrowLeft, HiPlus, HiMinus, 
  HiTag, HiX, HiCheck, HiShieldCheck, HiCreditCard, HiClock,
  HiExternalLink, HiLightningBolt
} from 'react-icons/hi'
import useSWR from 'swr'
import { useCart } from '@/context/CartContext'
import Toast, { useToast } from '@/components/Toast'

function CartContent() {
  const router = useRouter()
  const { cart, loaded, updateQuantity, removeItem, clearCart, totalItems } = useCart()
  const { toast, showToast, closeToast } = useToast()
  const { data: result } = useSWR('/api/products?limit=200')
  const products = result?.products || []
  
  // Cupom state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')

  const getProduct = useCallback((productId) => {
    return products.find(p => p.id === productId)
  }, [products])

  const subtotal = cart.reduce((sum, item) => {
    const product = getProduct(item.productId)
    return sum + (product?.price || 0) * (item.quantity || 1)
  }, 0)

  const desconto = appliedCoupon ? (subtotal >= appliedCoupon.minValue ? appliedCoupon.discount : 0) : 0
  const total = Math.max(0, subtotal - desconto)

  const handleCheckout = () => {
    const token = localStorage.getItem('user_token')
    if (!token) {
      router.push(`/login?redirect=/carrinho`)
      return
    }
    if (cart.length === 0) {
      showToast('Seu carrinho está vazio', 'warning')
      return
    }
    router.push('/checkout')
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
    setCouponError('')
    try {
      const token = localStorage.getItem('user_token')
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, total: subtotal }),
      })
      const data = await res.json()
      if (res.ok) {
        setAppliedCoupon(data)
        showToast(`Cupom ${data.code} aplicado!`, 'success')
        setCouponCode('')
      } else {
        setCouponError(data.error || 'Cupom inválido')
        showToast(data.error || 'Cupom inválido', 'error')
      }
    } catch {
      setCouponError('Erro ao validar cupom')
      showToast('Erro ao validar cupom', 'error')
    }
    setValidatingCoupon(false)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    showToast('Cupom removido', 'info')
  }

  const getDeliveryEstimate = (product) => {
    if (product?.deliveryType === 'auto' || product?.deliveryType === 'auto_v2') {
      return {
        text: 'Imediata',
        icon: <HiLightningBolt className="text-green-neon" />,
        color: 'text-green-neon'
      }
    }
    return {
      text: 'Até 24h',
      icon: <HiClock className="text-yellow-400" />,
      color: 'text-yellow-400'
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:animate-wiggle">🎬</span>
            <h1 className="font-cartoon text-xl text-white">
              Stream<span className="text-green-neon">Cartoon</span>
            </h1>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <HiShoppingCart className="text-3xl text-green-neon" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-neon text-dark-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <h2 className="title-cartoon text-3xl text-white">Carrinho</h2>
              <p className="text-sm text-gray-500">{totalItems} item(ns) adicionado(s)</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={() => { clearCart(); showToast('Carrinho limpo!', 'info') }} 
              className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg border border-red-500/20"
            >
              <HiTrash /> Limpar carrinho
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-8xl block mb-6 animate-float">🛒</span>
            <p className="text-gray-400 text-xl mb-3">Seu carrinho está vazio</p>
            <p className="text-gray-500 text-sm mb-8">Adicione produtos incríveis para começar!</p>
            <Link href="/" className="btn-cartoon inline-flex gap-2 text-lg">
              <HiArrowLeft /> Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const product = getProduct(item.productId)
                if (!product) return null
                const delivery = getDeliveryEstimate(product)
                return (
                  <div key={item.productId} className="card-cartoon p-5 flex items-start gap-4 animate-slide-up group">
                    {/* Product Icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center text-3xl flex-shrink-0">
                      {item.product.categoryRel?.icon || item.product.category?.split(' ')[0] || '📦'}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/produto/${product.id}`} className="text-white font-medium hover:text-green-neon transition-colors line-clamp-1 text-lg">
                        {product.name}
                      </Link>
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{product.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-green-neon font-bold text-lg">R$ {product.price.toFixed(2)}</span>
                        <span className="flex items-center gap-1 text-xs" title={delivery.text}>
                          {delivery.icon}
                          <span className={delivery.color}>{delivery.text}</span>
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-lg bg-dark-100 border border-dark-100 text-gray-400 hover:text-white hover:border-green-neon/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <HiMinus />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          max="99"
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (val >= 1 && val <= 99) {
                              const delta = val - item.quantity
                              updateQuantity(item.productId, delta)
                            }
                          }}
                          className="w-12 text-center bg-dark-100 border border-dark-100 rounded-lg text-white font-medium text-sm py-1.5 focus:outline-none focus:border-green-neon/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="w-8 h-8 rounded-lg bg-dark-100 border border-dark-100 text-gray-400 hover:text-white hover:border-green-neon/30 transition-all flex items-center justify-center"
                        >
                          <HiPlus />
                        </button>
                      </div>

                      {/* Item Total */}
                      <p className="text-green-neon font-bold">R$ {(product.price * (item.quantity || 1)).toFixed(2)}</p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => { removeItem(item.productId); showToast(`${product.name} removido`, 'info') }}
                      className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <HiX className="text-lg" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="card-cartoon p-6 sticky top-20 space-y-5">
                <h3 className="font-cartoon text-lg text-white">Resumo do Pedido</h3>
                
                {/* Items Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Itens ({totalItems})</span>
                    <span className="text-white">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Cupom */}
                  {!appliedCoupon ? (
                    <div>
                      <div className="cartoon-divider my-3" />
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                        <HiTag className="text-green-neon" /> Cupom de desconto
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input-cartoon flex-1 text-sm !py-2"
                          placeholder="Digite o código"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <button
                          type="button"
                          disabled={validatingCoupon || !couponCode.trim()}
                          onClick={handleApplyCoupon}
                          className="btn-cartoon !py-2 !px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {validatingCoupon ? (
                            <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Aplicar'
                          )}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <HiX /> {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-neon/10 border border-green-neon/20 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-green-neon font-medium text-sm flex items-center gap-1">
                          <HiCheck /> {appliedCoupon.code}
                        </span>
                        <button onClick={handleRemoveCoupon} className="text-gray-500 hover:text-red-400 transition-colors">
                          <HiX />
                        </button>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Desconto</span>
                        <span className="text-green-neon font-semibold">
                          {subtotal >= (appliedCoupon.minValue || 0) 
                            ? `- R$ ${appliedCoupon.discount.toFixed(2)}`
                            : `Mínimo: R$ ${appliedCoupon.minValue?.toFixed(2)}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Total */}
                <div className="cartoon-divider my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-neon">R$ {total.toFixed(2)}</span>
                    {desconto > 0 && (
                      <p className="text-xs text-green-neon">Economia de R$ {desconto.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* Checkout Button */}
                <button onClick={handleCheckout} className="btn-cartoon w-full gap-2 text-lg !py-4">
                  <HiCreditCard className="text-xl" />
                  Ir para Pagamento →
                </button>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <HiShieldCheck className="text-green-neon" /> Pagamento Seguro
                  </span>
                  <span className="flex items-center gap-1">
                    <HiLightningBolt className="text-green-neon" /> Entrega Rápida
                  </span>
                </div>

                <Link href="/" className="block text-center text-sm text-gray-500 hover:text-green-neon transition-colors">
                  ← Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    }>
      <CartContent />
    </Suspense>
  )
}