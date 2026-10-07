import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Profil } from '../auth'
import { CHAMPS, nomService, type ChampKey, type Donnees } from '../lib/constants'
import { calculerIndicateurs, controler, fmtNum, fmtPct, joursDuMois } from '../lib/indicators'
import { decoderPeriode, libellePeriode, periodeParDefaut } from '../lib/periode'
import { enregistrerRapport, lireRapport, listerRapportsDuService } from '../lib/rapports'
import PeriodePicker from '../components/PeriodePicker'

type Textes = Record<ChampKey, string>
type StatutLocal = 'nouveau' | 'brouillon' | 'soumis'

const textesVides = (): Textes =>
  Object.fromEntries(CHAMPS.map((c) => [c.key, ''])) as Textes

const versTextes = (d: Donnees): Textes => {
  const t = textesVides()
  for (const c of CHAMPS) t[c.key] = d[c.key] == null ? '' : String(d[c.key])
  return t
}

function analyser(t: Textes): { donnees: Donnees; invalides: string[]; vides: number } {
  const donnees = {} as Donnees
  const invalides: string[] = []
  let vides = 0
  for (const c of CHAMPS) {
    const s = t[c.key].trim()
    if (s === '') {
      donnees[c.key] = null
      vides++
      continue
    }
    const n = Number(s)
    if (!Number.isInteger(n) || n < 0) {
      invalides.push(c.label)
      donnees[c.key] = null
    } else donnees[c.key] = n
  }
  return { donnees, invalides, vides }
}

const BADGE: Record<string, string> = {
  soumis: 'bg-green-100 text-green-800',
  brouillon: 'bg-amber-100 text-amber-800',
}

