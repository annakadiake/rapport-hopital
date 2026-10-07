import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const configOk = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)

// Si la configuration manque, l'application affiche un message d'aide (voir App.tsx).
const app = configOk ? initializeApp(cfg) : null
export const auth = (app ? getAuth(app) : null) as unknown as Auth
export const db = (app ? getFirestore(app) : null) as unknown as Firestore
