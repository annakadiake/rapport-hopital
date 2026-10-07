import { MOIS } from './constants'

/** Mois précédent, au format "AAAA-MM". */
export function periodeParDefaut(): string {
  const n = new Date()
  let annee = n.getFullYear()
  let mois = n.getMonth() // 0-11 : donc égal au numéro (1-12) du mois précédent
  if (mois === 0) {
    annee -= 1
    mois = 12
  }
  return `${annee}-${String(mois).padStart(2, '0')}`
}

export function decoderPeriode(p: string) {
  const [a, m] = p.split('-').map(Number)
  return { annee: a, mois: m }
}

export function libellePeriode(p: string): string {
  const { annee, mois } = decoderPeriode(p)
  return `${MOIS[mois - 1]} ${annee}`
}

export function construirePeriode(annee: number, mois: number): string {
  return `${annee}-${String(mois).padStart(2, '0')}`
}
