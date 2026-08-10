import { describe, expect, it } from 'vitest'
import type { Purchase } from '../types'
import { coherenceDeviation, computeQuantity, computeUnitPrice, validatePurchase } from './purchase'

const base: Purchase = {
  id: 'test',
  date: '2026-08-08',
  asset: 'BTC',
  platform: 'Kraken',
  totalPaidEur: 500,
  feesEur: 2.5,
  quantity: 0.00808284,
  unitPriceEur: 61550.12,
  note: '',
}

describe('computeQuantity', () => {
  it("déduit les frais du montant avant de diviser par le cours — c'est LA règle du projet", () => {
    // 500 € débités dont 2,50 € de frais : seuls 497,50 € achètent de la crypto.
    expect(computeQuantity(500, 2.5, 61550.12)).toBe(0.00808284)
    // Le résultat qu'on obtiendrait si on oubliait de déduire les frais :
    expect(computeQuantity(500, 2.5, 61550.12)).not.toBe(0.00812346)
  })

  it('refuse un cours nul ou négatif', () => {
    expect(computeQuantity(500, 2.5, 0)).toBeNull()
    expect(computeQuantity(500, 2.5, -1)).toBeNull()
  })
})

describe('computeUnitPrice', () => {
  it('reconstitue le cours à partir du montant net', () => {
    expect(computeUnitPrice(500, 2.5, 0.00808284)).toBeCloseTo(61550.12, 1)
  })

  it('refuse une quantité nulle', () => {
    expect(computeUnitPrice(500, 2.5, 0)).toBeNull()
  })
})

describe('coherenceDeviation', () => {
  it('est quasi nulle sur un achat cohérent', () => {
    expect(coherenceDeviation(base)).toBeLessThan(0.0001)
  })

  it("détecte l'oubli de déduction des frais", () => {
    expect(coherenceDeviation({ ...base, quantity: 0.00812346 })).toBeGreaterThan(0.004)
  })

  it('ne divise pas par zéro', () => {
    expect(coherenceDeviation({ totalPaidEur: 0, feesEur: 0, quantity: 0, unitPriceEur: 0 })).toBe(0)
  })
})

describe('validatePurchase', () => {
  it('accepte un achat valide', () => {
    const { errors, warnings } = validatePurchase(base)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })

  it('refuse des frais supérieurs au montant total débité', () => {
    const { errors } = validatePurchase({ ...base, feesEur: 600 })
    expect(errors.join(' ')).toContain('frais')
  })

  it('accepte des frais égaux au montant total (cas limite)', () => {
    // Absurde économiquement mais arithmétiquement valide : on ne bloque que le dépassement.
    const { errors } = validatePurchase({ ...base, totalPaidEur: 2.5, feesEur: 2.5 })
    expect(errors.some((e) => e.includes('dépasser'))).toBe(false)
  })

  it('avertit sans bloquer quand les champs ne concordent pas', () => {
    const { errors, warnings } = validatePurchase({ ...base, quantity: 0.009 })
    expect(errors).toEqual([])
    expect(warnings).toHaveLength(1)
  })

  it('exige les champs obligatoires', () => {
    const { errors } = validatePurchase({ ...base, asset: '', platform: '', quantity: 0 })
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validatePurchase — date facultative', () => {
  it('accepte un achat sans date', () => {
    const { errors } = validatePurchase({ ...base, date: '' })
    expect(errors).toEqual([])
  })

  it('refuse toujours une date écrite mais illisible', () => {
    for (const date of ['08/08/2026', '2026-8-8', 'hier']) {
      expect(validatePurchase({ ...base, date }).errors).toContain('Date invalide.')
    }
  })
})
