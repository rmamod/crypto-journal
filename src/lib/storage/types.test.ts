import { describe, expect, it } from 'vitest'
import { SyncError, parsePurchasesFile } from './types'

const row = {
  id: 'a',
  date: '2026-08-08',
  asset: 'BTC',
  platform: 'Kraken',
  totalPaidEur: 500,
  feesEur: 2.5,
  quantity: 0.008,
  unitPriceEur: 61550.12,
  note: '',
}

describe('parsePurchasesFile', () => {
  it('rejette un JSON qui n’a pas la forme attendue', () => {
    expect(() => parsePurchasesFile(null)).toThrow(SyncError)
    expect(() => parsePurchasesFile({ purchases: 'nope' })).toThrow(SyncError)
  })

  /**
   * Le piège de la date facultative : ce filtre s'exécute à CHAQUE chargement, local
   * comme GitHub. S'il écartait les achats non datés, ils seraient bien enregistrés,
   * bien poussés sur GitHub, puis disparaîtraient de l'écran au rechargement suivant,
   * sans le moindre message.
   */
  it('conserve un achat sans date', () => {
    const { purchases } = parsePurchasesFile({ purchases: [{ ...row, date: '' }] })
    expect(purchases).toHaveLength(1)
    expect(purchases[0].date).toBe('')
    expect(purchases[0].asset).toBe('BTC')
  })

  it('écarte une ligne sans crypto, qui ne veut rien dire', () => {
    expect(parsePurchasesFile({ purchases: [{ ...row, asset: '' }] }).purchases).toEqual([])
  })

  it('garde les achats datés', () => {
    expect(parsePurchasesFile({ purchases: [row] }).purchases).toHaveLength(1)
  })
})
