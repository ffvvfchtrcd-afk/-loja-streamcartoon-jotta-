'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { userFetcher } from '@/lib/fetcher'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiClock, HiCheckCircle, HiXCircle, HiClipboardCopy, HiCheck, HiTicket, HiCash } from 'react-icons/hi'

const statusConfig = {
  pending: { icon: HiClock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Aguardando Pagamento', step: 1 },
  paid: { icon: HiCheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'Pago - Código Liberado', step: 3 },
  cancelled: { icon: HiXCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Cancelado', step: 0 },
}

export default function UserOrderDetail() {
  const params = useParams()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) router.push('/login')
  }, [router])

  const { data: order, error, isLoading } = useSWR(`/api/orders/${params.id}`, userFetcher)

  const handleCopy = (text, setter) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  if (error || order?.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <HiXCircle className="text-5xl text-red-400" />
        <p className="text-gray-400 text-lg">Pedido não encontrado</p>
        <Link href="/minha-conta" className="btn-cartoon">← Voltar para Minha Conta</Link>
      </div>
    )
  }

  if (!order) return null

  const st = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = st.icon
  const steps = [
    { icon: '🛒', label: 'Pedido Criado', done: true, date: order.createdAt },
    { icon: '💚', label: 'Pagamento', done: order.status === 'paid' || order.status === 'cancelled', date: order.status !== 'pending' ? order.createdAt : null },
    { icon: '📌', label: 'Código Entregue', done: order.status === 'paid', date: null },
  ]

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-green-neon/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/minha-conta" className="text-gray-400 hover:text-green-neon transition-colors">
            <HiArrowLeft className="text-2xl" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-cartoon text-xl text-white">Stream<span className="text-green-neon">Cartoon</span></h1>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={`${st.bg} border-2 rounded-2xl p-6 text-center animate-bounce-in mb-6`}>
          <StatusIcon className={`text-5xl ${st.color} mx-auto mb-3`} />
          <h2 className={`font-cartoon text-xl ${st.color} mb-1`}>{st.label}</h2>
          <p className="text-gray-400 text-sm">Pedido #{order.id}</p>
          <p className="text-green-neon font-bold text-lg mt-1">R$ {order.total.toFixed(2)}</p>
        </div>

        <div className="card-cartoon p-6 mb-6 animate-slide-up">
          <h3 className="font-cartoon text-lg text-white mb-6">📋 Andamento</h3>
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                  step.done ? 'bg-green-neon/20 border-2 border-green-neon' : 'bg-dark-100 border-2 border-dark-200'
                }`}>
                  {step.done ? '✓' : step.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</p>
                  {step.date && <p className="text-xs text-gray-500">{new Date(step.date).toLocaleString('pt-BR')}</p>}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-6 bg-dark-200 mr-[19px]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card-cartoon p-6 mb-6 animate-slide-up">
          <h3 className="font-cartoon text-lg text-white mb-4">📦 Informações do Pedido</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Produto</p>
              <p className="text-white font-medium">{order.product?.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total</p>
              <p className="text-green-neon font-bold text-lg">R$ {order.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Pagamento</p>
              <p className="text-white uppercase">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium ${st.bg} ${st.color}`}>
                <StatusIcon className="text-sm" /> {st.label}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-white">{order.customerName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</p>
              <p className="text-white text-sm break-all">{order.customerEmail}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Data da Compra</p>
              <p className="text-white">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {order.deliveredCode && (
          <div className="card-cartoon p-6 mb-6 animate-slide-up border-green-neon/40">
            <h3 className="font-cartoon text-lg text-white mb-4">🎉 Código de Acesso</h3>
            <div className="p-5 rounded-2xl bg-green-neon/10 border-2 border-green-neon/30 text-center">
              <p className="text-3xl font-bold text-green-neon tracking-widest select-all font-mono mb-4">
                {order.deliveredCode}
              </p>
              <button
                onClick={() => handleCopy(order.deliveredCode, setCopied)}
                className="btn-cartoon gap-2"
              >
                {copied ? <><HiCheck className="text-lg" /> Copiado!</> : <><HiClipboardCopy className="text-lg" /> Copiar Código</>}
              </button>
            </div>
          </div>
        )}

        {order.status === 'pending' && order.pixCode && (
          <div className="card-cartoon p-6 mb-6 animate-slide-up">
            <h3 className="font-cartoon text-lg text-white mb-4">💚 Pagamento PIX</h3>
            <div className="p-4 rounded-xl bg-dark-900/50 border border-dark-100 mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Código PIX (Copie e pague)</p>
              <p className="text-sm text-gray-300 font-mono break-all select-all">{order.pixCode}</p>
            </div>
            <button
              onClick={() => handleCopy(order.pixCode, setCopiedPix)}
              className="btn-cartoon gap-2 w-full"
            >
              {copiedPix ? <><HiCheck className="text-lg" /> Copiado!</> : <><HiClipboardCopy className="text-lg" /> Copiar Código PIX</>}
            </button>
          </div>
        )}

        {order.ticket && (
          <Link
            href={`/minha-conta/tickets/${order.ticket.id}`}
            className="card-cartoon p-5 flex items-center gap-4 mb-6 hover:border-green-neon/40 transition-all animate-slide-up group"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center text-3xl group-hover:animate-wiggle">
              <HiTicket />
            </div>
            <div className="flex-1">
              <h3 className="font-cartoon text-lg text-white group-hover:text-green-neon transition-colors">Ticket de Suporte</h3>
              <p className="text-sm text-gray-400">{order.ticket.subject}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
              order.ticket.status === 'open' ? 'status-paid text-green-400' :
              order.ticket.status === 'waiting' ? 'status-pending text-yellow-400' : 'text-gray-400 bg-gray-500/10'
            }`}>{order.ticket.status}</span>
            <span className="text-green-neon text-2xl">→</span>
          </Link>
        )}

        <div className="text-center mt-6">
          <Link href="/minha-conta" className="btn-cartoon">← Voltar para Minha Conta</Link>
        </div>
      </div>
    </div>
  )
}
