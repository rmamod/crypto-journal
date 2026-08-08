import { useMemo, useState } from 'react'
import type { Purchase } from '../types'
import { formatDate, formatEur, formatQty, formatUnitPrice } from '../lib/money'
import { distinctValues } from '../lib/aggregate'

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
    return purchases
      .filter((p) => (asset ? p.asset.toUpperCase() === asset.toUpperCase() : true))
      .filter((p) => (platform ? p.platform === platform : true))
      .slice()
      .sort((a, b) => (a.date === b.date ? a.asset.localeCompare(b.asset) : b.date.localeCompare(a.date)))
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
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums">{formatDate(p.date)}</td>
                  <td className="px-4 py-2 font-semibold">{p.asset}</td>
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
                      <>
                        <button
                          onClick={() => {
                            onDelete(p.id)
                            setConfirming(null)
                          }}
                          className="mr-2 text-xs font-medium text-red-600 underline dark:text-red-400"
                        >
                          Confirmer
                        </button>
                        <button onClick={() => setConfirming(null)} className="text-xs text-slate-500 underline">
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onEdit(p)} className="mr-3 text-xs text-slate-600 underline dark:text-slate-400">
                          Modifier
                        </button>
                        <button onClick={() => setConfirming(p.id)} className="text-xs text-slate-600 underline dark:text-slate-400">
                          Supprimer
                        </button>
                      </>
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
