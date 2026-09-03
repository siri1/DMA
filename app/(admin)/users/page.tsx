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

  if (loading) return <div className="p-8">A carregar...</div>

  if (error && !users.length) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Controlo de Utilizadores</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Novo Utilizador'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 mb-8 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Novo Utilizador</h2>
          {error && <div className="p-3 bg-red-100 text-red-800 rounded mb-4">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ADMIN">Administrador</option>
                <option value="OFICINA">Oficina</option>
                <option value="ARMAZEM">Armazém</option>
                <option value="GESTAO">Gestão</option>
                <option value="CLIENTE_INTERNO">Cliente Interno</option>
                <option value="PAINEL">Painel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe (mín. 10 caracteres)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                minLength={10}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'A criar...' : 'Criar Utilizador'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Perfil</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Último Acesso</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{user.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.lastLoginAt ? formatDateTime(new Date(user.lastLoginAt)) : 'Nunca'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.active ? (
                    <span className="text-green-600 font-medium">Activo</span>
                  ) : (
                    <span className="text-gray-600 font-medium">Inactivo</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.active && (
                    <button
                      onClick={() => deactivate(user.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
