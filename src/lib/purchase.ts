import type { Purchase } from '../types'
import { roundQty, roundTo } from './money'

/**
 * Dérivations et validations portant sur UN achat.
 *
 * Rappel de la convention : `totalPaidEur` est frais inclus, donc c'est
 * `totalPaidEur - feesEur` qui achète la quantité. Toutes les formules ci-dessous
 * en découlent — c'est le point le plus facile à casser par inadvertance.
 */

/** quantité = (montant total − frais) / cours */
export function computeQuantity(totalPaidEur: number, feesEur: number, unitPriceEur: number): number | null {
  if (!(unitPriceEur > 0)) return null
  return roundQty((totalPaidEur - feesEur) / unitPriceEur)
}

/** cours = (montant total − frais) / quantité */
export function computeUnitPrice(totalPaidEur: number, feesEur: number, quantity: number): number | null {
  if (!(quantity > 0)) return null
  return roundTo((totalPaidEur - feesEur) / quantity, 8)
}

/**
 * Écart relatif entre le montant net saisi et `quantité × cours`.
 * Les plateformes arrondissent, donc un petit écart est normal : on avertit,
 * on ne bloque pas.
 */
export function coherenceDeviation(p: Pick<Purchase, 'totalPaidEur' | 'feesEur' | 'quantity' | 'unitPriceEur'>): number {
  const net = p.totalPaidEur - p.feesEur
  const implied = p.quantity * p.unitPriceEur
  if (net === 0 && implied === 0) return 0
  const reference = Math.max(Math.abs(net), Math.abs(implied))
  if (reference === 0) return 0
  return Math.abs(net - implied) / reference
}

/** Au-delà de ce seuil on affiche un avertissement (non bloquant). */
export const COHERENCE_THRESHOLD = 0.005

export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

export function validatePurchase(p: Purchase): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) errors.push('Date invalide.')
  if (!p.asset.trim()) errors.push('La crypto est obligatoire.')
  if (!p.platform.trim()) errors.push('La plateforme est obligatoire.')

  if (!(p.totalPaidEur > 0)) errors.push('Le montant total doit être supérieur à 0.')
  if (p.feesEur < 0) errors.push('Les frais ne peuvent pas être négatifs.')
  // Le contrôle qui n'aurait aucun sens dans l'autre convention (montant hors frais).
  if (p.feesEur > p.totalPaidEur) errors.push('Les frais ne peuvent pas dépasser le montant total débité.')
  if (!(p.quantity > 0)) errors.push('La quantité doit être supérieure à 0.')
  if (!(p.unitPriceEur > 0)) errors.push('Le cours doit être supérieur à 0.')

  if (errors.length === 0 && coherenceDeviation(p) > COHERENCE_THRESHOLD) {
    warnings.push(
      'Montant, quantité et cours ne concordent pas à 0,5 % près. Vérifie la saisie — ' +
        'un petit écart est normal (arrondis de la plateforme).',
    )
  }

  return { errors, warnings }
}

/** Identifiant stable et lisible dans le JSON versionné. */
export function newId(): string {
  return crypto.randomUUID()
}
