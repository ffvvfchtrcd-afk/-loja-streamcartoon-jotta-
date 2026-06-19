'use client'

import { useState, useEffect } from 'react'
import { HiRefresh, HiClock } from 'react-icons/hi'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'

const actionLabels = {
  import_codes: 'Importou códigos',
  product_create: 'Criou produto',
  product_update: 'Editou produto',
  product_delete: 'Removeu produto',
  order_confirm: 'Confirmou pagamento',
  order_cancel: 'Cancelou pedido',
  order_deliver: 'Entregou produto',
  ticket_close: 'Fechou ticket',
  ticket_reply: 'Respondeu ticket',
  coupon_create: 'Criou cupom',
  coupon_update: 'Editou cupom',
  coupon_delete: 'Removeu cupom',
  admin_create: 'Criou admin',
  settings_update: 'Alterou configurações',
}

export default function AdminAtividades() {
  const { mutate } = useSWRConfig()
  const { data: logs, isLoading } = useSWR('/api/admin/activity', adminFetcher)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Atividades</h2>
          <p className="text-gray-400 text-sm">Registro de ações dos administradores</p>
        </div>
        <button onClick={() => mutate('/api/admin/activity')} className="btn-cartoon-outline text-sm gap-2">
          <HiRefresh className="text-lg" /> Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiClock className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="card-cartoon overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-dark-100">
                  <th className="text-left pb-3 font-medium">Data/Hora</th>
                  <th className="text-left pb-3 font-medium">Admin</th>
                  <th className="text-left pb-3 font-medium">Ação</th>
                  <th className="text-left pb-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-dark-100/50 hover:bg-dark-50/50 transition-colors">
                    <td className="py-3 text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 text-gray-300">{log.adminName}</td>
                    <td className="py-3">
                      <span className="text-green-neon">{actionLabels[log.action] || log.action}</span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
