import * as XLSX from 'xlsx'
import { CHAMPS, SERVICES, donneesVides, type Donnees } from './constants'
import { calculerIndicateurs, joursDuMois, totaux } from './indicators'
import { decoderPeriode, libellePeriode } from './periode'
import type { Rapport } from './rapports'

const STATUTS: Record<string, string> = { soumis: 'Soumis', brouillon: 'Brouillon' }

export function exporterExcel(periode: string, rapports: Record<string, Rapport>, inclureBrouillons: boolean) {
  const { annee, mois } = decoderPeriode(periode)
  const jours = joursDuMois(annee, mois)
  const entetes = ['Service', 'Statut', ...CHAMPS.map((c) => c.court), 'TOM', 'DMS', 'Rotation des lits', 'Observations']
  const lignes: (string | number | null)[][] = [entetes]

  const aCompter: Donnees[] = []
  for (const s of SERVICES) {
    const r = rapports[s.id]
    const d = r?.donnees ?? donneesVides()
    const ind = calculerIndicateurs(d, jours)
    lignes.push([
      s.nom,
      r ? STATUTS[r.statut] : 'Non commencé',
      ...CHAMPS.map((c) => (r ? d[c.key] : null)),
      ind.tom, ind.dms, ind.rotation,
      r?.observations ?? '',
    ])
    if (r && (r.statut === 'soumis' || inclureBrouillons)) aCompter.push(d)
  }
  const t = totaux(aCompter)
  const it = calculerIndicateurs(t, jours)
  lignes.push([
    inclureBrouillons ? 'TOTAL (soumis + brouillons)' : 'TOTAL (rapports soumis)',
    '',
    ...CHAMPS.map((c) => t[c.key]),
    it.tom, it.dms, it.rotation, '',
  ])

  const ws = XLSX.utils.aoa_to_sheet(lignes)
  const iTom = 2 + CHAMPS.length
  // Formats des indicateurs
  for (let r = 1; r < lignes.length; r++) {
    const formats = ['0.0%', '0.0', '0.00']
    formats.forEach((z, k) => {
      const cell = ws[XLSX.utils.encode_cell({ r, c: iTom + k })]
      if (cell && cell.t === 'n') cell.z = z
    })
  }
  ws['!cols'] = [{ wch: 28 }, { wch: 14 }, ...CHAMPS.map(() => ({ wch: 12 })), { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 40 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidation')
  const info = XLSX.utils.aoa_to_sheet([
    ['Rapport mensuel'],
    [libellePeriode(periode)],
    [`Nombre de jours : ${jours}`],
    [inclureBrouillons ? 'Le total inclut les brouillons.' : 'Le total ne compte que les rapports soumis.'],
  ])
  XLSX.utils.book_append_sheet(wb, info, 'Informations')
  XLSX.writeFile(wb, `Rapport_${periode}.xlsx`)
}
