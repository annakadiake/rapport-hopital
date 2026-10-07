import type { ReactNode } from 'react'
import { useAuth, type Profil } from '../auth'
import { nomService } from '../lib/constants'

export default function Cadre({ profil, children }: { profil: Profil; children: ReactNode }) {
  const { deconnexion } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">Rapport mensuel d'activité</h1>
            <p className="text-xs text-blue-100">
              {profil.role === 'admin' ? 'Administrateur' : nomService(profil.serviceId)} · {profil.email}
            </p>
          </div>
          <button className="btn bg-white/10 text-white hover:bg-white/20" onClick={deconnexion}>
            Se déconnecter
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
