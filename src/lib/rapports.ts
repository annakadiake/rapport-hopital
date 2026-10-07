import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
  type Timestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { CHAMPS, donneesVides, type Donnees } from './constants'

export type Statut = 'brouillon' | 'soumis'

export interface Rapport {
  periode: string
  serviceId: string
  statut: Statut
  donnees: Donnees
  observations: string
  misAJourPar: string
  misAJourLe?: Timestamp | null
  soumisLe?: Timestamp | null
}

export const idRapport = (periode: string, serviceId: string) => `${periode}_${serviceId}`

function normaliser(data: Record<string, unknown>): Rapport {
  const brut = (data.donnees ?? {}) as Record<string, number | null>
  const donnees = donneesVides()
  for (const c of CHAMPS) donnees[c.key] = brut[c.key] ?? null
  return { ...(data as unknown as Rapport), donnees }
}

export async function lireRapport(periode: string, serviceId: string): Promise<Rapport | null> {
  const snap = await getDoc(doc(db, 'rapports', idRapport(periode, serviceId)))
  return snap.exists() ? normaliser(snap.data()) : null
}

export async function listerRapportsDuService(serviceId: string): Promise<Rapport[]> {
  const snap = await getDocs(query(collection(db, 'rapports'), where('serviceId', '==', serviceId)))
  return snap.docs.map((d) => normaliser(d.data()))
}

export async function listerRapportsDuMois(periode: string): Promise<Rapport[]> {
  const snap = await getDocs(query(collection(db, 'rapports'), where('periode', '==', periode)))
  return snap.docs.map((d) => normaliser(d.data()))
}

export async function enregistrerRapport(p: {
  periode: string
  serviceId: string
  donnees: Donnees
  observations: string
  soumettre: boolean
}): Promise<void> {
  const email = auth.currentUser?.email
  if (!email) throw new Error('Non connecté')
  await setDoc(doc(db, 'rapports', idRapport(p.periode, p.serviceId)), {
    periode: p.periode,
    serviceId: p.serviceId,
    statut: p.soumettre ? 'soumis' : 'brouillon',
    donnees: p.donnees,
    observations: p.observations,
    misAJourPar: email,
    misAJourLe: serverTimestamp(),
    soumisLe: p.soumettre ? serverTimestamp() : null,
  })
}

/** Réservé à l'administrateur : remet un rapport soumis en brouillon. */
export async function rouvrirRapport(periode: string, serviceId: string): Promise<void> {
  const email = auth.currentUser?.email
  if (!email) throw new Error('Non connecté')
  await updateDoc(doc(db, 'rapports', idRapport(periode, serviceId)), {
    statut: 'brouillon',
    soumisLe: null,
    misAJourPar: email,
    misAJourLe: serverTimestamp(),
  })
}
