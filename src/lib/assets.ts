/**
 * Les cryptos les plus courantes, proposées dans le champ « Crypto » du formulaire.
 *
 * La liste est **statique et écrite à la main** : aucune API n'est interrogée pour la
 * construire. C'est délibéré — le projet s'interdit toute dépendance chargée à
 * l'exécution (c'est ce qui réduit la surface XSS autour du token GitHub), et les
 * données en direct sont hors périmètre. Un classement par capitalisation bouge
 * lentement : le rafraîchir à la main de temps en temps suffit.
 *
 * Classement par capitalisation, relevé en **août 2026**. Le champ reste libre :
 * cette liste est une commodité de saisie, jamais une contrainte.
 */

export interface AssetOption {
  /** Ticker en majuscules, ex. « BTC ». */
  ticker: string
  /** Nom complet, quand il est connu. Sert de libellé dans la datalist. */
  name?: string
}

export const POPULAR_ASSETS: readonly AssetOption[] = [
  { ticker: 'BTC', name: 'Bitcoin' },
  { ticker: 'ETH', name: 'Ethereum' },
  { ticker: 'USDT', name: 'Tether' },
  { ticker: 'XRP', name: 'XRP' },
  { ticker: 'BNB', name: 'BNB' },
  { ticker: 'SOL', name: 'Solana' },
  { ticker: 'USDC', name: 'USD Coin' },
  { ticker: 'DOGE', name: 'Dogecoin' },
  { ticker: 'ADA', name: 'Cardano' },
  { ticker: 'TRX', name: 'Tron' },
]

/**
 * Choix de la liste déroulante « Crypto » : d'abord les cryptos déjà saisies — les
 * plus probables pour cet utilisateur — puis le reste du top 10.
 *
 * Comme la liste contient TOUTES les cryptos déjà présentes dans le journal, un achat
 * en cours de modification y retrouve toujours la sienne : la liste déroulante ne peut
 * pas perdre une valeur existante.
 *
 * Le dédoublonnage se fait sur le ticker en majuscules, sinon un `btc` importé d'un
 * CSV bancal ferait apparaître deux fois Bitcoin dans la liste.
 */
export function assetOptions(used: string[]): AssetOption[] {
  const names = new Map(POPULAR_ASSETS.map((a) => [a.ticker, a.name]))
  const seen = new Set<string>()
  const options: AssetOption[] = []

  for (const raw of used) {
    const ticker = raw.trim().toUpperCase()
    if (!ticker || seen.has(ticker)) continue
    seen.add(ticker)
    options.push({ ticker, name: names.get(ticker) })
  }

  for (const asset of POPULAR_ASSETS) {
    if (seen.has(asset.ticker)) continue
    seen.add(asset.ticker)
    options.push(asset)
  }

  return options
}

/**
 * Libellé affiché dans la liste déroulante. Le nom complet lève l'ambiguïté des
 * tickers opaques ; sans nom connu — une crypto arrivée par un import CSV — on affiche
 * le ticker seul.
 */
export function assetLabel(option: AssetOption): string {
  return option.name ? `${option.ticker} — ${option.name}` : option.ticker
}
