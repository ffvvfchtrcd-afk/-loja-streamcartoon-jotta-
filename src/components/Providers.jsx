'use client'

import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CartProvider } from '@/context/CartContext'

export default function Providers({ children }) {
  return (
    <SWRConfig value={{
      fetcher,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }}>
      <CartProvider>
        {children}
      </CartProvider>
    </SWRConfig>
  )
}
