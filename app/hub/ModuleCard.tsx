import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ModuleInfo } from '@/lib/modules'

interface ModuleCardProps {
  module: ModuleInfo
  href: string
}

export function ModuleCard({ module, href }: ModuleCardProps) {
  const Icon = module.icon

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 p-8 hover:ring-white/25 hover:-translate-y-1 hover:bg-white/[0.07] transition-all"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.accent} flex items-center justify-center mb-6 shadow-lg`}>
        <Icon size={26} className="text-white" strokeWidth={2} />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">{module.description}</p>

      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
        Entrar <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  )
}
