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

/**
 * Teintes des pastilles de ticker (voir `AssetBadge`).
 *
 * Ni rouge ni rose : ces deux couleurs signalent déjà l'erreur et la suppression
 * dans cette app, une crypto qui tomberait dessus se lirait comme un problème.
 *
 * Les classes sont écrites en toutes lettres parce que Tailwind lit le code source
 * pour savoir quoi générer : une classe assemblée à l'exécution n'existerait pas
 * dans la feuille de style finale.
 */
const ASSET_TONES: readonly string[] = [
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
]

/**
 * Les quelques cryptos dont la couleur est trop identifiable pour être tirée au sort.
 * Tout le reste passe par le hachage ci-dessous, y compris ce qui arrive d'un CSV :
 * une table exhaustive serait à maintenir, le hachage ne l'est jamais.
 */
const PINNED_TONES: Record<string, number> = {
  BTC: 0, // ambre
  ETH: 6, // indigo
  USDT: 2, // émeraude
  // Cyan et non violet : `violet-800` et l'`indigo-800` d'ETH sont deux voisins de la
  // même famille, indiscernables côte à côte dans le tableau.
  SOL: 4, // cyan
}

/**
 * Teinte d'un ticker. Déterministe : la même crypto garde sa couleur d'une ligne à
 * l'autre et d'une session à l'autre — c'est toute l'utilité de la pastille.
 * Les collisions sont assumées, il y a bien plus de tickers que de teintes.
 */
export function assetTone(asset: string): string {
  const key = asset.trim().toUpperCase()
  const pinned = PINNED_TONES[key]
  if (pinned !== undefined) return ASSET_TONES[pinned]

  let hash = 0
  for (const char of key) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % ASSET_TONES.length
  return ASSET_TONES[hash]
}
