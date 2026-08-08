import type { Purchase } from '../types'
import { grandTotal, summarize } from '../lib/aggregate'
import { formatEur, formatQty, formatUnitPrice } from '../lib/money'

export function SummaryTable({ purchases }: { purchases: Purchase[] }) {
  const summaries = summarize(purchases)
  const total = grandTotal(purchases)

  if (summaries.length === 0) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Résumé par crypto</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Le PRU « frais inclus » est ton coût de revient réel ; le PRU « hors frais » est le cours moyen obtenu.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-4 py-2 font-medium">Crypto</th>
              <th className="px-4 py-2 text-right font-medium">Quantité</th>
              <th className="px-4 py-2 text-right font-medium">Total débité</th>
              <th className="px-4 py-2 text-right font-medium">dont frais</th>
              <th className="px-4 py-2 text-right font-medium">PRU frais inclus</th>
              <th className="px-4 py-2 text-right font-medium">PRU hors frais</th>
              <th className="px-4 py-2 text-right font-medium">Achats</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.asset} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100">{s.asset}</td>
                <td className="px-4 py-2 text-right font-mono">{formatQty(s.quantity)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEur(s.totalPaidEur)}</td>
                <td className="px-4 py-2 text-right font-mono text-slate-500 dark:text-slate-400">{formatEur(s.feesEur)}</td>
                <td className="px-4 py-2 text-right font-mono font-semibold">{formatUnitPrice(s.unitCostWithFees)}</td>
                <td className="px-4 py-2 text-right font-mono text-slate-500 dark:text-slate-400">
                  {formatUnitPrice(s.unitCostWithoutFees)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{s.count}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
              <td className="px-4 py-2">Total ({total.assets} crypto{total.assets > 1 ? 's' : ''})</td>
              <td className="px-4 py-2" />
              <td className="px-4 py-2 text-right font-mono">{formatEur(total.totalPaidEur)}</td>
              <td className="px-4 py-2 text-right font-mono text-slate-500 dark:text-slate-400">{formatEur(total.feesEur)}</td>
              <td className="px-4 py-2 text-right text-xs font-normal text-slate-500 dark:text-slate-400" colSpan={2}>
                net investi : <span className="font-mono">{formatEur(total.netInvestedEur)}</span>
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{total.count}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
