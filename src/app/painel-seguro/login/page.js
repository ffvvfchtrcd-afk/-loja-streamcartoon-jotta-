'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast, { useToast } from '@/components/Toast'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast, showToast, closeToast } = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        router.push('/admin/dashboard')
      } else {
        showToast(data.error || 'Erro ao fazer login', 'error')
      }
    } catch {
      showToast('Erro ao conectar', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🎬</span>
            <h1 className="title-cartoon text-3xl text-white">
              Stream<span className="text-green-neon">Cartoon</span>
            </h1>
          </Link>
          <p className="text-gray-400 text-sm">Área administrativa</p>
        </div>

        <form onSubmit={handleLogin} className="card-cartoon p-8 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Usuário</label>
            <input
              type="text"
              className="input-cartoon"
              placeholder="admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
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
          <div className="text-center pt-2">
            <Link href="/" className="text-sm text-gray-500 hover:text-green-neon transition-colors">
              ← Voltar para loja
            </Link>
          </div>
        </form>
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
