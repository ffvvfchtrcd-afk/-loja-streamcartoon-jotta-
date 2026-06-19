'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiViewGrid, HiUser, HiTicket, HiShoppingCart } from 'react-icons/hi'
import { useCart } from '@/context/CartContext'
import CategoryDrawer from './CategoryDrawer'

export default function MobileNav() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('user_token')
      const username = localStorage.getItem('user_username')
      setUser(token && username ? username : null)
    }
    updateUser()
    window.addEventListener('user-change', updateUser)
    return () => window.removeEventListener('user-change', updateUser)
  }, [])

  if (pathname?.startsWith('/admin')) return null

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname?.startsWith(path)
  }

  return (
    <>
      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-dark-950/95 backdrop-blur-lg border-t border-green-neon/10 z-50 md:hidden flex items-center justify-around px-1">
        <NavButton href="/" icon={HiHome} label="Home" active={isActive('/')} />
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-gray-400 hover:text-green-neon transition-colors"
        >
          <HiViewGrid className="text-xl" />
          <span className="text-[10px] font-body leading-tight">Catálogo</span>
        </button>
        <CartNavButton />
        {user ? (
          <NavButton href="/minha-conta" icon={HiUser} label="Conta" active={isActive('/minha-conta')} />
        ) : (
          <NavButton href="/login" icon={HiUser} label="Entrar" active={isActive('/login')} />
        )}
        <NavButton href="/minha-conta/tickets" icon={HiTicket} label="Tickets" active={isActive('/minha-conta/tickets')} />
      </nav>
    </>
  )
}

function NavButton({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
        active ? 'text-green-neon' : 'text-gray-400 hover:text-green-neon'
      }`}
    >
      <Icon className="text-xl" />
      <span className="text-[10px] font-body leading-tight">{label}</span>
    </Link>
  )
}

function CartNavButton() {
  const { totalItems, loaded } = useCart()
  const pathname = usePathname()
  const active = pathname?.startsWith('/carrinho')

  return (
    <Link
      href="/carrinho"
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors relative ${
        active ? 'text-green-neon' : 'text-gray-400 hover:text-green-neon'
      }`}
    >
      <div className="relative">
        <HiShoppingCart className="text-xl" />
        {loaded && totalItems > 0 && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-green-neon text-dark-950 text-[8px] font-bold rounded-full flex items-center justify-center">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </div>
      <span className="text-[10px] font-body leading-tight">Carrinho</span>
    </Link>
  )
}