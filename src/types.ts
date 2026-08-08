/**
 * Un achat de crypto.
 *
 * Convention centrale du projet : `totalPaidEur` est le montant GLOBAL débité par
 * la plateforme, FRAIS INCLUS. Le montant réellement investi vaut donc
 * `totalPaidEur - feesEur`, et c'est lui qui achète `quantity`.
 * Ce montant net n'est jamais stocké — il se calcule (voir `netInvested`) — pour
 * qu'il ne puisse pas diverger du montant saisi.
 */
export interface Purchase {
  id: string
  /** ISO `YYYY-MM-DD`. */
  date: string
  /** Ticker libre, ex. "BTC". Normalisé en majuscules à la saisie. */
  asset: string
  /** Plateforme d'achat, ex. "Kraken". */
  platform: string
  /** Montant total débité, frais inclus. */
  totalPaidEur: number
  /** Part de frais contenue dans `totalPaidEur`. */
  feesEur: number
  /** Quantité de crypto reçue. */
  quantity: number
  /** Cours EUR <-> crypto au moment de l'achat. */
  unitPriceEur: number
  note: string
}

export interface PurchasesFile {
  version: 1
  purchases: Purchase[]
}

export const CURRENT_VERSION = 1 as const

export function emptyFile(): PurchasesFile {
  return { version: CURRENT_VERSION, purchases: [] }
}

/** Montant réellement investi : le total débité moins les frais. */
export function netInvested(p: Purchase): number {
  return p.totalPaidEur - p.feesEur
}

export interface AssetSummary {
  asset: string
  quantity: number
  /** Somme des montants débités, frais inclus. */
  totalPaidEur: number
  feesEur: number
  /** `Σ totalPaid / Σ quantité` — le coût de revient réel. */
  unitCostWithFees: number
  /** `Σ (totalPaid - frais) / Σ quantité`. */
  unitCostWithoutFees: number
  count: number
}

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

/** Configuration de la sync GitHub. Le token est stocké à part (voir `storage/localAdapter`). */
export interface GitHubConfig {
  owner: string
  repo: string
  path: string
  token: string
}
