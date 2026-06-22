'use client'

import Link from 'next/link'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center animate-slide-up max-w-md">
        <span className="text-7xl block mb-6">😵</span>
        <h1 className="title-cartoon text-3xl text-white mb-3">Algo deu errado</h1>
        <p className="text-gray-400 mb-6">Ocorreu um erro inesperado. Tente novamente.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-cartoon !py-3 px-6">
            Tentar Novamente
          </button>
          <Link href="/" className="btn-cartoon-outline !py-3 px-6">
            Voltar para Loja
          </Link>
        </div>
      </div>
    </div>
  )
}
