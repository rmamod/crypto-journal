import { describe, expect, it } from 'vitest'
import type { Purchase } from '../types'
import { distinctValues, grandTotal, sortForJournal, summarize } from './aggregate'

function purchase(over: Partial<Purchase>): Purchase {
  return {
    id: crypto.randomUUID(),
    date: '2026-08-08',
    asset: 'BTC',
    platform: 'Kraken',
    totalPaidEur: 100,
    feesEur: 1,
    quantity: 0.001,
    unitPriceEur: 99000,
    note: '',
    ...over,
  }
}

describe('summarize', () => {
  it('calcule les deux PRU distinctement', () => {
    const purchases = [
      purchase({ totalPaidEur: 500, feesEur: 5, quantity: 0.01 }),
      purchase({ totalPaidEur: 300, feesEur: 3, quantity: 0.005 }),
    ]
    const [btc] = summarize(purchases)

    expect(btc.quantity).toBe(0.015)
    expect(btc.totalPaidEur).toBe(800)
    expect(btc.feesEur).toBe(8)
    // Coût réel : 800 / 0,015
    expect(btc.unitCostWithFees).toBeCloseTo(53333.33333333, 6)
    // Cours moyen obtenu : (800 − 8) / 0,015
    expect(btc.unitCostWithoutFees).toBeCloseTo(52800, 6)
    expect(btc.unitCostWithFees).toBeGreaterThan(btc.unitCostWithoutFees)
  })

  it('regroupe par crypto en ignorant la casse', () => {
    const summaries = summarize([
      purchase({ asset: 'btc' }),
      purchase({ asset: 'BTC' }),
      purchase({ asset: 'eth' }),
    ])
    expect(summaries.map((s) => s.asset).sort()).toEqual(['BTC', 'ETH'])
    expect(summaries.find((s) => s.asset === 'BTC')?.count).toBe(2)
  })

  it('trie par montant investi décroissant', () => {
    const summaries = summarize([
      purchase({ asset: 'ETH', totalPaidEur: 100 }),
      purchase({ asset: 'BTC', totalPaidEur: 900 }),
      purchase({ asset: 'SOL', totalPaidEur: 500 }),
    ])
    expect(summaries.map((s) => s.asset)).toEqual(['BTC', 'SOL', 'ETH'])
  })

  it('ne produit pas Infinity sur une quantité nulle', () => {
    const [s] = summarize([purchase({ quantity: 0 })])
    expect(s.unitCostWithFees).toBe(0)
    expect(s.unitCostWithoutFees).toBe(0)
    expect(Number.isFinite(s.unitCostWithFees)).toBe(true)
  })

  it('gère le cas où les frais valent tout le montant', () => {
    const [s] = summarize([purchase({ totalPaidEur: 10, feesEur: 10, quantity: 0.0001 })])
    expect(s.unitCostWithoutFees).toBe(0)
    expect(s.unitCostWithFees).toBeGreaterThan(0)
  })

  it('renvoie une liste vide sans achat', () => {
    expect(summarize([])).toEqual([])
  })
})

describe('grandTotal', () => {
  it('additionne débité, frais et net investi', () => {
    const total = grandTotal([
      purchase({ asset: 'BTC', totalPaidEur: 500, feesEur: 5 }),
      purchase({ asset: 'ETH', totalPaidEur: 300, feesEur: 3 }),
    ])
    expect(total.totalPaidEur).toBe(800)
    expect(total.feesEur).toBe(8)
    expect(total.netInvestedEur).toBe(792)
    expect(total.count).toBe(2)
    expect(total.assets).toBe(2)
  })
})

describe('distinctValues', () => {
  it('liste les valeurs uniques triées pour les datalists', () => {
    const purchases = [
      purchase({ platform: 'Kraken' }),
      purchase({ platform: 'Binance' }),
      purchase({ platform: 'Kraken' }),
      purchase({ platform: '  ' }),
    ]
    expect(distinctValues(purchases, 'platform')).toEqual(['Binance', 'Kraken'])
  })
})

describe('sortForJournal', () => {
  it('trie du plus récent au plus ancien', () => {
    const sorted = sortForJournal([
      purchase({ id: '1', date: '2026-07-01' }),
      purchase({ id: '2', date: '2026-08-09' }),
      purchase({ id: '3', date: '2026-08-01' }),
    ])
    expect(sorted.map((p) => p.date)).toEqual(['2026-08-09', '2026-08-01', '2026-07-01'])
  })

  // Ce que demande l'affichage : une date manquante ne remonte pas en tête du journal.
  it('rejette les achats sans date à la fin', () => {
    const sorted = sortForJournal([
      purchase({ id: '1', date: '' }),
      purchase({ id: '2', date: '2026-08-09' }),
      purchase({ id: '3', date: '' }),
      purchase({ id: '4', date: '2020-01-01' }),
    ])
    expect(sorted.map((p) => p.date)).toEqual(['2026-08-09', '2020-01-01', '', ''])
  })

  it('départage deux achats du même jour par la crypto', () => {
    const sorted = sortForJournal([
      purchase({ id: '1', date: '2026-08-09', asset: 'SOL' }),
      purchase({ id: '2', date: '2026-08-09', asset: 'BTC' }),
    ])
    expect(sorted.map((p) => p.asset)).toEqual(['BTC', 'SOL'])
  })

  it('ne modifie pas le tableau reçu', () => {
    const input = [purchase({ date: '2020-01-01' }), purchase({ date: '2026-08-09' })]
    const before = input.map((p) => p.date)
    sortForJournal(input)
    expect(input.map((p) => p.date)).toEqual(before)
  })
})
