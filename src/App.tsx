import { AuthProvider, useAuth } from './auth'
import { configOk } from './firebase'
import { SERVICES } from './lib/constants'
import Cadre from './components/Cadre'
import Login from './pages/Login'
import ServicePage from './pages/ServicePage'
import AdminPage from './pages/AdminPage'

function Message({ titre, texte, deconnexion }: { titre: string; texte: string; deconnexion?: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-3 rounded-xl bg-white p-6 text-center shadow">
        <h1 className="text-lg font-bold text-blue-900">{titre}</h1>
        <p className="text-sm text-slate-700">{texte}</p>
        {deconnexion && <button className="btn btn-secondary" onClick={deconnexion}>Se déconnecter</button>}
      </div>
    </div>
  )
}

function Contenu() {
  const { user, profil, chargement, erreur, deconnexion } = useAuth()

  if (chargement) return <Message titre="Chargement…" texte="Veuillez patienter." />
  if (!user) return <Login />
  if (erreur) return <Message titre="Accès impossible" texte={erreur} deconnexion={deconnexion} />
  if (!profil) return <Message titre="Chargement…" texte="Veuillez patienter." />
  if (!profil.actif) return <Message titre="Compte désactivé" texte="Ce compte a été désactivé. Contactez l'administrateur." deconnexion={deconnexion} />

  if (profil.role === 'admin') {
    return <Cadre profil={profil}><AdminPage /></Cadre>
  }
  if (!SERVICES.some((s) => s.id === profil.serviceId)) {
    return <Message titre="Service inconnu" texte="Votre compte n'est lié à aucun service valide. Contactez l'administrateur." deconnexion={deconnexion} />
  }
  return <Cadre profil={profil}><ServicePage profil={profil} /></Cadre>
}

export default function App() {
  if (!configOk) {
    return (
      <Message
        titre="Configuration Firebase manquante"
        texte="Copiez le fichier .env.example en .env, remplissez les valeurs de votre projet Firebase, puis relancez l'application (voir le guide README)."
      />
    )
  }
  return (
    <AuthProvider>
      <Contenu />
    </AuthProvider>
  )
}
