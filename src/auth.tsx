import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export interface Profil {
  email: string
  role: 'admin' | 'service'
  serviceId?: string
  actif: boolean
}

interface Etat {
  user: User | null
  profil: Profil | null
  chargement: boolean
  erreur: string
  deconnexion: () => Promise<void>
}

const Ctx = createContext<Etat | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setChargement(true)
      setErreur('')
      setProfil(null)
      setUser(u)
      if (u?.email) {
        try {
          const snap = await getDoc(doc(db, 'users', u.email.toLowerCase()))
          if (snap.exists()) setProfil(snap.data() as Profil)
          else setErreur("Ce compte n'est associé à aucun service. Contactez l'administrateur.")
        } catch {
          setErreur('Impossible de lire votre profil. Vérifiez votre connexion internet puis réessayez.')
        }
      }
      setChargement(false)
    })
  }, [])

  const deconnexion = () => signOut(auth)

  return <Ctx.Provider value={{ user, profil, chargement, erreur, deconnexion }}>{children}</Ctx.Provider>
}

export function useAuth(): Etat {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return c
}
