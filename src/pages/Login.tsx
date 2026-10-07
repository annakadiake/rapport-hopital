import { useState, type FormEvent } from 'react'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

function messageErreur(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou mot de passe incorrect.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Patientez quelques minutes puis réessayez.'
    case 'auth/network-request-failed':
      return 'Pas de connexion internet.'
    case 'auth/user-disabled':
      return 'Ce compte est désactivé. Contactez l’administrateur.'
    default:
      return 'Connexion impossible. Réessayez.'
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function connecter(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    setInfo('')
    setEnCours(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), mdp)
    } catch (err) {
      setErreur(messageErreur((err as { code?: string }).code ?? ''))
    } finally {
      setEnCours(false)
    }
  }

  async function reinitialiser() {
    setErreur('')
    setInfo('')
    if (!email.trim()) {
      setErreur("Entrez d'abord votre e-mail ci-dessus.")
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch {
      /* on ne révèle pas si le compte existe */
    }
    setInfo("Si ce compte existe, un e-mail de réinitialisation a été envoyé. Sinon, demandez un nouveau mot de passe à l'administrateur.")
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={connecter} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <div className="text-center">
          <h1 className="text-xl font-bold text-blue-900">Rapport mensuel d'activité</h1>
          <p className="text-sm text-slate-600">Connectez-vous avec l'identifiant de votre service</p>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
          <input id="email" type="email" autoComplete="username" required className="champ" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="mdp" className="mb-1 block text-sm font-medium">Mot de passe</label>
          <input id="mdp" type="password" autoComplete="current-password" required className="champ" value={mdp} onChange={(e) => setMdp(e.target.value)} />
        </div>
        {erreur && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{erreur}</p>}
        {info && <p className="rounded bg-green-50 p-2 text-sm text-green-800">{info}</p>}
        <button className="btn btn-primary w-full" disabled={enCours}>{enCours ? 'Connexion…' : 'Se connecter'}</button>
        <button type="button" onClick={reinitialiser} className="w-full text-center text-sm text-blue-700 underline">
          Mot de passe oublié ?
        </button>
      </form>
    </div>
  )
}
