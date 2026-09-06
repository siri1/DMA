'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  Package,
  Truck,
  Boxes,
  Gauge,
  Cog,
  Mail,
  Lock,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'

const REMEMBER_KEY = 'dma-remembered-email'

/** Decorative workshop/parts-shop theme, built from icons rather than a
 * hotlinked stock photo — reliable offline, no licensing question, no URL
 * to guess at. Large, low-opacity, scattered across the gradient. */
function WorkshopBackdrop() {
  const icons = [
    { Icon: Wrench, className: 'top-[8%] left-[6%] rotate-[-12deg]', size: 120 },
    { Icon: Package, className: 'top-[62%] left-[10%] rotate-[8deg]', size: 90 },
    { Icon: Boxes, className: 'top-[15%] right-[8%] rotate-[10deg]', size: 130 },
    { Icon: Truck, className: 'bottom-[10%] right-[12%] rotate-[-6deg]', size: 110 },
    { Icon: Gauge, className: 'bottom-[20%] left-[42%] rotate-[4deg]', size: 80 },
    { Icon: Cog, className: 'top-[40%] right-[38%] rotate-[20deg]', size: 70 },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {icons.map(({ Icon, className, size }, i) => (
        <Icon key={i} className={`absolute text-white/[0.06] ${className}`} size={size} strokeWidth={1} />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const remembered = localStorage.getItem(REMEMBER_KEY)
      if (remembered) {
        setEmail(remembered)
        setRememberMe(true)
      }
    } catch {
      // localStorage can throw in private-browsing contexts — harmless to skip
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }
    } catch {
      // ignore storage failures — not critical to the login itself
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou palavra-passe incorretos')
      setPassword('')
      setIsLoading(false)
    } else if (result?.ok) {
      router.push('/')
    } else {
      setError('Erro ao fazer login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-4 relative overflow-hidden">
      <WorkshopBackdrop />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4 shadow-lg ring-1 ring-white/20">
            <Wrench className="text-white" size={30} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DMA Vision</h1>
          <p className="text-blue-200 text-sm mt-1">Gestão de Manutenção &amp; Peças · KWANDA, Lda.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                autoComplete="username"
                aria-required="true"
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Lock size={14} /> Palavra-passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!error}
                  className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Lembrar o meu email
            </label>

            {error && (
              <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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

          {process.env.NODE_ENV !== 'production' && (
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
          )}
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">© 2026 KWANDA, Lda. — Departamento de Manutenção e Ativos</p>
      </div>
    </div>
  )
}
