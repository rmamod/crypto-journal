/** Arrondi décimal sans les surprises du binaire flottant (0.1 + 0.2, etc.). */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON * Math.sign(value)) * factor) / factor
}

/** Montants en euros : 2 décimales. */
export const roundEur = (value: number) => roundTo(value, 2)

/** Quantités de crypto : 8 décimales (le satoshi est à 1e-8). */
export const roundQty = (value: number) => roundTo(value, 8)

/**
 * Parse un nombre saisi à la française ou à l'anglaise.
 *
 * Accepte "1 234,56", "1234.56", "1.234,56", "1,234.56", les espaces
 * insécables du pavé numérique macOS et le symbole €.
 * Retourne `null` si la saisie n'est pas un nombre — l'appelant décide quoi
 * en faire, on ne veut pas d'un `NaN` qui se propage silencieusement.
 */
export function parseNumber(input: string): number | null {
  const cleaned = input
    .replace(/[\s  €]/g, '')
    .replace(/^\+/, '')
    .trim()
  if (cleaned === '') return null

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  let normalized: string
  if (lastComma === -1 && lastDot === -1) {
    normalized = cleaned
  } else if (lastComma > lastDot) {
    // La virgule est le séparateur décimal : "1.234,56" -> "1234.56"
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    // Le point est le séparateur décimal : "1,234.56" -> "1234.56"
    normalized = cleaned.replace(/,/g, '')
  }

  if (!/^-?\d*\.?\d*$/.test(normalized) || normalized === '.' || normalized === '-') {
    return null
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatEur(value: number): string {
  return eurFormatter.format(Number.isFinite(value) ? value : 0)
}

/** Cours unitaire : 2 décimales suffisent pour le BTC, mais pas pour une shitcoin à 0,000012 €. */
export function formatUnitPrice(value: number): string {
  if (!Number.isFinite(value) || value === 0) return formatEur(0)
  const decimals = Math.abs(value) >= 1 ? 2 : 8
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Quantité : jusqu'à 8 décimales, sans zéros inutiles en fin. */
export function formatQty(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value)
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
