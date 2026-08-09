import { useEffect, useMemo, useState } from 'react'
import type { Purchase } from '../types'
import { assetLabel, assetOptions } from '../lib/assets'
import { parseNumber, todayIso } from '../lib/money'
import { computeQuantity, computeUnitPrice, newId, validatePurchase } from '../lib/purchase'

interface Props {
  /** Achat en cours d'édition, ou `null` pour une création. */
  editing: Purchase | null
  assets: string[]
  platforms: string[]
  onSubmit: (purchase: Purchase) => void
  onCancelEdit: () => void
}

/** Champ recalculé automatiquement à partir des trois autres. */
type AutoField = 'quantity' | 'unitPriceEur' | null

interface FormState {
  date: string
  asset: string
  platform: string
  totalPaidEur: string
  feesEur: string
  quantity: string
  unitPriceEur: string
  note: string
}

const blank = (): FormState => ({
  date: todayIso(),
  asset: '',
  platform: '',
  totalPaidEur: '',
  feesEur: '',
  quantity: '',
  unitPriceEur: '',
  note: '',
})

const fromPurchase = (p: Purchase): FormState => ({
  date: p.date,
  asset: p.asset,
  platform: p.platform,
  totalPaidEur: String(p.totalPaidEur),
  feesEur: String(p.feesEur),
  quantity: String(p.quantity),
  unitPriceEur: String(p.unitPriceEur),
  note: p.note,
})

export function PurchaseForm({ editing, assets, platforms, onSubmit, onCancelEdit }: Props) {
  const [form, setForm] = useState<FormState>(blank)
  // À la création on connaît en général le cours : c'est la quantité qui se calcule.
  // En édition on ne recalcule rien tant que l'utilisateur n'a rien touché.
  const [auto, setAuto] = useState<AutoField>('quantity')
  const [submitted, setSubmitted] = useState(false)
  // Cryptos déjà saisies en tête, complétées par les plus courantes.
  const assetChoices = useMemo(() => assetOptions(assets), [assets])

  useEffect(() => {
    setForm(editing ? fromPurchase(editing) : blank())
    setAuto(editing ? null : 'quantity')
    setSubmitted(false)
  }, [editing])

  function update(patch: Partial<FormState>, nextAuto?: AutoField) {
    setForm((current) => {
      const merged = { ...current, ...patch }
      const target = nextAuto !== undefined ? nextAuto : auto
      if (nextAuto !== undefined) setAuto(nextAuto)

      const total = parseNumber(merged.totalPaidEur)
      const fees = parseNumber(merged.feesEur) ?? 0

      if (total !== null) {
        if (target === 'quantity') {
          const price = parseNumber(merged.unitPriceEur)
          const qty = price === null ? null : computeQuantity(total, fees, price)
          if (qty !== null) merged.quantity = String(qty)
        } else if (target === 'unitPriceEur') {
          const qty = parseNumber(merged.quantity)
          const price = qty === null ? null : computeUnitPrice(total, fees, qty)
          if (price !== null) merged.unitPriceEur = String(price)
        }
      }

      return merged
    })
  }

  const candidate: Purchase = {
    id: editing?.id ?? 'draft',
    date: form.date,
    asset: form.asset.trim().toUpperCase(),
    platform: form.platform.trim(),
    totalPaidEur: parseNumber(form.totalPaidEur) ?? 0,
    feesEur: parseNumber(form.feesEur) ?? 0,
    quantity: parseNumber(form.quantity) ?? 0,
    unitPriceEur: parseNumber(form.unitPriceEur) ?? 0,
    note: form.note.trim(),
  }
  const { errors, warnings } = validatePurchase(candidate)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (errors.length > 0) return
    onSubmit({ ...candidate, id: editing?.id ?? newId() })
    if (!editing) {
      // On garde la plateforme et la crypto : on enchaîne souvent plusieurs achats similaires.
      setForm((c) => ({ ...blank(), asset: c.asset, platform: c.platform }))
      setAuto('quantity')
      setSubmitted(false)
    }
  }

  const net = candidate.totalPaidEur - candidate.feesEur

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {editing ? 'Modifier un achat' : 'Nouvel achat'}
        </h2>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="text-sm text-slate-500 underline hover:text-slate-800 dark:hover:text-slate-200">
            Annuler la modification
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Date">
          <input type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} className={inputClass} required />
        </Field>

        <Field label="Crypto">
          <select value={form.asset} onChange={(e) => update({ asset: e.target.value })} className={inputClass}>
            <option value="">— Choisir —</option>
            {assetChoices.map((a) => (
              <option key={a.ticker} value={a.ticker}>
                {assetLabel(a)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Plateforme">
          <input
            list="platforms"
            value={form.platform}
            onChange={(e) => update({ platform: e.target.value })}
            placeholder="Kraken"
            className={inputClass}
            autoComplete="off"
          />
          <datalist id="platforms">
            {platforms.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>

        <Field label="Montant total débité" hint="frais inclus">
          <input
            inputMode="decimal"
            value={form.totalPaidEur}
            onChange={(e) => update({ totalPaidEur: e.target.value })}
            placeholder="500"
            className={`${inputClass} font-mono`}
          />
        </Field>

        <Field label="dont frais">
          <input
            inputMode="decimal"
            value={form.feesEur}
            onChange={(e) => update({ feesEur: e.target.value })}
            placeholder="2,50"
            className={`${inputClass} font-mono`}
          />
        </Field>

        <Field label="Cours EUR / crypto" hint={auto === 'unitPriceEur' ? 'calculé' : undefined}>
          <input
            inputMode="decimal"
            value={form.unitPriceEur}
            onChange={(e) => update({ unitPriceEur: e.target.value }, 'quantity')}
            placeholder="61550,12"
            className={`${inputClass} font-mono ${auto === 'unitPriceEur' ? autoClass : ''}`}
          />
        </Field>

        <Field label="Quantité reçue" hint={auto === 'quantity' ? 'calculée' : undefined}>
          <input
            inputMode="decimal"
            value={form.quantity}
            onChange={(e) => update({ quantity: e.target.value }, 'unitPriceEur')}
            placeholder="0,00808284"
            className={`${inputClass} font-mono ${auto === 'quantity' ? autoClass : ''}`}
          />
        </Field>

        <Field label="Note" hint="facultatif">
          <input value={form.note} onChange={(e) => update({ note: e.target.value })} className={inputClass} />
        </Field>
      </div>

      {net > 0 && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Montant réellement investi : <span className="font-mono font-medium">{net.toFixed(2)} €</span>{' '}
          (total débité moins les frais)
        </p>
      )}

      {submitted && errors.length > 0 && (
        <ul className="mt-3 list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 list-inside list-disc rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {editing ? 'Enregistrer' : 'Ajouter cet achat'}
        </button>
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-300'

const autoClass = 'bg-slate-50 dark:bg-slate-800/60'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">({hint})</span>}
      </span>
      {children}
    </label>
  )
}
