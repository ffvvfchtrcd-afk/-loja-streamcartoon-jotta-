'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiCube, HiShoppingCart, HiKey, HiCog, HiTicket, HiUser, HiClock, HiShieldCheck, HiTag, HiOutlineSparkles, HiMenu, HiX } from 'react-icons/hi'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: HiHome },
  { href: '/admin/dashboard/produtos', label: 'Produtos', icon: HiCube },
  { href: '/admin/dashboard/pedidos', label: 'Pedidos', icon: HiShoppingCart },
  { href: '/admin/dashboard/usuarios', label: 'Usuários', icon: HiUser },
  { href: '/admin/dashboard/tickets', label: 'Tickets', icon: HiTicket },
  { href: '/admin/dashboard/codigos', label: 'Códigos', icon: HiKey },
  { href: '/admin/dashboard/config', label: 'Config', icon: HiCog },
]

export default function AdminMobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (!pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-lg border-t border-green-neon/10 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {links.slice(0, 5).map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-green-neon' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="text-xl" />
                <span className="text-[10px] leading-tight">{link.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-gray-500 hover:text-gray-300"
          >
            <HiMenu className="text-xl" />
            <span className="text-[10px] leading-tight">Menu</span>
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-dark-950 border-l border-green-neon/10 p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <span className="font-cartoon text-white text-lg">
                Stream<span className="text-green-neon">Cartoon</span>
              </span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-2">
                <HiX className="text-xl" />
              </button>
            </div>
            <nav className="space-y-1">
              {links.map(link => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'bg-green-neon/10 text-green-neon font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-dark-100'
                    }`}
                  >
                    <Icon className="text-lg" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-6 pt-4 border-t border-dark-100">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-gray-300 rounded-xl hover:bg-dark-100">
                ← Ver Loja
              </Link>
              <button
                onClick={() => { localStorage.removeItem('token'); window.location.href = '/admin/login' }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 rounded-xl hover:bg-red-500/10 w-full"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}