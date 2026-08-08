import type { GitHubConfig, PurchasesFile } from '../../types'
import { emptyFile } from '../../types'
import { parsePurchasesFile, type StorageAdapter } from './types'

const DATA_KEY = 'crypto-tracker:data'
const CONFIG_KEY = 'crypto-tracker:github-config'

/**
 * Stockage navigateur. Sert à deux choses :
 *  - mode autonome tant qu'aucun token GitHub n'est configuré ;
 *  - cache local systématique, pour que les données restent lisibles si l'API
 *    GitHub est indisponible.
 */
export const localAdapter: StorageAdapter = {
  kind: 'local',

  async load(): Promise<PurchasesFile> {
    return readCache() ?? emptyFile()
  },

  async save(file: PurchasesFile): Promise<void> {
    writeCache(file)
  },
}

export function readCache(): PurchasesFile | null {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return null
    return parsePurchasesFile(JSON.parse(raw))
  } catch {
    // Un cache corrompu ne doit jamais empêcher l'app de démarrer.
    return null
  }
}

export function writeCache(file: PurchasesFile): void {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(file))
  } catch {
    // Quota dépassé ou navigation privée : le cache est un confort, pas une exigence.
  }
}

/**
 * Le token vit ici, en clair, dans le localStorage.
 *
 * C'est acceptable UNIQUEMENT parce que l'app ne charge aucun script tiers ni CDN
 * (donc pas de vecteur XSS réaliste) et que le token est un fine-grained PAT
 * restreint au seul repo de données. Ne jamais l'écrire ailleurs, ne jamais le
 * mettre dans une variable `VITE_*` : Vite les inline en clair dans le bundle.
 */
export function readConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GitHubConfig>
    if (!parsed.owner || !parsed.repo || !parsed.token) return null
    return {
      owner: parsed.owner,
      repo: parsed.repo,
      path: parsed.path || 'purchases.json',
      token: parsed.token,
    }
  } catch {
    return null
  }
}

export function writeConfig(config: GitHubConfig | null): void {
  if (config === null) {
    localStorage.removeItem(CONFIG_KEY)
    return
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}
