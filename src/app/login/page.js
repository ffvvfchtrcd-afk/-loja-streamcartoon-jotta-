'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Toast, { useToast } from '@/components/Toast'
import { Suspense } from 'react'

function LoginContent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/minha-conta'
  const { toast, showToast, closeToast } = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_username', data.user.username)
        window.dispatchEvent(new Event('user-change'))
        if (data.isAdmin) {
          router.push('/painel-seguro/dashboard')
        } else {
          router.push(redirectTo)
        }
      } else {
        showToast(data.error || 'Erro ao fazer login', 'error')
      }
    } catch {
      showToast('Erro ao conectar ao servidor', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🎬</span>
            <h1 className="title-cartoon text-3xl text-white">
              Stream<span className="text-green-neon">Cartoon</span>
            </h1>
          </Link>
          <p className="text-gray-400 text-sm">Faça login na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="card-cartoon p-8 space-y-5 animate-bounce-in">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <input
              type="text"
              className="input-cartoon"
              placeholder="seu username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Senha</label>
            <input
              type="password"
              className="input-cartoon"
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-cartoon w-full !py-3.5 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center space-y-2 pt-2">
            <p className="text-gray-500 text-sm">
              Não tem conta?{' '}
              <Link href={`/register${redirectTo !== '/minha-conta' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-green-neon hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
            <Link href="/" className="block text-sm text-gray-500 hover:text-green-neon transition-colors">
              ← Voltar para loja
            </Link>
          </div>
        </form>
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
