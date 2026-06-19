'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { HiUser, HiTicket, HiLogout, HiShoppingCart } from 'react-icons/hi'
import useSWR from 'swr'
import { useCart } from '@/context/CartContext'

export default function StoreSidebar() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <StoreSidebarContent pathname={pathname} />
    </Suspense>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-56 bg-dark-950 border-r border-green-neon/10 z-40">
      <div className="p-4 border-b border-green-neon/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🟢</span>
          <h1 className="font-cartoon text-base text-white">
            Green<span className="text-green-neon">Hub</span>
          </h1>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-2">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-9 bg-dark-100/30 rounded-xl animate-pulse" />
        ))}
      </div>
    </aside>
  )
}

function CartNavLink() {
  const { totalItems, loaded } = useCart()
  return (
    <Link
      href="/carrinho"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-green-neon hover:bg-green-neon/5 transition-all mb-4 relative"
    >
      <HiShoppingCart className="text-green-neon text-base shrink-0" />
      <span className="flex-1">Carrinho</span>
      {loaded && totalItems > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-green-neon text-dark-950 text-[10px] font-bold rounded-full">
          {totalItems}
        </span>
      )}
    </Link>
  )
}

function StoreSidebarContent({ pathname }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const selectedCategory = searchParams.get('category') || 'Todas'

  const { data: result } = useSWR('/api/products?limit=100')
  const products = result?.products || []
  const categories = products.length > 0
    ? ['Todas', ...new Set(products.map(p => p.category))]
    : ['Todas']

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

  const handleCategoryClick = (cat) => {
    if (cat === 'Todas') {
      router.push('/')
    } else {
      router.push(`/?category=${encodeURIComponent(cat)}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_username')
    window.dispatchEvent(new Event('user-change'))
    router.push('/')
  }

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-56 bg-dark-950 border-r border-green-neon/10 z-40">
      <div className="p-4 border-b border-green-neon/10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl group-hover:animate-wiggle">🟢</span>
          <h1 className="font-cartoon text-base text-white">
            Green<span className="text-green-neon">Hub</span>
          </h1>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <CartNavLink />
        <div className="border-t border-green-neon/10 mb-4" />
        <h2 className="text-[10px] font-body font-bold uppercase tracking-[0.15em] text-gray-500 mb-2.5 px-3">
          Categorias
        </h2>
        <div className="space-y-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-green-neon/15 text-green-neon border border-green-neon/30 font-medium'
                  : 'text-gray-400 hover:bg-green-neon/5 hover:text-green-neon'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-green-neon/10 space-y-0.5">
        {user ? (
          <>
            <Link
              href="/minha-conta"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-green-neon hover:bg-green-neon/5 transition-all"
            >
              <HiUser className="text-green-neon text-base shrink-0" />
              <span className="truncate">{user}</span>
            </Link>
            <Link
              href="/minha-conta/tickets"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-green-neon hover:bg-green-neon/5 transition-all"
            >
              <HiTicket className="text-base shrink-0" />
              Meus Tickets
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <HiLogout className="text-base shrink-0" />
              Sair
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-green-neon hover:bg-green-neon/5 transition-all"
            >
              <HiUser className="text-base shrink-0" />
              Entrar
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-green-neon hover:bg-green-neon/10 transition-all"
            >
              Cadastrar
            </Link>
          </>
        )}
      </div>
    </aside>
  )
}