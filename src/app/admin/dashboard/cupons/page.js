'use client'

import { useState } from 'react'
import { HiPlus, HiTrash, HiOutlineSparkles } from 'react-icons/hi'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { adminFetcher } from '@/lib/fetcher'
import Toast, { useToast } from '@/components/Toast'

export default function AdminCupons() {
  const { mutate } = useSWRConfig()
  const { data: coupons, isLoading } = useSWR('/api/admin/coupons', adminFetcher)
  const { toast, showToast, closeToast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minValue: '0',
    maxUses: '0',
    expiresAt: '',
  })

  const resetForm = () => {
    setForm({ code: '', type: 'percentage', value: '', minValue: '0', maxUses: '0', expiresAt: '' })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    const body = {
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      minValue: parseFloat(form.minValue),
      maxUses: parseInt(form.maxUses),
      expiresAt: form.expiresAt || null,
    }

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast('Cupom criado com sucesso!', 'success')
      setShowModal(false)
      resetForm()
      mutate('/api/admin/coupons')
    } else {
      const data = await res.json()
      showToast(data.error || 'Erro ao criar cupom', 'error')
    }
  }

  const handleToggle = async (coupon) => {
    const token = localStorage.getItem('token')

    const res = await fetch('/api/admin/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    })

    if (res.ok) {
      showToast(`Cupom ${coupon.active ? 'desativado' : 'ativado'}!`, 'success')
      mutate('/api/admin/coupons')
    } else {
      showToast('Erro ao atualizar cupom', 'error')
    }
  }

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token')

    const res = await fetch(`/api/admin/coupons?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      showToast('Cupom removido!', 'success')
      mutate('/api/admin/coupons')
    } else {
      showToast('Erro ao remover cupom', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="title-cartoon text-3xl text-white mb-1">Cupons</h2>
          <p className="text-gray-400 text-sm">Gerencie os cupons de desconto</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-cartoon text-sm gap-2">
          <HiPlus className="text-lg" /> Novo Cupom
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-neon/30 border-t-green-neon rounded-full animate-spin" />
        </div>
      ) : (coupons || []).length === 0 ? (
        <div className="card-cartoon text-center py-12">
          <HiOutlineSparkles className="text-5xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum cupom cadastrado</p>
          <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-cartoon text-sm mt-4">Criar Primeiro Cupom</button>
        </div>
      ) : (
        <div className="card-cartoon overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-dark-100">
                  <th className="text-left pb-3 font-medium">Código</th>
                  <th className="text-left pb-3 font-medium">Tipo</th>
                  <th className="text-left pb-3 font-medium">Valor</th>
                  <th className="text-left pb-3 font-medium">Mínimo</th>
                  <th className="text-left pb-3 font-medium">Usos</th>
                  <th className="text-left pb-3 font-medium">Expira</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(coupons || []).map(coupon => (
                  <tr key={coupon.id} className="border-b border-dark-100/50 hover:bg-dark-50/50 transition-colors">
                    <td className="py-3">
                      <code className="text-green-neon font-mono bg-dark-950 px-2 py-0.5 rounded text-xs uppercase">
                        {coupon.code}
                      </code>
                    </td>
                    <td className="py-3 text-gray-300 text-xs">
                      {coupon.type === 'percentage' ? 'Percentual' : 'Fixo'}
                    </td>
                    <td className="py-3 text-white font-medium">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                    </td>
                    <td className="py-3 text-gray-400">
                      {coupon.minValue > 0 ? `R$ ${coupon.minValue.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 text-gray-400">
                      {coupon.maxUses === 0 ? '∞' : `${coupon._count?.orders || 0}/${coupon.maxUses}`}
                    </td>
                    <td className="py-3 text-gray-400 text-xs">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          coupon.active ? 'bg-green-neon' : 'bg-dark-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          coupon.active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Remover"
                      >
                        <HiTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card-cartoon w-full max-w-lg p-8 animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-cartoon text-xl text-white mb-2">Novo Cupom</h3>
            <p className="text-gray-400 text-sm mb-6">Crie um novo cupom de desconto</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Código</label>
                <input
                  className="input-cartoon uppercase"
                  placeholder="PROMO10"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo de Desconto</label>
                  <select className="input-cartoon" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="percentage">Percentual</option>
                    <option value="fixed">Fixo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Valor do Desconto</label>
                  <input
                    type="number"
                    step={form.type === 'percentage' ? '1' : '0.01'}
                    className="input-cartoon"
                    placeholder={form.type === 'percentage' ? '10' : '9.99'}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Valor Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-cartoon"
                    placeholder="0"
                    value={form.minValue}
                    onChange={e => setForm({ ...form, minValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Usos Máximos</label>
                  <input
                    type="number"
                    className="input-cartoon"
                    placeholder="0 = ilimitado"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Data de Expiração <span className="text-gray-500">(opcional)</span></label>
                <input
                  type="date"
                  className="input-cartoon"
                  value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cartoon-outline flex-1 text-sm">Cancelar</button>
                <button type="submit" className="btn-cartoon flex-1 text-sm">Criar Cupom</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  )
}
