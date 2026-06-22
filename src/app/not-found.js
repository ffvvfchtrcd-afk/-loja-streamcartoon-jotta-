'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center animate-slide-up">
        <span className="text-8xl block mb-6">🎬</span>
        <h1 className="title-cartoon text-4xl text-white mb-3">404</h1>
        <p className="text-gray-400 text-lg mb-2">Página não encontrada</p>
        <p className="text-gray-500 text-sm mb-8">O que você procura pode ter sido removido ou nunca existiu.</p>
        <Link href="/" className="btn-cartoon text-base !py-3 px-8">
          ← Voltar para a Loja
        </Link>
      </div>
    </div>
  )
}
