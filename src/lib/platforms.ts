/**
 * Les plateformes d'achat les plus courantes, proposées dans le champ « Plateforme ».
 *
 * Même parti pris que pour les cryptos (voir `assets.ts`) : liste **statique, écrite à
 * la main**, aucune API interrogée — le projet s'interdit toute dépendance chargée à
 * l'exécution, c'est ce qui protège le token GitHub stocké dans le `localStorage`.
 *
 * Le critère n'est PAS le volume mondial, c'est **l'utilité pour un journal en euros** :
 * virement SEPA, paires en EUR, service ouvert depuis l'Europe. C'est ce qui écarte les
 * plateformes offshore pourtant énormes en volume (MEXC, Gate.io, KuCoin) : y acheter
 * en euros suppose de passer par un stablecoin, donc ce n'est pas le premier achat que
 * ce journal enregistre. Classement indicatif, relevé en **août 2026**.
 *
 * Retirer une plateforme d'ici ne perd rien : `platformOptions` propose toujours celles
 * déjà présentes dans le journal.
 */
export const POPULAR_PLATFORMS: readonly string[] = [
  'Binance',
  'Coinbase',
  'Kraken',
  'Bitvavo',
  'Bitpanda',
  'Bitstamp',
  'Crypto.com',
  'Coinhouse',
  'OKX',
  'Bybit',
  // Hors classement, ajouté explicitement : Revolut X sert de porte d'entrée à beaucoup
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
