/**
 * Les plateformes d'achat les plus courantes, proposées dans le champ « Plateforme ».
 *
 * Même parti pris que pour les cryptos (voir `assets.ts`) : liste **statique, écrite à
 * la main**, aucune API interrogée — le projet s'interdit toute dépendance chargée à
 * l'exécution, c'est ce qui protège le token GitHub stocké dans le `localStorage`.
 *
 * Top 10 par volume au comptant, relevé en **août 2026**. Le classement mondial n'est
 * pas le classement français : si Bitpanda, Bitvavo ou Bitstamp te servent plus que
 * MEXC ou Gate.io, remplace-les ici, c'est le seul endroit à toucher.
 */
export const POPULAR_PLATFORMS: readonly string[] = [
  'Binance',
  'Coinbase',
  'Kraken',
  'Bybit',
  'OKX',
  'Bitget',
  'KuCoin',
  'Crypto.com',
  'Gate.io',
  'MEXC',
  // Hors top 10, ajouté explicitement : Revolut X sert de porte d'entrée à beaucoup
  // de comptes européens déjà ouverts chez Revolut.
  'Revolut X',
]

/**
 * Choix de la liste déroulante « Plateforme » : d'abord les plateformes déjà saisies —
 * les plus probables pour cet utilisateur — puis le reste de la liste.
 *
 * Comme elle contient TOUTES les plateformes déjà présentes dans le journal, un achat
 * en cours de modification y retrouve toujours la sienne.
 *
 * Le dédoublonnage ignore la casse, pour ne pas proposer « kraken » et « Kraken » côte
 * à côte. C'est l'orthographe déjà présente dans le journal qui l'emporte : elle est
 * dans les données, la remplacer scinderait en deux l'historique d'une même plateforme.
 */
export function platformOptions(used: string[]): string[] {
  const seen = new Set<string>()
  const options: string[] = []

  for (const raw of used) {
    const platform = raw.trim()
    if (!platform) continue
    const key = platform.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    options.push(platform)
  }

  for (const platform of POPULAR_PLATFORMS) {
    const key = platform.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    options.push(platform)
  }

  return options
}
