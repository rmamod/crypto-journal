import type { PurchasesFile } from '../../types'

export type SyncErrorCode =
  /** Token absent, expiré ou révoqué. */
  | 'unauthorized'
  /** Token valide mais sans droit sur ce repo. */
  | 'forbidden'
  /** Le fichier a changé côté GitHub depuis notre dernier chargement. */
  | 'conflict'
  /** Repo ou chemin introuvable. */
  | 'not_found'
  | 'network'
  | 'invalid_data'
  | 'unknown'

/**
 * Erreur porteuse d'un message déjà rédigé en français pour l'utilisateur.
 * Le `code` sert à décider quoi proposer (recharger, ressaisir le token, ...).
 */
export class SyncError extends Error {
  readonly code: SyncErrorCode

  constructor(code: SyncErrorCode, message: string) {
    super(message)
    this.name = 'SyncError'
    this.code = code
  }
}

export interface StorageAdapter {
  readonly kind: 'local' | 'github'
  load(): Promise<PurchasesFile>
  /** `message` devient le message de commit côté GitHub, ignoré en local. */
  save(file: PurchasesFile, message: string): Promise<void>
}

/** Valide la forme du JSON avant de l'accepter — un fichier corrompu ne doit pas casser l'app. */
export function parsePurchasesFile(raw: unknown): PurchasesFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new SyncError('invalid_data', 'Le fichier de données est illisible.')
  }
  const candidate = raw as { purchases?: unknown }
  if (!Array.isArray(candidate.purchases)) {
    throw new SyncError('invalid_data', 'Le fichier de données ne contient pas de liste « purchases ».')
  }

  const purchases = candidate.purchases.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const p = item as Record<string, unknown>
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
    const str = (v: unknown) => (typeof v === 'string' ? v : '')
    if (!str(p.date) || !str(p.asset)) return []
    return [
      {
        id: str(p.id) || crypto.randomUUID(),
        date: str(p.date),
        asset: str(p.asset),
        platform: str(p.platform),
        totalPaidEur: num(p.totalPaidEur),
        feesEur: num(p.feesEur),
        quantity: num(p.quantity),
        unitPriceEur: num(p.unitPriceEur),
        note: str(p.note),
      },
    ]
  })

  return { version: 1, purchases }
}
