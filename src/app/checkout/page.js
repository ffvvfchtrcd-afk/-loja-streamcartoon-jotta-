'use client'

import { useState, useEffect, Suspense } from 'react'
import useSWR from 'swr'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiUser, HiMail, HiPhone, HiShoppingCart, HiTag, HiCheck, HiX } from 'react-icons/hi'
import { useCart } from '@/context/CartContext'
import PixQRCode from '@/components/PixQRCode'
import Toast, { useToast } from '@/components/Toast'

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cart, loaded, clearCart } = useCart()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [creating, setCreating] = useState(false)
  const { toast, showToast, closeToast } = useToast()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerWhats: '',
  })

  const { data: result } = useSWR('/api/products?limit=200')
  const products = result?.products || []
  const directProductId = searchParams.get('productId')

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) {
      router.push(`/login?redirect=/checkout`)
      return
    }
    setCheckingAuth(false)
  }, [router])

  // Redirecionar se carrinho vazio (exceto se veio de compra direta)
  useEffect(() => {
    if (loaded && cart.length === 0 && !directProductId) {
      showToast('Seu carrinho está vazio', 'warning')
      router.push('/carrinho')
    }
  }, [loaded, cart.length, directProductId, router, showToast])

  const getProduct = (productId) => products.find(p => p.id === productId)

  // Determinar itens do pedido
  const items = (() => {
    if (directProductId) {
      const product = getProduct(Number(directProductId))
      if (product) return [{ productId: product.id, quantity: 1, product }]
      return []
    }
    return cart.map(item => ({
      ...item,
      product: getProduct(item.productId),
    })).filter(item => item.product)
  })()

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const desconto = appliedCoupon ? (appliedCoupon.discount || 0) : 0
  const total = Math.max(0, subtotal - desconto)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      showToast('Preencha nome e email para continuar', 'warning')
      return
    }

    if (items.length === 0) {
      showToast('Nenhum produto para comprar', 'error')
      return
    }

    // Verificar estoque
    const outOfStock = items.some(item => {
      const isV2 = item.product.deliveryType === 'auto_v2'
      const stock = item.product.stock ?? 0
      return !isV2 && stock === 0
    })
    if (outOfStock) {
      showToast('Um ou mais produtos estão fora de estoque', 'error')
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem('user_token')
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: appliedCoupon?.code || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setOrderData(data)
        setOrderCreated(true)
        // Limpar carrinho se a compra veio do carrinho
        if (!directProductId) {
          clearCart()
        }
        showToast('Pedido criado! Agora é só pagar via PIX', 'success')
      } else {
        showToast(data.error || 'Erro ao criar pedido', 'error')
      }
    } catch {
      showToast('Erro ao conectar com o servidor', 'error')
    }
    setCreating(false)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
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
        showToast(data.error, 'error')
      }
    } catch {
      showToast('Erro ao validar cupom', 'error')
    }
    setValidatingCoupon(false)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (orderCreated && orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <PixQRCode
            pixCode={orderData.pixCode}
            qrCode={orderData.pixQrCode}
            expiration={orderData.expiration}
            orderId={orderData.id}
          />
          {orderData.items && orderData.items.length > 0 && (
            <div className="card-cartoon mt-4 p-4">
              <h4 className="text-sm text-gray-400 mb-2">Itens do pedido:</h4>
              <div className="space-y-1">
                {orderData.items.map((item, i) => (
                  <p key={i} className="text-sm text-white">
                    {item.quantity}x {item.productName} — R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                ))}
              </div>
              <div className="cartoon-divider my-2" />
              <p className="text-green-neon font-bold">Total: R$ {orderData.total.toFixed(2)}</p>
            </div>
          )}
          <div className="text-center mt-6">
            <Link href="/" className="btn-cartoon-outline text-sm">
              ← Voltar para Loja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">😕</span>
          <p className="text-gray-400 mt-4 text-lg">Nenhum produto selecionado</p>
          <Link href="/carrinho" className="btn-cartoon mt-6 inline-flex">Ir para o Carrinho</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/carrinho" className="text-gray-400 hover:text-green-neon transition-colors">
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

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form Section */}
          <div className="md:col-span-3">
            <h2 className="title-cartoon text-2xl text-white mb-6">
              Finalizar Pedido
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <HiUser className="inline mr-1" /> Nome completo *
                </label>
                <input
                  type="text"
                  className="input-cartoon"
                  placeholder="Seu nome"
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <HiMail className="inline mr-1" /> Email *
                </label>
                <input
                  type="email"
                  className="input-cartoon"
                  placeholder="seu@email.com"
                  value={form.customerEmail}
                  onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <HiPhone className="inline mr-1" /> WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  className="input-cartoon"
                  placeholder="(11) 99999-9999"
                  value={form.customerWhats}
                  onChange={e => setForm({ ...form, customerWhats: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="btn-cartoon w-full !py-4 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <><div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" /> Processando...</>
                ) : (
                  <><HiShoppingCart className="text-xl" /> Pagar via PIX — R$ {total.toFixed(2)}</>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2 space-y-4">
            <div className="card-cartoon">
              <h3 className="font-cartoon text-lg text-white mb-4">Itens do Pedido</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-dark-100 to-dark-950 flex items-center justify-center text-lg flex-shrink-0">
                      {item.product.category?.split(' ')[0] || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-green-neon font-semibold flex-shrink-0">
                      R$ {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="cartoon-divider my-4" />

              {/* Coupon */}
              {!appliedCoupon ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                    <HiTag className="text-green-neon" /> Cupom de desconto
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-cartoon flex-1 text-sm !py-2"
                      placeholder="Digite o código"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button
                      type="button"
                      disabled={validatingCoupon || !couponCode.trim()}
                      onClick={handleApplyCoupon}
                      className="btn-cartoon !py-2 !px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validatingCoupon ? (
                        <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Aplicar'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-neon/10 border border-green-neon/20 rounded-xl p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-neon font-medium text-sm flex items-center gap-1">
                      <HiCheck /> {appliedCoupon.code}
                    </span>
                    <button onClick={() => { setAppliedCoupon(null); showToast('Cupom removido', 'info') }} className="text-gray-500 hover:text-red-400 transition-colors">
                      <HiX />
                    </button>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Desconto</span>
                    <span className="text-green-neon font-semibold">- R$ {appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">R$ {subtotal.toFixed(2)}</span>
                </div>
                {desconto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Desconto</span>
                    <span className="text-green-neon">- R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="cartoon-divider my-4" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total</span>
                <span className="text-2xl font-bold text-green-neon">R$ {total.toFixed(2)}</span>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-green-neon/10 border border-green-neon/20 text-center">
                <p className="text-xs text-green-neon">💰 Pagamento via PIX — Aprovação imediata</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}