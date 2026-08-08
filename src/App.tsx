import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GitHubConfig, Purchase, SyncStatus } from './types'
import { distinctValues } from './lib/aggregate'
import { formatDate } from './lib/money'
import { createGitHubAdapter } from './lib/storage/githubAdapter'
import { readCache, readConfig, writeCache, writeConfig } from './lib/storage/localAdapter'
import { SyncError, type StorageAdapter } from './lib/storage/types'
import { CsvTools } from './components/CsvTools'
import { PurchaseForm } from './components/PurchaseForm'
import { PurchaseTable } from './components/PurchaseTable'
import { SettingsPanel } from './components/SettingsPanel'
import { SummaryTable } from './components/SummaryTable'
import { SyncBar } from './components/SyncBar'

export default function App() {
  const [purchases, setPurchases] = useState<Purchase[]>(() => readCache()?.purchases ?? [])
  const [config, setConfig] = useState<GitHubConfig | null>(() => readConfig())
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const adapter = useMemo<StorageAdapter | null>(
    () => (config ? createGitHubAdapter(config) : null),
    [config],
  )
  // La sauvegarde doit toujours viser l'adaptateur courant, y compris depuis un
  // callback créé avant un changement de configuration.
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter

  const load = useCallback(
    async (target: StorageAdapter, localFallback: Purchase[]) => {
      setStatus('loading')
      setMessage(null)
      try {
        const remote = await target.load()
        // Premier lancement avec des données déjà saisies en local : on les pousse
        // plutôt que de les perdre au profit d'un fichier distant vide.
        if (remote.purchases.length === 0 && localFallback.length > 0) {
          await target.save({ version: 1, purchases: localFallback }, 'data: première synchronisation')
          setPurchases(localFallback)
          setStatus('saved')
          setMessage(`${localFallback.length} achat(s) locaux envoyés`)
          return
        }
        setPurchases(remote.purchases)
        writeCache(remote)
        setStatus('idle')
        setMessage(`${remote.purchases.length} achat(s) chargés`)
      } catch (error) {
        setStatus('error')
        setMessage(toMessage(error))
      }
    },
    [],
  )

  useEffect(() => {
    if (adapter) void load(adapter, readCache()?.purchases ?? [])
  }, [adapter, load])

  /** Applique une mutation : état, cache local, puis GitHub si configuré. */
  const persist = useCallback(async (next: Purchase[], commitMessage: string) => {
    setPurchases(next)
    writeCache({ version: 1, purchases: next })

    const target = adapterRef.current
    if (!target) return

    setStatus('saving')
    setMessage(null)
    try {
      await target.save({ version: 1, purchases: next }, commitMessage)
      setStatus('saved')
    } catch (error) {
      // La saisie reste en mémoire et en cache : on n'efface jamais le travail
      // de l'utilisateur parce que le réseau a échoué.
      setStatus('error')
      setMessage(toMessage(error))
    }
  }, [])

  function handleSubmit(purchase: Purchase) {
    const exists = purchases.some((p) => p.id === purchase.id)
    const next = exists ? purchases.map((p) => (p.id === purchase.id ? purchase : p)) : [...purchases, purchase]
    const verb = exists ? 'modification' : 'ajout'
    void persist(next, `data: ${verb} ${purchase.asset} du ${formatDate(purchase.date)}`)
    setEditing(null)
  }

  function handleDelete(id: string) {
    const removed = purchases.find((p) => p.id === id)
    void persist(
      purchases.filter((p) => p.id !== id),
      `data: suppression ${removed?.asset ?? ''} du ${removed ? formatDate(removed.date) : ''}`.trim(),
    )
    if (editing?.id === id) setEditing(null)
  }

  function handleImport(imported: Purchase[], mode: 'append' | 'replace') {
    const next = mode === 'replace' ? imported : [...purchases, ...imported]
    void persist(next, `data: import CSV (${imported.length} achat(s), mode ${mode === 'replace' ? 'remplacement' : 'ajout'})`)
  }

  function handleSaveConfig(next: GitHubConfig | null) {
    writeConfig(next)
    setConfig(next)
    setShowSettings(false)
    if (!next) {
      setStatus('idle')
      setMessage('Token effacé. Les données restent dans ce navigateur.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <header>
          <h1 className="text-2xl font-bold">Suivi des achats crypto</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Journal personnel. Les montants saisis sont les montants <strong>totaux débités, frais inclus</strong>.
          </p>
        </header>

        <SyncBar
          connected={config !== null}
          status={status}
          message={message}
          onReload={() => adapter && void load(adapter, [])}
          onOpenSettings={() => setShowSettings((v) => !v)}
        />

        {showSettings && (
          <SettingsPanel config={config} onSave={handleSaveConfig} onClose={() => setShowSettings(false)} />
        )}

        <PurchaseForm
          editing={editing}
          assets={distinctValues(purchases, 'asset')}
          platforms={distinctValues(purchases, 'platform')}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />

        <SummaryTable purchases={purchases} />

        <PurchaseTable
          purchases={purchases}
          onEdit={(p) => {
            setEditing(p)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onDelete={handleDelete}
        >
          <CsvTools purchases={purchases} onImport={handleImport} />
        </PurchaseTable>
      </div>
    </div>
  )
}

function toMessage(error: unknown): string {
  if (error instanceof SyncError) return error.message
  if (error instanceof Error) return error.message
  return 'Erreur inconnue.'
}
