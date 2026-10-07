import { useCallback, useEffect, useMemo, useState } from 'react'
import { CHAMPS, SERVICES, donneesVides } from '../lib/constants'
import { calculerIndicateurs, fmtNum, fmtPct, joursDuMois, totaux } from '../lib/indicators'
import { decoderPeriode, libellePeriode, periodeParDefaut } from '../lib/periode'
import { listerRapportsDuMois, rouvrirRapport, type Rapport } from '../lib/rapports'
import PeriodePicker from '../components/PeriodePicker'

const BADGE: Record<string, string> = {
  soumis: 'bg-green-100 text-green-800',
  brouillon: 'bg-amber-100 text-amber-800',
  none: 'bg-slate-200 text-slate-600',
}
const LIBELLE: Record<string, string> = { soumis: 'Soumis', brouillon: 'Brouillon', none: 'Non commencé' }

export default function AdminPage() {
  const [periode, setPeriode] = useState(periodeParDefaut())
  const [rapports, setRapports] = useState<Record<string, Rapport>>({})
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [inclureBrouillons, setInclureBrouillons] = useState(false)

  const charger = useCallback(async () => {
    setCharge(true)
    setErreur('')
    try {
      const l = await listerRapportsDuMois(periode)
      setRapports(Object.fromEntries(l.map((r) => [r.serviceId, r])))
    } catch {
      setErreur('Impossible de charger les données. Vérifiez la connexion et les règles Firestore.')
    } finally {
      setCharge(false)
    }
  }, [periode])

  useEffect(() => {
    charger()
  }, [charger])

  const { annee, mois } = decoderPeriode(periode)
  const jours = joursDuMois(annee, mois)

  const total = useMemo(() => {
    const l = Object.values(rapports)
      .filter((r) => r.statut === 'soumis' || inclureBrouillons)
      .map((r) => r.donnees)
    return totaux(l)
  }, [rapports, inclureBrouillons])
  const indTotal = calculerIndicateurs(total, jours)
  const nbSoumis = Object.values(rapports).filter((r) => r.statut === 'soumis').length

  async function rouvrir(serviceId: string, nom: string) {
    if (!window.confirm(`Rouvrir le rapport de « ${nom} » pour ${libellePeriode(periode)} ? Le service pourra le modifier à nouveau.`)) return
    try {
      await rouvrirRapport(periode, serviceId)
      await charger()
    } catch {
      setErreur("Impossible de rouvrir ce rapport.")
    }
  }

  async function exporter() {
    const { exporterExcel } = await import('../lib/export')
    exporterExcel(periode, rapports, inclureBrouillons)
  }

  const val = (n: number | null | undefined) => (n == null ? '—' : n)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Tableau de bord · {libellePeriode(periode)}</h2>
          <p className="text-sm text-slate-600">
            <strong>{nbSoumis}</strong> service(s) sur {SERVICES.length} ont soumis leur rapport · {jours} jours
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodePicker periode={periode} onChange={setPeriode} />
          <button className="btn btn-secondary" onClick={charger} disabled={charge}>Actualiser</button>
          <button className="btn btn-primary" onClick={exporter} disabled={charge}>
            Exporter en Excel
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={inclureBrouillons} onChange={(e) => setInclureBrouillons(e.target.checked)} />
        Inclure les brouillons dans le total (par défaut : seulement les rapports soumis)
      </label>

      {erreur && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="sticky left-0 z-10 bg-blue-900 px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-left">Statut</th>
              {CHAMPS.map((c) => <th key={c.key} className="px-2 py-2 text-center">{c.court}</th>)}
              <th className="px-2 py-2 text-center">TOM</th>
              <th className="px-2 py-2 text-center">DMS</th>
              <th className="px-2 py-2 text-center">Rotation</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((s) => {
              const r = rapports[s.id]
              const d = r?.donnees ?? donneesVides()
              const ind = r ? calculerIndicateurs(d, jours) : { tom: null, dms: null, rotation: null }
              const st = r?.statut ?? 'none'
              return (
                <tr key={s.id} className="border-b odd:bg-white even:bg-slate-50">
                  <td className="sticky left-0 bg-inherit px-3 py-2 font-medium">
                    {s.nom}
                    {r?.observations && <span title={r.observations} className="ml-1 cursor-help text-blue-700">💬</span>}
                  </td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[st]}`}>{LIBELLE[st]}</span></td>
                  {CHAMPS.map((c) => <td key={c.key} className="px-2 py-2 text-center">{r ? val(d[c.key]) : '—'}</td>)}
                  <td className="px-2 py-2 text-center">{fmtPct(ind.tom)}</td>
                  <td className="px-2 py-2 text-center">{fmtNum(ind.dms, 1)}</td>
                  <td className="px-2 py-2 text-center">{fmtNum(ind.rotation, 2)}</td>
                  <td className="px-2 py-2">
                    {r?.statut === 'soumis' && (
                      <button className="text-xs text-blue-700 underline" onClick={() => rouvrir(s.id, s.nom)}>Rouvrir</button>
                    )}
                  </td>
                </tr>
              )
            })}
            <tr className="bg-blue-100 font-bold">
              <td className="sticky left-0 bg-blue-100 px-3 py-2">TOTAL</td>
              <td className="px-3 py-2 text-xs font-normal">{inclureBrouillons ? 'soumis + brouillons' : 'soumis'}</td>
              {CHAMPS.map((c) => <td key={c.key} className="px-2 py-2 text-center">{total[c.key]}</td>)}
              <td className="px-2 py-2 text-center">{fmtPct(indTotal.tom)}</td>
              <td className="px-2 py-2 text-center">{fmtNum(indTotal.dms, 1)}</td>
              <td className="px-2 py-2 text-center">{fmtNum(indTotal.rotation, 2)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Les indicateurs du total sont calculés sur les totaux (et non une moyenne des services).
        {charge && ' Chargement…'}
      </p>
    </div>
  )
}
