'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Toast, { useToast } from '@/components/Toast'
import { HiChartBar, HiPlay, HiCog, HiLogout, HiChevronRight } from 'react-icons/hi'

const PASSWORD = 'jotta1@@'
const STORAGE_KEY = 'banca_auth'

const links = [
  { href: '/v2/dashboard', label: 'Visão Geral', icon: HiChartBar },
  { href: '/v2/operacoes', label: 'Operações', icon: HiPlay },
  { href: '/v2/config', label: 'Configurações', icon: HiCog },
]

export default function V2Layout({ children }) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast, showToast, closeToast } = useToast()

  useEffect(() => {
    const auth = localStorage.getItem(STORAGE_KEY)
    if (auth === 'true') {
      setAuthed(true)
    } else if (pathname !== '/v2/login') {
      setShowLogin(true)
    }
    setLoading(false)
  }, [pathname])

  const handleLogin = () => {
    if (pwd === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setAuthed(true)
      setShowLogin(false)
      setPwdError(false)
      if (pathname === '/v2/login' || pathname === '/v2') {
        router.push('/v2/dashboard')
      }
    } else {
      setPwdError(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
    setShowLogin(true)
    router.push('/v2/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed || showLogin) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="card-cartoon p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-cartoon text-xl text-white mb-1">Gerenciamento de Banca</h2>
          <p className="text-gray-400 text-sm mb-6">Digite a senha para acessar</p>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="input-cartoon w-full mb-3 text-center text-lg"
            placeholder="Senha"
            autoFocus
          />
          {pwdError && <p className="text-red-400 text-sm mb-3">Senha incorreta!</p>}
          <button onClick={handleLogin} className="btn-cartoon w-full text-sm">
            Acessar
          </button>
          <div className="mt-4 pt-4 border-t border-dark-100">
            <Link href="/" className="text-sm text-gray-500 hover:text-green-neon transition-colors">
              ← Voltar para loja
            </Link>
          </div>
        </div>
        <Toast {...toast} onClose={closeToast} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-900">
      <aside className="hidden md:flex w-64 bg-dark-950 border-r-2 border-green-neon/10 min-h-screen flex-col">
        <div className="p-6 border-b-2 border-green-neon/10">
          <Link href="/v2/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="font-cartoon text-lg text-white">Controle de <span className="text-green-neon">Banca</span></span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Sistema de gerenciamento</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`admin-sidebar-link text-sm ${isActive ? 'active' : ''}`}
              >
                <Icon className="text-lg" />
                <span className="flex-1">{link.label}</span>
                <HiChevronRight className={`text-xs transition-opacity ${isActive ? 'opacity-100 text-green-neon' : 'opacity-0'}`} />
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t-2 border-green-neon/10 space-y-1">
          <Link href="/" className="admin-sidebar-link text-sm text-gray-500" target="_blank">
            ← Ver Loja
          </Link>
          <button onClick={handleLogout} className="admin-sidebar-link text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full">
            <HiLogout className="text-lg" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-6 bg-dark-900 pb-24 md:pb-6">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-lg border-t border-green-neon/10">
        <div className="flex items-center justify-around py-2 px-1">
          {links.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-neon' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Icon className="text-xl" />
                <span className="text-[10px] leading-tight">{link.label}</span>
              </Link>
            )
          })}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-red-400">
            <HiLogout className="text-xl" />
            <span className="text-[10px] leading-tight">Sair</span>
          </button>
        </div>
      </nav>

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
