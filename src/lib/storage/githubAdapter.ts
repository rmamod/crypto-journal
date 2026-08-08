import type { GitHubConfig, PurchasesFile } from '../../types'
import { emptyFile } from '../../types'
import { base64ToUtf8, utf8ToBase64 } from '../base64'
import { parsePurchasesFile, SyncError, type StorageAdapter } from './types'

const API = 'https://api.github.com'

interface ContentsResponse {
  content: string
  sha: string
}

/**
 * Lecture/écriture du JSON dans un repo GitHub privé, via l'API Contents
 * appelée directement depuis le navigateur (api.github.com autorise le CORS).
 *
 * Le `sha` du fichier distant est mémorisé au chargement et renvoyé à chaque
 * écriture : c'est ce qui permet à GitHub de refuser une écriture concurrente
 * (409) au lieu d'écraser silencieusement des données saisies ailleurs.
 */
export function createGitHubAdapter(config: GitHubConfig): StorageAdapter {
  let sha: string | null = null

  const url = `${API}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(
    config.repo,
  )}/contents/${config.path.split('/').map(encodeURIComponent).join('/')}`

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }

  async function request(init: RequestInit & { method: string }): Promise<Response> {
    try {
      return await fetch(url, { ...init, headers: { ...headers, ...init.headers } })
    } catch {
      throw new SyncError('network', 'Impossible de joindre GitHub. Vérifie ta connexion.')
    }
  }

  return {
    kind: 'github',

    async load(): Promise<PurchasesFile> {
      // `cache: no-store` : sans ça le navigateur peut resservir une réponse périmée
      // et on repartirait d'un sha obsolète, garantissant un 409 à la sauvegarde.
      const response = await request({ method: 'GET', cache: 'no-store' })

      if (response.status === 404) {
        // Premier lancement : le fichier n'existe pas encore, il sera créé au premier achat.
        sha = null
        return emptyFile()
      }
      if (!response.ok) throw await toSyncError(response)

      const body = (await response.json()) as ContentsResponse
      sha = body.sha
      return parsePurchasesFile(JSON.parse(base64ToUtf8(body.content)))
    },

    async save(file: PurchasesFile, message: string): Promise<void> {
      const response = await request({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          content: utf8ToBase64(JSON.stringify(file, null, 2) + '\n'),
          // `sha` absent = création du fichier ; présent = mise à jour vérifiée.
          ...(sha ? { sha } : {}),
        }),
      })

      if (!response.ok) throw await toSyncError(response)

      const body = (await response.json()) as { content?: { sha?: string } }
      sha = body.content?.sha ?? null
    },
  }
}

async function toSyncError(response: Response): Promise<SyncError> {
  const detail = await response
    .json()
    .then((b: { message?: string }) => b.message ?? '')
    .catch(() => '')

  switch (response.status) {
    case 401:
      return new SyncError(
        'unauthorized',
        'Token GitHub expiré ou révoqué — à renouveler dans les réglages.',
      )
    case 403:
      // GitHub renvoie aussi 403 en cas de dépassement de quota (5 000 req/h).
      return new SyncError(
        'forbidden',
        detail.toLowerCase().includes('rate limit')
          ? 'Quota GitHub dépassé. Réessaie dans quelques minutes.'
          : "Le token n'a pas les droits « Contents: Read & Write » sur ce repo.",
      )
    case 404:
      return new SyncError(
        'not_found',
        "Repo ou chemin introuvable. Vérifie owner/repo/chemin — un token sans accès au repo privé donne aussi cette erreur.",
      )
    case 409:
    case 422:
      return new SyncError(
        'conflict',
        'Le fichier a été modifié ailleurs. Recharge les données, puis réapplique ta saisie.',
      )
    default:
      return new SyncError('unknown', `Erreur GitHub ${response.status}${detail ? ` : ${detail}` : ''}`)
  }
}
