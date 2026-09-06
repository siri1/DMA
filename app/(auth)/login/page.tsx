'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Wrench, Mail, Lock, AlertTriangle, Lightbulb, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou palavra-passe incorretos')
      setIsLoading(false)
    } else if (result?.ok) {
      router.push('/')
    } else {
      setError('Erro ao fazer login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-800 to-indigo-600 p-4 relative overflow-hidden">
      <Wrench className="absolute -right-16 -bottom-16 text-white/5" size={420} strokeWidth={1} />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4 shadow-lg ring-1 ring-white/20">
            <Wrench className="text-white" size={30} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DMA Vision</h1>
          <p className="text-indigo-200 text-sm mt-1">Gestão de Manutenção &amp; Peças · KWANDA, Lda.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Lock size={14} /> Palavra-passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> A processar...
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900">
            <p className="font-medium mb-2 flex items-center gap-1.5">
              <Lightbulb size={15} /> Credenciais de demonstração
            </p>
            <p className="flex justify-between">
              <span className="text-indigo-700">Email</span>
              <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">admin@kwanda.ao</code>
            </p>
            <p className="flex justify-between mt-1">
              <span className="text-indigo-700">Palavra-passe</span>
              <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">Admin@2026</code>
            </p>
          </div>
        </div>

        <p className="text-center text-indigo-300 text-xs mt-6">© 2026 KWANDA, Lda. — Departamento de Manutenção e Ativos</p>
      </div>
    </div>
  )
}
