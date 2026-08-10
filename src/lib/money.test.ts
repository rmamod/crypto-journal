import { describe, expect, it } from 'vitest'
import { dateSuffix, formatEur, parseNumber, roundEur, roundQty, roundTo } from './money'

describe('parseNumber', () => {
  it('accepte les formats français et anglais', () => {
    expect(parseNumber('1234.56')).toBe(1234.56)
    expect(parseNumber('1234,56')).toBe(1234.56)
    expect(parseNumber('1 234,56')).toBe(1234.56)
    expect(parseNumber('1.234,56')).toBe(1234.56)
    expect(parseNumber('1,234.56')).toBe(1234.56)
  })

  it('tolère les espaces insécables et le symbole euro', () => {
    expect(parseNumber('1 234,56 €')).toBe(1234.56)
    expect(parseNumber(' 42 ')).toBe(42)
  })

  it('gère les très petites quantités sans passer en notation scientifique', () => {
    expect(parseNumber('0,00000001')).toBe(0.00000001)
  })

  it('retourne null plutôt que NaN sur une saisie invalide', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('12abc')).toBeNull()
    expect(parseNumber('.')).toBeNull()
    expect(parseNumber('-')).toBeNull()
  })
})

describe('arrondis', () => {
  it('arrondit les euros à 2 décimales sans dérive binaire', () => {
    expect(roundEur(0.1 + 0.2)).toBe(0.3)
    expect(roundEur(1.005)).toBe(1.01)
    expect(roundEur(2.675)).toBe(2.68)
  })

  it('arrondit les quantités à 8 décimales', () => {
    expect(roundQty(0.123456789)).toBe(0.12345679)
  })

  it('neutralise les valeurs non finies', () => {
    expect(roundTo(Number.POSITIVE_INFINITY, 2)).toBe(0)
    expect(roundTo(Number.NaN, 2)).toBe(0)
  })
})

describe('formatEur', () => {
  it('formate en euros', () => {
    // L'espace avant € est un insécable étroit selon la locale : on teste le fond.
    expect(formatEur(1234.5)).toContain('1')
    expect(formatEur(1234.5)).toContain('234,50')
    expect(formatEur(1234.5)).toContain('€')
  })
})

describe('dateSuffix', () => {
  it('complète une phrase avec la date', () => {
    expect(dateSuffix('2026-08-09')).toBe('du 09/08/2026')
  })

  // Sans ça, les messages de commit finissaient par « du » suivi de rien.
  it('dit « sans date » quand la date manque', () => {
    expect(dateSuffix('')).toBe('sans date')
  })
})
