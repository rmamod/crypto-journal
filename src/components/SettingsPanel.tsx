import { useState } from 'react'
import type { GitHubConfig } from '../types'

interface Props {
  config: GitHubConfig | null
  onSave: (config: GitHubConfig | null) => void
  onClose: () => void
}

export function SettingsPanel({ config, onSave, onClose }: Props) {
  const [owner, setOwner] = useState(config?.owner ?? '')
  const [repo, setRepo] = useState(config?.repo ?? '')
  const [path, setPath] = useState(config?.path ?? 'purchases.json')
  const [token, setToken] = useState(config?.token ?? '')

  const complete = owner.trim() && repo.trim() && token.trim()

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Synchronisation GitHub</h2>
        <button onClick={onClose} className="text-sm text-slate-500 underline">
          Fermer
        </button>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Les achats sont stockés dans un fichier JSON d'un repo <strong>privé</strong>, versionné à chaque
        modification. Tant que rien n'est configuré ici, l'app fonctionne en local dans ce navigateur.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Propriétaire (owner)</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="ton-pseudo-github" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Repo privé</span>
          <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="crypto-data" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Chemin du fichier</span>
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="purchases.json" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Fine-grained token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_..."
            className={`${inputClass} font-mono`}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <strong className="font-medium text-slate-800 dark:text-slate-200">Le token doit être un « fine-grained »</strong>{' '}
        limité au seul repo ci-dessus, avec la permission <span className="font-mono">Contents: Read and write</span> et
        rien d'autre. Un token classique avec le scope <span className="font-mono">repo</span> donnerait accès à
        l'intégralité de ton compte GitHub. Il est stocké dans ce navigateur uniquement et n'est envoyé qu'à
        <span className="font-mono"> api.github.com</span>.
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => complete && onSave({ owner: owner.trim(), repo: repo.trim(), path: path.trim() || 'purchases.json', token: token.trim() })}
          disabled={!complete}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
        >
          Connecter et charger
        </button>
        {config && (
          <button
            onClick={() => onSave(null)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Déconnecter et effacer le token
          </button>
        )}
      </div>
    </section>
  )
}

const labelClass = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400'
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
