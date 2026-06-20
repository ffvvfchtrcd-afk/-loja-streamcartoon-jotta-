'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PASSWORD = 'jotta1@@'

export default function V2Login() {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('banca_auth') === 'true') {
      router.replace('/v2/dashboard')
    }
  }, [router])

  const handleLogin = () => {
    if (pwd === PASSWORD) {
      localStorage.setItem('banca_auth', 'true')
      router.replace('/v2/dashboard')
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="card-cartoon p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="font-cartoon text-xl text-white mb-1">Gerenciamento de Banca</h2>
        <p className="text-gray-400 text-sm mb-6">Digite a senha para acessar</p>
        <input
          type="password"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="input-cartoon w-full mb-3 text-center text-lg"
          placeholder="Senha"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-3">Senha incorreta!</p>}
        <button onClick={handleLogin} className="btn-cartoon w-full text-sm">Acessar</button>
      </div>
    </div>
  )
}
