'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { HiX } from 'react-icons/hi'
import useSWR from 'swr'

export default function CategoryDrawer({ open, onClose }) {
  return (
    <Suspense fallback={null}>
      <CategoryDrawerContent open={open} onClose={onClose} />
    </Suspense>
  )
}

function CategoryDrawerContent({ open, onClose }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const selectedCategory = searchParams.get('category') || 'Todas'

  const { data: result } = useSWR(open ? '/api/products?limit=100' : null)
  const products = result?.products || []
  const categories = products.length > 0
    ? ['Todas', ...new Set(products.map(p => p.category))]
    : ['Todas']

  const handleSelect = (cat) => {
    if (cat === 'Todas') {
      router.push('/')
    } else {
      router.push(`/?category=${encodeURIComponent(cat)}`)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-dark-950/90" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-dark-50 rounded-t-3xl max-h-[70vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-green-neon/10">
          <h2 className="font-cartoon text-base text-white">Categorias</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <HiX className="text-xl" />
          </button>
        </div>
        <div className="p-3 space-y-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleSelect(cat)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
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
    </div>
  )
}
