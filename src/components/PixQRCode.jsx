'use client'

import { useState } from 'react'
import { HiClipboardCopy, HiCheck, HiClock } from 'react-icons/hi'

export default function PixQRCode({ pixCode, qrCode, expiration, orderId }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = pixCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const formatExpiration = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const isExpired = new Date(expiration) < new Date()

  return (
    <div className="pix-container p-8 animate-bounce-in">
      <div className="text-center mb-6">
        <span className="text-5xl animate-float inline-block">💚</span>
        <h3 className="title-cartoon text-2xl text-white mt-3">
          Pagamento via PIX
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Escaneie o QR Code ou copie o código PIX abaixo
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-56 h-56 bg-white rounded-2xl p-3 shadow-2xl animate-pulse-glow">
            {qrCode ? (
              <img
                src={qrCode}
                alt="QR Code PIX"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-gray-300 text-6xl">💚</span>
              </div>
            )}
          </div>
          {isExpired && (
            <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
              <span className="text-red-400 font-cartoon text-lg">Expirado</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-dark-900/50 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Código PIX (Copie e cole)</p>
        <p className="text-sm text-gray-300 font-mono break-all select-all bg-dark-950 p-3 rounded-lg border border-dark-100">
          {pixCode}
        </p>
      </div>

      <button
        onClick={handleCopy}
        className={`w-full btn-cartoon gap-2 ${
          copied ? '!bg-green-500' : ''
        }`}
      >
        {copied ? (
          <><HiCheck className="text-xl" /> Copiado!</>
        ) : (
          <><HiClipboardCopy className="text-xl" /> Copiar Código PIX</>
        )}
      </button>

      {expiration && !isExpired && (
        <div className="flex items-center justify-center gap-2 mt-4 text-yellow-400 text-sm">
          <HiClock />
          <span>Expira às {formatExpiration(expiration)}</span>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-xs">
          Após o pagamento, seu pedido será processado em até 5 minutos.
          Acesse a página de acompanhamento para ver o status.
        </p>
        {orderId && (
          <a
            href={`/pedido/${orderId}`}
            className="text-green-neon hover:underline text-sm mt-2 inline-block"
          >
            Acompanhar Pedido #{orderId}
          </a>
        )}
      </div>
    </div>
  )
}
