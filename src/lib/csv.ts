import type { Purchase } from '../types'
import { parseNumber, roundEur, roundQty, roundTo } from './money'
import { newId } from './purchase'

export const CSV_COLUMNS = [
  'date',
  'asset',
  'platform',
  'totalPaidEur',
  'feesEur',
  'quantity',
  'unitPriceEur',
  'note',
] as const

/** BOM : sans lui, Excel FR affiche « CoinbaseÂ â€” compte perso ». */
const BOM = '﻿'

function escapeCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(purchases: Purchase[]): string {
  const lines = [CSV_COLUMNS.join(',')]
  for (const p of purchases) {
    lines.push(
      [
        p.date,
        escapeCell(p.asset),
        escapeCell(p.platform),
        String(p.totalPaidEur),
        String(p.feesEur),
        String(p.quantity),
        String(p.unitPriceEur),
        escapeCell(p.note ?? ''),
      ].join(','),
    )
  }
  return BOM + lines.join('\n') + '\n'
}

/**
 * Parseur RFC 4180 minimal : guillemets, guillemets doublés, champs multi-lignes,
 * séparateur `,` ou `;` (les exports français utilisent le point-virgule).
 */
export function parseCsvRows(text: string): string[][] {
  const input = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const delimiter = detectDelimiter(input)

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function detectDelimiter(input: string): ',' | ';' {
  const firstLine = input.slice(0, input.indexOf('\n') === -1 ? undefined : input.indexOf('\n'))
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

export interface CsvImportResult {
  purchases: Purchase[]
  /** Lignes rejetées, avec leur numéro (1-indexé, en-tête comprise) et la raison. */
  rejected: { line: number; reason: string }[]
}

/**
 * Import tolérant : une ligne invalide est signalée et ignorée, elle ne fait pas
 * échouer tout le fichier. L'appelant affiche le bilan avant de valider.
 */
export function parseCsv(text: string): CsvImportResult {
  const rows = parseCsvRows(text)
  const rejected: CsvImportResult['rejected'] = []
  const purchases: Purchase[] = []

  if (rows.length === 0) {
    return { purchases, rejected: [{ line: 0, reason: 'Fichier vide.' }] }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const index = (name: string) => header.indexOf(name.toLowerCase())

  const iDate = index('date')
  const iAsset = index('asset')
  const iPlatform = index('platform')
  const iTotal = index('totalPaidEur')
  const iFees = index('feesEur')
  const iQty = index('quantity')
  const iPrice = index('unitPriceEur')
  const iNote = index('note')

  const missing = [
    iDate === -1 && 'date',
    iAsset === -1 && 'asset',
    iTotal === -1 && 'totalPaidEur',
    iQty === -1 && 'quantity',
  ].filter(Boolean)

  if (missing.length > 0) {
    return {
      purchases,
      rejected: [{ line: 1, reason: `Colonnes manquantes dans l'en-tête : ${missing.join(', ')}.` }],
    }
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const line = r + 1
    const cell = (i: number) => (i >= 0 && i < row.length ? row[i].trim() : '')

    // Une case date vide est acceptée : l'app autorise un achat sans date, donc un
    // export doit pouvoir se réimporter tel quel. Une date écrite mais illisible
    // reste une erreur, elle.
    const rawDate = cell(iDate)
    const date = rawDate === '' ? '' : normalizeDate(rawDate)
    if (date === null) {
      rejected.push({ line, reason: `Date illisible : « ${rawDate} ».` })
      continue
    }

    const asset = cell(iAsset).toUpperCase()
    if (!asset) {
      rejected.push({ line, reason: 'Crypto manquante.' })
      continue
    }

    const totalPaidEur = parseNumber(cell(iTotal))
    const quantity = parseNumber(cell(iQty))
    const feesEur = iFees === -1 ? 0 : (parseNumber(cell(iFees)) ?? 0)

    if (totalPaidEur === null || !(totalPaidEur > 0)) {
      rejected.push({ line, reason: `Montant total invalide : « ${cell(iTotal)} ».` })
      continue
    }
    if (quantity === null || !(quantity > 0)) {
      rejected.push({ line, reason: `Quantité invalide : « ${cell(iQty)} ».` })
      continue
    }
    if (feesEur > totalPaidEur) {
      rejected.push({ line, reason: 'Les frais dépassent le montant total débité.' })
      continue
    }

    // Le cours est reconstituable : s'il manque, on le recalcule plutôt que de rejeter.
    const parsedPrice = iPrice === -1 ? null : parseNumber(cell(iPrice))
    const unitPriceEur =
      parsedPrice !== null && parsedPrice > 0
        ? parsedPrice
        : roundTo((totalPaidEur - feesEur) / quantity, 8)

    purchases.push({
      id: newId(),
      date,
      asset,
      platform: cell(iPlatform),
      totalPaidEur: roundEur(totalPaidEur),
      feesEur: roundEur(feesEur),
      quantity: roundQty(quantity),
      unitPriceEur,
      note: cell(iNote),
    })
  }

  return { purchases, rejected }
}

/** Accepte `YYYY-MM-DD` et `DD/MM/YYYY` (ce que recrache Excel FR). */
function normalizeDate(input: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (iso) return input

  const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input)
  if (fr) {
    const [, d, m, y] = fr
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}
