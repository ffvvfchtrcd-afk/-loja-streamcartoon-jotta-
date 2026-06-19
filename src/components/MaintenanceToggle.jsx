'use client'

import useSWR, { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import { HiCog } from 'react-icons/hi'
import Toast, { useToast } from '@/components/Toast'

export default function MaintenanceToggle() {
  const { data, isLoading } = useSWR('/api/admin/maintenance', adminFetcher)
  const { mutate } = useSWRConfig()
  const { toast, showToast, closeToast } = useToast()

  const handleToggle = async (e) => {
    const enabled = e.target.checked
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/maintenance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enabled }),
    })
    if (res.ok) {
      showToast(enabled ? 'Modo manutenção ativado!' : 'Modo manutenção desativado!', 'success')
      mutate('/api/admin/maintenance')
    } else {
      showToast('Erro ao alterar modo manutenção', 'error')
    }
  }

  return (
    <div className="card-cartoon p-6 mt-6 border-yellow-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <HiCog className="text-xl text-yellow-400" />
          </div>
          <div>
            <h3 className="font-cartoon text-lg text-white">Modo Manutenção</h3>
            <p className="text-sm text-gray-400 mt-1">Quando ativo, a loja exibe uma mensagem de manutenção para os clientes</p>
          </div>
        </div>
        {isLoading ? (
          <div className="w-12 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        ) : (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data?.enabled || false}
              onChange={handleToggle}
            />
            <div className="w-11 h-6 bg-dark-100 rounded-full peer peer-checked:bg-yellow-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:border after:border-dark-100"></div>
          </label>
        )}
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}