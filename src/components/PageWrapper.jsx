'use client'

import { usePathname } from 'next/navigation'

export default function PageWrapper({ children }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  if (isAdmin) return <>{children}</>
  return <div className="lg:pl-64 pb-16 md:pb-0">{children}</div>
}
