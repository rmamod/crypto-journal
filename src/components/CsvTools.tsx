import { useRef, useState } from 'react'
import type { Purchase } from '../types'
import { parseCsv, toCsv, type CsvImportResult } from '../lib/csv'
import { todayIso } from '../lib/money'

interface Props {
  purchases: Purchase[]
  onImport: (purchases: Purchase[], mode: 'append' | 'replace') => void
}

export function CsvTools({ purchases, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<CsvImportResult | null>(null)

  function handleExport() {
    // Le BOM est déjà dans la chaîne ; le type `text/csv` suffit à déclencher le téléchargement.
    const blob = new Blob([toCsv(purchases)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `achats-crypto-${todayIso()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setPreview(parseCsv(await file.text()))
    // Permet de réimporter le même fichier deux fois de suite.
    event.target.value = ''
  }

  function confirm(mode: 'append' | 'replace') {
    if (preview) onImport(preview.purchases, mode)
    setPreview(null)
  }

  return (
    <>
      <button onClick={handleExport} disabled={purchases.length === 0} className={buttonClass}>
        Exporter CSV
      </button>
      <button onClick={() => fileInput.current?.click()} className={buttonClass}>
        Importer CSV
      </button>
      <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Aperçu de l'import</h3>

            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              <strong className="font-mono">{preview.purchases.length}</strong> ligne
              {preview.purchases.length > 1 ? 's' : ''} valide{preview.purchases.length > 1 ? 's' : ''}
              {preview.rejected.length > 0 && (
                <>
                  , <strong className="font-mono">{preview.rejected.length}</strong> ignorée
                  {preview.rejected.length > 1 ? 's' : ''}
                </>
              )}
              .
            </p>

            {preview.rejected.length > 0 && (
              <ul className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {preview.rejected.map((r, i) => (
                  <li key={i}>
                    Ligne {r.line} : {r.reason}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => setPreview(null)} className={buttonClass}>
                Annuler
              </button>
              <button
                onClick={() => confirm('replace')}
                disabled={preview.purchases.length === 0}
                className={`${buttonClass} text-red-700 dark:text-red-400`}
              >
                Remplacer tout ({purchases.length} → {preview.purchases.length})
              </button>
              <button
                onClick={() => confirm('append')}
                disabled={preview.purchases.length === 0}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
              >
                Ajouter aux achats existants
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const buttonClass =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
