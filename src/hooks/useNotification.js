'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { adminFetcher } from '@/lib/fetcher'

export function useNotification() {
  const prevTotal = useRef(0)
  const audioCtx = useRef(null)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const { data: notifications } = useSWR(
    token ? '/api/notifications' : null,
    adminFetcher,
    { refreshInterval: 30000 }
  )

  const notifs = notifications || { pendingOrders: 0, openTickets: 0, total: 0, recentOrders: [], recentTickets: [] }

  useEffect(() => {
    if (!notifications) return
    if (notifications.total > prevTotal.current && prevTotal.current > 0) {
      try {
        if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
        const ctx = audioCtx.current
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 800
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      } catch {}
      if (document.hidden) {
        document.title = `(${notifications.total}) StreamCartoon Admin`
      }
    }
    prevTotal.current = notifications.total
  }, [notifications])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) document.title = 'StreamCartoon Admin'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return notifs
}
