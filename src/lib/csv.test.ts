import { describe, expect, it } from 'vitest'
import type { Purchase } from '../types'
import { parseCsv, toCsv } from './csv'
import { base64ToUtf8, utf8ToBase64 } from './base64'

const purchases: Purchase[] = [
  {
    id: 'a',
    date: '2026-08-08',
    asset: 'BTC',
    platform: 'Kraken',
    totalPaidEur: 500,
    feesEur: 2.5,
    quantity: 0.00808284,
    unitPriceEur: 61550.12,
    note: 'DCA mensuel',
  },
  {
    id: 'b',
    date: '2026-07-01',
    asset: 'ETH',
    platform: 'Coinbase — compte perso',
    totalPaidEur: 250,
    feesEur: 1.75,
    quantity: 0.1,
    unitPriceEur: 2482.5,
    note: 'note avec, une virgule et "des guillemets"',
  },
]

describe('CSV round-trip', () => {
  it('réimporte à l’identique ce qu’il a exporté', () => {
    const { purchases: parsed, rejected } = parseCsv(toCsv(purchases))

    expect(rejected).toEqual([])
    expect(parsed).toHaveLength(2)
    // Les id sont régénérés à l'import : on compare tout le reste.
    const withoutId = (list: Purchase[]) => list.map((p) => ({ ...p, id: '' }))
    expect(withoutId(parsed)).toEqual(withoutId(purchases))
  })

  it('préserve les virgules, guillemets et accents', () => {
    const { purchases: parsed } = parseCsv(toCsv(purchases))
    expect(parsed[1].platform).toBe('Coinbase — compte perso')
    expect(parsed[1].note).toBe('note avec, une virgule et "des guillemets"')
  })

  it('commence par un BOM UTF-8 pour Excel FR', () => {
    expect(toCsv(purchases).charCodeAt(0)).toBe(0xfeff)
  })
})

describe('parseCsv', () => {
  it('accepte le point-virgule et la virgule décimale (export Excel FR)', () => {
    const csv = [
      'date;asset;platform;totalPaidEur;feesEur;quantity;unitPriceEur;note',
      '08/08/2026;BTC;Kraken;500,00;2,50;0,00808284;61550,12;test',
    ].join('\n')

    const { purchases: parsed, rejected } = parseCsv(csv)
    expect(rejected).toEqual([])
    expect(parsed[0].date).toBe('2026-08-08')
    expect(parsed[0].totalPaidEur).toBe(500)
    expect(parsed[0].feesEur).toBe(2.5)
    expect(parsed[0].quantity).toBe(0.00808284)
  })

  it('recalcule le cours absent à partir du montant net', () => {
    const csv = ['date,asset,platform,totalPaidEur,feesEur,quantity', '2026-08-08,BTC,Kraken,500,2.5,0.00808284'].join(
      '\n',
    )
    const { purchases: parsed } = parseCsv(csv)
    expect(parsed[0].unitPriceEur).toBeCloseTo(61550.12, 1)
  })

  it('ignore les lignes invalides sans faire échouer le fichier', () => {
    const csv = [
      'date,asset,platform,totalPaidEur,feesEur,quantity,unitPriceEur,note',
      '2026-08-08,BTC,Kraken,500,2.5,0.00808284,61550.12,ok',
      'pas-une-date,BTC,Kraken,500,2.5,0.008,61550,ko',
      '2026-08-09,,Kraken,500,2.5,0.008,61550,ko',
      '2026-08-10,BTC,Kraken,abc,2.5,0.008,61550,ko',
      '2026-08-11,BTC,Kraken,500,600,0.008,61550,ko',
      '2026-08-12,ETH,Binance,250,1,0.1,2490,ok',
    ].join('\n')

    const { purchases: parsed, rejected } = parseCsv(csv)
    expect(parsed).toHaveLength(2)
    expect(rejected).toHaveLength(4)
    expect(rejected.map((r) => r.line)).toEqual([3, 4, 5, 6])
    expect(rejected[3].reason).toContain('frais')
  })

  it("rejette un fichier dont l'en-tête est incomplète", () => {
    const { purchases: parsed, rejected } = parseCsv('foo,bar\n1,2')
    expect(parsed).toEqual([])
    expect(rejected[0].reason).toContain('Colonnes manquantes')
  })

  it('gère un champ multi-lignes entre guillemets', () => {
    const csv =
      'date,asset,platform,totalPaidEur,feesEur,quantity,unitPriceEur,note\n' +
      '2026-08-08,BTC,Kraken,500,2.5,0.00808284,61550.12,"ligne 1\nligne 2"'
    const { purchases: parsed } = parseCsv(csv)
    expect(parsed[0].note).toBe('ligne 1\nligne 2')
  })

  it('signale un fichier vide', () => {
    expect(parseCsv('').rejected[0].reason).toContain('vide')
  })
})

describe('base64 UTF-8', () => {
  it('survit aux accents et aux tirets cadratins', () => {
    const source = 'Coinbase — compte perso, frais élevés (0,5 %) €'
    expect(base64ToUtf8(utf8ToBase64(source))).toBe(source)
  })

  it('décode le base64 découpé en lignes que renvoie GitHub', () => {
    const source = JSON.stringify({ version: 1, purchases: [] })
    const wrapped = utf8ToBase64(source).replace(/(.{4})/g, '$1\n')
    expect(base64ToUtf8(wrapped)).toBe(source)
  })

  it('encode un gros fichier sans exploser la pile', () => {
    const big = 'é'.repeat(200_000)
    expect(base64ToUtf8(utf8ToBase64(big))).toBe(big)
  })
})

describe('CSV — achats sans date', () => {
  it('accepte une case date vide', () => {
    const { purchases: parsed, rejected } = parseCsv(
      'date,asset,platform,totalPaidEur,feesEur,quantity,unitPriceEur,note\n' +
        ',BTC,Kraken,500,2.5,0.008,61550.12,\n',
    )
    expect(rejected).toEqual([])
    expect(parsed[0].date).toBe('')
  })

  it('refuse toujours une date écrite mais illisible', () => {
    const { purchases: parsed, rejected } = parseCsv(
      'date,asset,platform,totalPaidEur,feesEur,quantity,unitPriceEur,note\n' +
        'hier,BTC,Kraken,500,2.5,0.008,61550.12,\n',
    )
    expect(parsed).toEqual([])
    expect(rejected[0].reason).toContain('Date illisible')
  })

  // Un export doit pouvoir se réimporter tel quel, sinon l'aller-retour perd la ligne.
  it('fait l’aller-retour sur un achat non daté', () => {
    const undated: Purchase = { ...purchases[0], id: 'c', date: '' }
    const { purchases: parsed, rejected } = parseCsv(toCsv([undated]))
    expect(rejected).toEqual([])
    expect(parsed[0].date).toBe('')
    expect(parsed[0].asset).toBe('BTC')
  })
})