export default function ServicePage({ profil }: { profil: Profil }) {
  const serviceId = profil.serviceId ?? ''
  const [periode, setPeriode] = useState(periodeParDefaut())
  const [textes, setTextes] = useState<Textes>(textesVides())
  const [obs, setObs] = useState('')
  const [statut, setStatut] = useState<StatutLocal>('nouveau')
  const [charge, setCharge] = useState(true)
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)
  const [histo, setHisto] = useState<{ periode: string; statut: string }[]>([])

  const chargerHisto = useCallback(async () => {
    try {
      const l = await listerRapportsDuService(serviceId)
      setHisto(l.map((r) => ({ periode: r.periode, statut: r.statut })).sort((a, b) => b.periode.localeCompare(a.periode)))
    } catch {
      /* l'historique est facultatif */
    }
  }, [serviceId])

  useEffect(() => {
    chargerHisto()
  }, [chargerHisto])

  useEffect(() => {
    let annule = false
    setCharge(true)
    setMsg(null)
    lireRapport(periode, serviceId)
      .then((r) => {
        if (annule) return
        if (r) {
          setTextes(versTextes(r.donnees))
          setObs(r.observations)
          setStatut(r.statut)
        } else {
          setTextes(textesVides())
          setObs('')
          setStatut('nouveau')
        }
      })
      .catch(() => !annule && setMsg({ ok: false, texte: 'Impossible de charger le formulaire. Vérifiez votre connexion.' }))
      .finally(() => !annule && setCharge(false))
    return () => {
      annule = true
    }
  }, [periode, serviceId])

  const { annee, mois } = decoderPeriode(periode)
  const jours = joursDuMois(annee, mois)
  const analyse = useMemo(() => analyser(textes), [textes])
  const controle = useMemo(() => controler(analyse.donnees, jours), [analyse, jours])
  const ind = calculerIndicateurs(analyse.donnees, jours)
  const verrouille = statut === 'soumis'
  const erreurs = [...analyse.invalides.map((l) => `${l} : entrez un nombre entier positif ou 0.`), ...controle.erreurs]

  async function sauver(soumettre: boolean) {
    setMsg(null)
    if (erreurs.length) {
      setMsg({ ok: false, texte: 'Corrigez les erreurs avant d\'enregistrer.' })
      return
    }
    if (soumettre) {
      const avert = analyse.vides > 0 ? `${analyse.vides} case(s) sont vides et seront considérées comme « non renseignées ».\n\n` : ''
      if (!window.confirm(`${avert}Soumettre le rapport de ${libellePeriode(periode)} ? Vous ne pourrez plus le modifier (seul l'administrateur peut le rouvrir).`)) return
    }
    setEnCours(true)
    try {
      await enregistrerRapport({ periode, serviceId, donnees: analyse.donnees, observations: obs, soumettre })
      setStatut(soumettre ? 'soumis' : 'brouillon')
      setMsg({ ok: true, texte: soumettre ? 'Rapport soumis. Merci !' : 'Brouillon enregistré.' })
      chargerHisto()
    } catch {
      setMsg({ ok: false, texte: "Enregistrement impossible (connexion ou droits). Vos chiffres restent à l'écran : réessayez." })
    } finally {
      setEnCours(false)
    }
  }

  const champ = (c: (typeof CHAMPS)[number]) => (
    <div key={c.key}>
      <label htmlFor={c.key} className="mb-1 block text-sm font-medium text-slate-700">{c.label}</label>
      <input
        id={c.key}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className="champ"
        disabled={verrouille || charge}
        value={textes[c.key]}
        onChange={(e) => setTextes({ ...textes, [c.key]: e.target.value })}
      />
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{nomService(serviceId)}</h2>
            <p className="text-sm text-slate-600">Rapport de {libellePeriode(periode)} · {jours} jours</p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodePicker periode={periode} onChange={setPeriode} />
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[statut] ?? 'bg-slate-200 text-slate-700'}`}>
              {statut === 'soumis' ? 'Soumis' : statut === 'brouillon' ? 'Brouillon' : 'Non commencé'}
            </span>
          </div>
        </div>

        {verrouille && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            Ce rapport est soumis : il est en lecture seule. Pour le corriger, demandez à l'administrateur de le rouvrir.
          </p>
        )}

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-blue-900">Activité d'hospitalisation</h3>
          <div className="grid gap-4 sm:grid-cols-2">{CHAMPS.filter((c) => c.groupe === 'hospi').map(champ)}</div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-blue-900">Consultations</h3>
          <div className="grid gap-4 sm:grid-cols-2">{CHAMPS.filter((c) => c.groupe === 'consult').map(champ)}</div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <label htmlFor="obs" className="mb-1 block font-semibold text-blue-900">Observations (facultatif)</label>
          <textarea id="obs" rows={3} maxLength={2000} className="champ" disabled={verrouille || charge} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>

        {erreurs.length > 0 && (
          <ul role="alert" className="list-disc space-y-1 rounded-md bg-red-50 p-3 pl-7 text-sm text-red-700">
            {erreurs.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        {controle.avertissements.length > 0 && (
          <ul className="list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-7 text-sm text-amber-800">
            {controle.avertissements.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        {msg && (
          <p role="status" className={`rounded-md p-3 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.texte}</p>
        )}

        {!verrouille && (
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-secondary" disabled={enCours || charge} onClick={() => sauver(false)}>Enregistrer le brouillon</button>
            <button className="btn btn-primary" disabled={enCours || charge} onClick={() => sauver(true)}>Soumettre le rapport</button>
          </div>
        )}
      </section>

      <aside className="space-y-5">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-blue-900">Indicateurs (automatiques)</h3>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-600">Taux d'occupation moyenne (TOM)</dt><dd className="text-2xl font-bold">{fmtPct(ind.tom)}</dd></div>
            <div><dt className="text-slate-600">Durée moyenne de séjour (DMS)</dt><dd className="text-2xl font-bold">{fmtNum(ind.dms, 1)}</dd></div>
            <div><dt className="text-slate-600">Indice de rotation des lits</dt><dd className="text-2xl font-bold">{fmtNum(ind.rotation, 2)}</dd></div>
          </dl>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-blue-900">Mois précédents</h3>
          {histo.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun rapport enregistré.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {histo.map((h) => (
                <li key={h.periode}>
                  <button className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-slate-100" onClick={() => setPeriode(h.periode)}>
                    <span>{libellePeriode(h.periode)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE[h.statut]}`}>{h.statut === 'soumis' ? 'Soumis' : 'Brouillon'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
