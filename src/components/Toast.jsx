'use client'

import { useState, useEffect } from 'react'
import { HiCheckCircle, HiXCircle, HiExclamation, HiX } from 'react-icons/hi'

const icons = {
  success: HiCheckCircle,
  error: HiXCircle,
  warning: HiExclamation,
  info: HiExclamation,
}

const colors = {
  success: 'border-green-neon/30 bg-green-neon/10 text-green-neon',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
}

export default function Toast({ message, type = 'success', show, onClose, duration = 4000 }) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  const Icon = icons[type]

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${colors[type]} shadow-2xl backdrop-blur-sm`}>
        <Icon className="text-xl" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
          <HiX className="text-lg" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  return { toast, showToast, closeToast }
}
