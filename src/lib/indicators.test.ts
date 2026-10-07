import { describe, expect, it } from 'vitest'
import { calculerIndicateurs, controler, fmtNum, fmtPct, joursDuMois, totaux } from './indicators'
import { donneesVides } from './constants'

describe('indicateurs', () => {
  it("reproduit l'exemple du formulaire papier (juillet, 31 jours)", () => {
    const r = calculerIndicateurs({ journees: 308, malades: 59, lits: 20 }, 31)
    expect(fmtPct(r.tom)).toBe('49,7 %')
    expect(fmtNum(r.dms, 1)).toBe('5,2')
    expect(fmtNum(r.rotation, 2)).toBe('2,95')
  })

  it('affiche "—" quand le diviseur est 0 ou vide', () => {
    const r = calculerIndicateurs({ journees: 10, malades: 0, lits: 0 }, 30)
    expect(r.tom).toBeNull()
    expect(r.dms).toBeNull()
    expect(r.rotation).toBeNull()
    expect(fmtPct(r.tom)).toBe('—')
    const vide = calculerIndicateurs({}, 30)
    expect(vide.tom).toBeNull()
  })

  it('gère les années bissextiles', () => {
    expect(joursDuMois(2024, 2)).toBe(29)
    expect(joursDuMois(2026, 2)).toBe(28)
    expect(joursDuMois(2026, 4)).toBe(30)
    expect(joursDuMois(2026, 7)).toBe(31)
  })

  it('calcule les indicateurs du total sur les totaux (pas la moyenne)', () => {
    const a = { ...donneesVides(), journees: 100, malades: 10, lits: 10 }
    const b = { ...donneesVides(), journees: 200, malades: 40, lits: 10 }
    const t = totaux([a, b])
    expect(t.journees).toBe(300)
    expect(t.lits).toBe(20)
    const r = calculerIndicateurs(t, 30)
    expect(r.dms).toBeCloseTo(6, 5) // 300/50
    expect(r.tom).toBeCloseTo(0.5, 5) // 300/(20*30)
  })

  it('refuse des journées supérieures à lits × jours', () => {
    const d = { ...donneesVides(), journees: 700, lits: 20 }
    expect(controler(d, 31).erreurs.length).toBe(1)
    expect(controler({ ...d, journees: 620 }, 31).erreurs.length).toBe(0)
  })
})
