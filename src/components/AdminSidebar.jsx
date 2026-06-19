'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiCube, HiShoppingCart, HiKey, HiCog, HiLogout, HiTicket, HiUser, HiOutlineSparkles, HiClock, HiShieldCheck, HiTag } from 'react-icons/hi'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: HiHome },
  { href: '/admin/dashboard/atividades', label: 'Atividades', icon: HiClock },
  { href: '/admin/dashboard/produtos', label: 'Produtos', icon: HiCube },
  { href: '/admin/dashboard/categorias', label: 'Categorias', icon: HiTag },
  { href: '/admin/dashboard/pedidos', label: 'Pedidos', icon: HiShoppingCart },
  { href: '/admin/dashboard/usuarios', label: 'Usuários', icon: HiUser },
  { href: '/admin/dashboard/tickets', label: 'Tickets', icon: HiTicket },
  { href: '/admin/dashboard/codigos', label: 'Códigos', icon: HiKey },
  { href: '/admin/dashboard/cupons', label: 'Cupons', icon: HiOutlineSparkles },
  { href: '/admin/dashboard/administradores', label: 'Administradores', icon: HiShieldCheck },
  { href: '/admin/dashboard/config', label: 'Configurações', icon: HiCog },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState({ pendingOrders: 0, openTickets: 0 })

  useEffect(() => {
    const fetchNotifs = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch {}
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/admin/login'
  }

  const totalNotifs = notifications.pendingOrders + notifications.openTickets

  return (
    <aside className="hidden md:flex w-64 bg-dark-950 border-r-2 border-green-neon/10 min-h-screen flex-col">
      <div className="p-6 border-b-2 border-green-neon/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          <span className="font-cartoon text-lg text-white">
            Stream<span className="text-green-neon">Cartoon</span>
          </span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">Painel Administrativo</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => {
          const Icon = link.icon
          const isActive = pathname === link.href
          let badge = null
          if (link.href === '/admin/dashboard/pedidos' && notifications.pendingOrders > 0) {
            badge = notifications.pendingOrders
          }
          if (link.href === '/admin/dashboard/tickets' && notifications.openTickets > 0) {
            badge = notifications.openTickets
          }
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-sidebar-link text-sm ${isActive ? 'active' : ''}`}
            >
              <Icon className="text-lg" />
              <span className="flex-1">{link.label}</span>
              {badge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t-2 border-green-neon/10">
        <Link href="/" className="admin-sidebar-link text-sm text-gray-500" target="_blank">
          ← Ver Loja
        </Link>
        <button
          onClick={handleLogout}
          className="admin-sidebar-link text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full mt-1"
        >
          <HiLogout className="text-lg" />
          Sair
        </button>
      </div>
    </aside>
  )
}
