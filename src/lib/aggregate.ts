import type { AssetSummary, Purchase } from '../types'
import { roundEur, roundQty, roundTo } from './money'

/**
 * Résumé par crypto.
 *
 * Deux prix de revient unitaires sont exposés, parce que les deux répondent à des
 * questions différentes :
 *  - `unitCostWithFees`    = Σ totalPaid / Σ quantité  → ce que la crypto t'a réellement coûté
 *  - `unitCostWithoutFees` = Σ (totalPaid − frais) / Σ quantité → le cours moyen obtenu
 */
export function summarize(purchases: Purchase[]): AssetSummary[] {
  const byAsset = new Map<string, AssetSummary>()

  for (const p of purchases) {
    const key = p.asset.trim().toUpperCase()
    if (!key) continue
    const current = byAsset.get(key) ?? {
      asset: key,
      quantity: 0,
      totalPaidEur: 0,
      feesEur: 0,
      unitCostWithFees: 0,
      unitCostWithoutFees: 0,
      count: 0,
    }
    current.quantity += p.quantity
    current.totalPaidEur += p.totalPaidEur
    current.feesEur += p.feesEur
    current.count += 1
    byAsset.set(key, current)
  }

  const summaries = [...byAsset.values()].map((s) => {
    // Division par zéro impossible en pratique (quantité > 0 est validé à la saisie),
    // mais un import CSV bancal ne doit pas produire un Infinity affiché à l'écran.
    const qty = s.quantity
    return {
      ...s,
      quantity: roundQty(qty),
      totalPaidEur: roundEur(s.totalPaidEur),
      feesEur: roundEur(s.feesEur),
      unitCostWithFees: qty > 0 ? roundTo(s.totalPaidEur / qty, 8) : 0,
      unitCostWithoutFees: qty > 0 ? roundTo((s.totalPaidEur - s.feesEur) / qty, 8) : 0,
    }
  })

  return summaries.sort((a, b) => b.totalPaidEur - a.totalPaidEur)
}

export interface GrandTotal {
  totalPaidEur: number
  feesEur: number
  netInvestedEur: number
  count: number
  assets: number
}

export function grandTotal(purchases: Purchase[]): GrandTotal {
  const totalPaidEur = purchases.reduce((sum, p) => sum + p.totalPaidEur, 0)
  const feesEur = purchases.reduce((sum, p) => sum + p.feesEur, 0)
  const assets = new Set(purchases.map((p) => p.asset.trim().toUpperCase()).filter(Boolean))
  return {
    totalPaidEur: roundEur(totalPaidEur),
    feesEur: roundEur(feesEur),
    netInvestedEur: roundEur(totalPaidEur - feesEur),
    count: purchases.length,
    assets: assets.size,
  }
}

/**
 * Valeurs distinctes déjà saisies, pour alimenter les propositions du formulaire :
 * la datalist des plateformes, et la liste déroulante des cryptos (voir `assetOptions`).
 */
export function distinctValues(purchases: Purchase[], field: 'asset' | 'platform'): string[] {
  const seen = new Set<string>()
  for (const p of purchases) {
    const value = p[field].trim()
    if (value) seen.add(value)
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'fr'))
}
