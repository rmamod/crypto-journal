import type { SyncStatus } from '../types'

interface Props {
  connected: boolean
  status: SyncStatus
  message: string | null
  onReload: () => void
  onOpenSettings: () => void
}

const labels: Record<SyncStatus, string> = {
  idle: 'Prêt',
  loading: 'Chargement…',
  saving: 'Enregistrement…',
  saved: 'Enregistré sur GitHub',
  error: 'Erreur',
}

export function SyncBar({ connected, status, message, onReload, onOpenSettings }: Props) {
  const isError = status === 'error'

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${
        isError
          ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isError ? 'bg-red-500' : connected ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          aria-hidden
        />
        <span>
          {connected ? labels[status] : 'Local uniquement — non synchronisé'}
          {message && <span className="ml-1">· {message}</span>}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {connected && (
          <button onClick={onReload} className="text-xs underline">
            Recharger
          </button>
        )}
        <button onClick={onOpenSettings} className="text-xs underline">
          {connected ? 'Réglages' : 'Configurer la synchronisation'}
        </button>
      </div>
    </div>
  )
}
