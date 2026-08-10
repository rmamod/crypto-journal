import { useMemo, useState } from 'react'
import type { Purchase } from '../types'
import { UNSET_DATE, dateSuffix, formatDate, formatEur, formatQty, formatUnitPrice } from '../lib/money'
import { distinctValues, sortForJournal } from '../lib/aggregate'
import { AssetBadge } from './AssetBadge'

interface Props {
  purchases: Purchase[]
  onEdit: (purchase: Purchase) => void
  onDelete: (id: string) => void
  children?: React.ReactNode
}

export function PurchaseTable({ purchases, onEdit, onDelete, children }: Props) {
  const [asset, setAsset] = useState('')
  const [platform, setPlatform] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)

  const assets = distinctValues(purchases, 'asset')
  const platforms = distinctValues(purchases, 'platform')

  const rows = useMemo(() => {
    const filtered = purchases
      .filter((p) => (asset ? p.asset.toUpperCase() === asset.toUpperCase() : true))
      .filter((p) => (platform ? p.platform === platform : true))
    return sortForJournal(filtered)
  }, [purchases, asset, platform])

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Journal <span className="text-sm font-normal text-slate-500">({rows.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {assets.length > 1 && (
            <select value={asset} onChange={(e) => setAsset(e.target.value)} className={selectClass}>
              <option value="">Toutes les cryptos</option>
              {assets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}
          {platforms.length > 1 && (
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
              <option value="">Toutes les plateformes</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
          {children}
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {purchases.length === 0 ? 'Aucun achat enregistré.' : 'Aucun achat ne correspond aux filtres.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Crypto</th>
                <th className="px-4 py-2 font-medium">Plateforme</th>
                <th className="px-4 py-2 text-right font-medium">Total débité</th>
                <th className="px-4 py-2 text-right font-medium">dont frais</th>
                <th className="px-4 py-2 text-right font-medium">Quantité</th>
                <th className="px-4 py-2 text-right font-medium">Cours</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums">
                    {p.date ? (
                      formatDate(p.date)
                    ) : (
                      <span className="italic text-slate-400 dark:text-slate-500">{UNSET_DATE}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <AssetBadge asset={p.asset} />
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    {p.platform}
                    {p.note && <span className="ml-2 text-xs text-slate-400">— {p.note}</span>}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{formatEur(p.totalPaidEur)}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-500 dark:text-slate-400">{formatEur(p.feesEur)}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatQty(p.quantity)}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-500 dark:text-slate-400">
                    {formatUnitPrice(p.unitPriceEur)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    {confirming === p.id ? (
                      // La confirmation reste en toutes lettres : une icône seule ne demande
                      // pas « es-tu sûr ? », et c'est l'action irréversible.
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(p.id)
                            setConfirming(null)
                          }}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label={`Modifier l'achat ${p.asset} ${dateSuffix(p.date)}`} onClick={() => onEdit(p)}>
                          <PencilIcon />
                        </IconButton>
                        <IconButton
                          label={`Supprimer l'achat ${p.asset} ${dateSuffix(p.date)}`}
                          onClick={() => setConfirming(p.id)}
                          danger
                        >
                          <TrashIcon />
                        </IconButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'

/**
 * Bouton d'action d'une ligne : icône seule, libellé porté par `aria-label` et `title`.
 * La colonne est dense, et une icône universelle (crayon, corbeille) y tient mieux
 * qu'un mot — mais elle doit rester annoncée aux lecteurs d'écran, d'où le libellé
 * complet qui rappelle DE QUEL achat il s'agit.
 */
function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 text-slate-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        danger
          ? 'hover:bg-red-50 hover:text-red-600 focus-visible:outline-red-600 dark:hover:bg-red-950 dark:hover:text-red-400'
          : 'hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

/** Icônes dessinées ici : aucune librairie chargée à l'exécution (cf. README, règle 2). */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-4 w-4',
  'aria-hidden': true,
} as const

function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}
