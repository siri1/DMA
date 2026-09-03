'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface FormData {
  name: string
  email: string
  role: string
  password: string
}

const ROLE_META: Record<string, { emoji: string; label: string; accent: string }> = {
  ADMIN: { emoji: '⚙️', label: 'Administrador', accent: 'bg-slate-100 text-slate-800' },
  OFICINA: { emoji: '🔧', label: 'Oficina', accent: 'bg-blue-100 text-blue-800' },
  ARMAZEM: { emoji: '🏭', label: 'Armazém', accent: 'bg-amber-100 text-amber-800' },
  GESTAO: { emoji: '📈', label: 'Gestão', accent: 'bg-emerald-100 text-emerald-800' },
  CLIENTE_INTERNO: { emoji: '👤', label: 'Cliente Interno', accent: 'bg-purple-100 text-purple-800' },
  PAINEL: { emoji: '📺', label: 'Painel', accent: 'bg-gray-100 text-gray-800' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({ name: '', email: '', role: 'OFICINA', password: '' })

  const load = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        setUsers(await res.json())
      } else if (res.status === 401) {
        setError('Sessão expirada. Faça login novamente.')
        window.location.href = '/login'
      } else {
        setError(`Erro ao carregar utilizadores: ${res.status}`)
      }
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        setError('Erro ao criar utilizador')
        return
      }

      setForm({ name: '', email: '', role: 'OFICINA', password: '' })
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (id: string) => {
    if (!confirm('Desactivar este utilizador?')) return

    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deactivate: true }),
    })

    if (res.ok) {
      await load()
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">👥</div>
          <p className="text-sm">A carregar utilizadores...</p>
        </div>
      </div>
    )
  }

  if (error && !users.length) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const activeCount = users.filter((u) => u.active).length

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>👥</span> Controlo de Utilizadores
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeCount} activos de {users.length} no total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm shadow-sm shadow-indigo-600/20 transition-colors"
        >
          {showForm ? '✕ Cancelar' : '➕ Novo Utilizador'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-8 max-w-md">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">➕ Novo Utilizador</h2>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-xl mb-4 text-sm">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(ROLE_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.emoji} {meta.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe (mín. 10 caracteres)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                minLength={10}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? '⏳ A criar...' : '✓ Criar Utilizador'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Último Acesso</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => {
              const meta = ROLE_META[user.role] || { emoji: '❔', label: user.role, accent: 'bg-gray-100 text-gray-800' }
              return (
                <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.accent}`}>
                      {meta.emoji} {meta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLoginAt ? formatDateTime(new Date(user.lastLoginAt)) : '— Nunca'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">🟢 Activo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 font-medium">⚪ Inactivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.active && (
                      <button
                        onClick={() => deactivate(user.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        🚫 Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
