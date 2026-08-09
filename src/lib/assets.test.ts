import { describe, expect, it } from 'vitest'
import { POPULAR_ASSETS, assetLabel, assetOptions } from './assets'

describe('POPULAR_ASSETS', () => {
  it('propose dix cryptos, sans doublon de ticker', () => {
    const tickers = POPULAR_ASSETS.map((a) => a.ticker)
    expect(tickers).toHaveLength(10)
    expect(new Set(tickers).size).toBe(10)
  })

  it('n’expose que des tickers en majuscules', () => {
    for (const { ticker } of POPULAR_ASSETS) {
      expect(ticker).toBe(ticker.trim().toUpperCase())
    }
  })
})

describe('assetOptions', () => {
  it('propose le top 10 quand aucun achat n’a été saisi', () => {
    expect(assetOptions([]).map((a) => a.ticker)).toEqual(POPULAR_ASSETS.map((a) => a.ticker))
  })

  it('place les cryptos déjà saisies avant les suggestions', () => {
    const tickers = assetOptions(['SOL', 'PEPE']).map((a) => a.ticker)
    expect(tickers.slice(0, 2)).toEqual(['SOL', 'PEPE'])
    expect(tickers).toContain('BTC')
  })

  it('ne répète pas une crypto déjà saisie qui figure dans le top 10', () => {
    const tickers = assetOptions(['BTC', 'btc', ' eth ']).map((a) => a.ticker)
    expect(tickers.filter((t) => t === 'BTC')).toHaveLength(1)
    expect(tickers.filter((t) => t === 'ETH')).toHaveLength(1)
    expect(tickers).toHaveLength(POPULAR_ASSETS.length)
  })

  it('garde le nom complet des cryptos connues, même déjà saisies', () => {
    const [first] = assetOptions(['btc'])
    expect(first).toEqual({ ticker: 'BTC', name: 'Bitcoin' })
  })

  it('ignore les valeurs vides', () => {
    expect(assetOptions(['', '  ']).map((a) => a.ticker)).toEqual(POPULAR_ASSETS.map((a) => a.ticker))
  })

  // La liste déroulante n'accepte aucune saisie libre : si elle perdait une crypto du
  // journal, l'achat correspondant deviendrait immodifiable.
  it('contient toujours les cryptos du journal, même inconnues du top 10', () => {
    const tickers = assetOptions(['PEPE', 'WIF']).map((a) => a.ticker)
    expect(tickers).toContain('PEPE')
    expect(tickers).toContain('WIF')
  })
})

describe('assetLabel', () => {
  it('affiche le ticker et le nom quand il est connu', () => {
    expect(assetLabel({ ticker: 'BTC', name: 'Bitcoin' })).toBe('BTC — Bitcoin')
  })

  it('affiche le ticker seul quand le nom est inconnu', () => {
    expect(assetLabel({ ticker: 'PEPE' })).toBe('PEPE')
  })
})
