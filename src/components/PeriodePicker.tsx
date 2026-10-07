import { MOIS } from '../lib/constants'
import { construirePeriode, decoderPeriode } from '../lib/periode'

export default function PeriodePicker({
  periode,
  onChange,
}: {
  periode: string
  onChange: (p: string) => void
}) {
  const { annee, mois } = decoderPeriode(periode)
  const anneeCourante = new Date().getFullYear()
  const annees = [anneeCourante - 3, anneeCourante - 2, anneeCourante - 1, anneeCourante]
  if (!annees.includes(annee)) annees.push(annee)

  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor="mois">Mois</label>
      <select id="mois" className="champ" value={mois} onChange={(e) => onChange(construirePeriode(annee, Number(e.target.value)))}>
        {MOIS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="annee">Année</label>
      <select id="annee" className="champ" value={annee} onChange={(e) => onChange(construirePeriode(Number(e.target.value), mois))}>
        {annees.sort().map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}
