'use client'

import { usePathname } from 'next/navigation'
import useSWR from 'swr'

export default function MaintenanceGuard({ children }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  const { data } = useSWR('/api/admin/maintenance')
  const maintenance = data?.enabled

  if (maintenance && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <span className="text-8xl block mb-6">🔧</span>
          <h1 className="title-cartoon text-4xl text-white mb-4">Em Manutenção</h1>
          <p className="text-gray-400 text-lg mb-2">Estamos realizando algumas melhorias.</p>
          <p className="text-gray-500">Volte em breve!</p>
        </div>
      </div>
    )
  }

  return children
}
