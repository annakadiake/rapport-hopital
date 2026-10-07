import { CHAMPS, donneesVides, type Donnees } from './constants'

/** Nombre de jours du mois (mois de 1 à 12) ; gère les années bissextiles. */
export const joursDuMois = (annee: number, mois: number): number =>
  new Date(annee, mois, 0).getDate()

export interface Indicateurs {
  tom: number | null // fraction (0.4967 = 49,7 %)
  dms: number | null
  rotation: number | null
}

/**
 * TOM = journées / (lits x jours du mois)
 * DMS = journées / malades
 * Rotation des lits = malades / lits
 * Diviseur nul ou valeur manquante => null (affiché "—").
 */
export function calculerIndicateurs(
  d: Partial<Record<keyof Donnees, number | null>>,
  jours: number,
): Indicateurs {
  const { journees, lits, malades } = d
  const tom =
    journees != null && lits != null && lits > 0 && jours > 0
      ? journees / (lits * jours)
      : null
  const dms = journees != null && malades != null && malades > 0 ? journees / malades : null
  const rotation = malades != null && lits != null && lits > 0 ? malades / lits : null
  return { tom, dms, rotation }
}

export const fmtPct = (v: number | null): string =>
  v == null ? '—' : `${(v * 100).toFixed(1).replace('.', ',')} %`

export const fmtNum = (v: number | null, decimales: number): string =>
  v == null ? '—' : v.toFixed(decimales).replace('.', ',')

/** Somme champ par champ (les cases vides comptent pour 0). */
export function totaux(liste: Donnees[]): Donnees {
  const t = donneesVides()
  for (const c of CHAMPS) {
    t[c.key] = liste.reduce((somme, d) => somme + (d[c.key] ?? 0), 0)
  }
  return t
}

export interface Controle {
  erreurs: string[]
  avertissements: string[]
}

export function controler(d: Donnees, jours: number): Controle {
  const erreurs: string[] = []
  const avertissements: string[] = []
  if (d.journees != null && d.lits != null && d.journees > d.lits * jours) {
    erreurs.push(
      `Le nombre de journées d'hospitalisation (${d.journees}) dépasse le maximum possible : ${d.lits} lits × ${jours} jours = ${d.lits * jours}.`,
    )
  }
  if (d.malades != null && d.maladesSortis != null && d.dc != null && d.maladesSortis + d.dc > d.malades) {
    avertissements.push(
      'Malades sortis + DC dépasse le nombre de malades : vérifiez ces chiffres.',
    )
  }
  return { erreurs, avertissements }
}
