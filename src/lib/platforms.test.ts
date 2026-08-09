import { describe, expect, it } from 'vitest'
import { POPULAR_PLATFORMS, platformOptions } from './platforms'

describe('POPULAR_PLATFORMS', () => {
  it('propose le top 10 plus Revolut X, sans doublon', () => {
    expect(POPULAR_PLATFORMS).toHaveLength(11)
    expect(POPULAR_PLATFORMS).toContain('Revolut X')
    const keys = POPULAR_PLATFORMS.map((p) => p.toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('platformOptions', () => {
  it('propose la liste complète quand aucun achat n’a été saisi', () => {
    expect(platformOptions([])).toEqual([...POPULAR_PLATFORMS])
  })

  it('place les plateformes déjà saisies avant les suggestions', () => {
    const options = platformOptions(['Coinhouse', 'Kraken'])
    expect(options.slice(0, 2)).toEqual(['Coinhouse', 'Kraken'])
    expect(options).toContain('Binance')
  })

  // Une plateforme du journal absente de la liste rendrait son achat immodifiable :
  // la liste déroulante n'accepte aucune saisie libre.
  it('conserve les plateformes du journal inconnues de la liste', () => {
    expect(platformOptions(['Coinhouse'])).toContain('Coinhouse')
  })

  it('dédoublonne sans tenir compte de la casse', () => {
    const options = platformOptions(['kraken', 'KRAKEN', '  '])
    expect(options.filter((p) => p.toLowerCase() === 'kraken')).toHaveLength(1)
    expect(options).toHaveLength(POPULAR_PLATFORMS.length)
  })

  it('garde l’orthographe déjà présente dans le journal', () => {
    // Réécrire « kraken » en « Kraken » scinderait l'historique de la plateforme.
    expect(platformOptions(['kraken'])[0]).toBe('kraken')
  })
})
