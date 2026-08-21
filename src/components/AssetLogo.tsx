import { useId } from 'react'
import { assetTone } from '../lib/assets'

/**
 * Les logos des cryptos, **dessinés ici en SVG**.
 *
 * Aucune image n'est chargée depuis un CDN de logos : ce serait renoncer à la règle 2
 * du README (aucune dépendance chargée à l'exécution), qui est ce qui rend acceptable
 * de garder un token GitHub dans le `localStorage`. Un logo est un fichier comme un
 * autre — s'il vient d'ailleurs, il vient avec une requête sortante et un tiers à qui
 * faire confiance.
 *
 * Ce sont donc des **redessins simplifiés**, pensés pour être lus à 20 px : les marques
 * sont reconnaissables à leur couleur et à leur silhouette, pas aux détails qui
 * disparaissent à cette taille. Une crypto absente de cette table retombe sur une
 * pastille colorée (voir `AssetLogo`), ce qui arrive dès qu'un import CSV apporte un
 * ticker inconnu.
 */

/**
 * Le fond du disque porte la couleur de marque, jamais le thème. L'anneau très discret
 * est là pour les logos presque noirs (XRP, SOL), qui se fondraient sinon dans le fond
 * sombre.
 */
const discProps = {
  viewBox: '0 0 24 24',
  className: 'h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15',
  'aria-hidden': true,
} as const

function BitcoinLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#f7931a" />
      {/* Le ₿ est penché dans la marque officielle : sans l'inclinaison, on lit un B. */}
      <g
        transform="rotate(-14 12 12)"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 6.6v11" />
        <path d="M9 6.6h3.6a2.75 2.75 0 0 1 0 5.5H9" />
        <path d="M9 12.1h4.2a2.75 2.75 0 0 1 0 5.5H9" />
        <path d="M11.2 4.3v2.3M14 4.3v2.3M11.2 17.6v2.3M14 17.6v2.3" />
      </g>
    </svg>
  )
}

function EthereumLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#627eea" />
      {/* Quatre facettes seulement : les six du logo officiel se confondent à 20 px. */}
      <g fill="#fff">
        <path d="M12 3.5 6.4 12.05 12 15.4z" />
        <path d="M12 3.5 17.6 12.05 12 15.4z" fillOpacity=".62" />
        <path d="M12 16.7 6.4 13.3 12 20.5z" />
        <path d="M12 16.7 17.6 13.3 12 20.5z" fillOpacity=".62" />
      </g>
    </svg>
  )
}

function TetherLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#26a17b" />
      {/* L'ellipse laisse un mince jour sous la barre : collée, elle ne se lit plus
          comme un ₮ mais comme un T empâté. */}
      <g fill="#fff">
        <path d="M5.2 4.6h13.6v3.2h-5.2V19.2h-3.2V7.8H5.2z" />
        <ellipse cx="12" cy="10.9" rx="6.2" ry="2.5" />
      </g>
    </svg>
  )
}

function XrpLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#23292f" />
      <g fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6.6 6.6 5.4 5.4 5.4-5.4" />
        <path d="m6.6 17.4 5.4-5.4 5.4 5.4" />
      </g>
    </svg>
  )
}

function BnbLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#f3ba2f" />
      {/* Quatre losanges autour d'un cinquième : des carrés tournés de 45°. */}
      <g fill="#fff" transform="rotate(45 12 12)">
        <rect x="10.2" y="3.7" width="3.6" height="3.6" rx=".5" />
        <rect x="10.2" y="16.7" width="3.6" height="3.6" rx=".5" />
        <rect x="3.7" y="10.2" width="3.6" height="3.6" rx=".5" />
        <rect x="16.7" y="10.2" width="3.6" height="3.6" rx=".5" />
        <rect x="9.6" y="9.6" width="4.8" height="4.8" rx=".6" />
      </g>
    </svg>
  )
}

function SolanaLogo() {
  // Le dégradé est l'identité de la marque, et un `id` de dégradé doit être unique dans
  // toute la page : deux lignes SOL dans le tableau en font deux instances.
  const gradient = useId()
  return (
    <svg {...discProps}>
      <defs>
        <linearGradient id={gradient} x1="4" y1="19" x2="20" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14f195" />
          <stop offset="1" stopColor="#9945ff" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="#0b0b12" />
      {/* Barre du milieu inclinée à l'inverse des deux autres : c'est ce qui fait le logo. */}
      <g fill={`url(#${gradient})`}>
        <path d="M7.4 5.4H20l-3.4 3.4H4z" />
        <path d="M4 10.3h12.6L20 13.7H7.4z" />
        <path d="M7.4 15.2H20l-3.4 3.4H4z" />
      </g>
    </svg>
  )
}

function UsdCoinLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#2775ca" />
      <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="7.6" />
        <path d="M14.1 9.7c-.4-.9-1.2-1.4-2.2-1.4-1.3 0-2.3.8-2.3 2 0 1 .8 1.7 2.3 2 1.6.3 2.5 1 2.5 2.2 0 1.2-1.1 2.1-2.5 2.1-1 0-1.9-.5-2.3-1.4" />
        <path d="M12 6.8v1.5M12 15.9v1.5" />
      </g>
    </svg>
  )
}

function DogecoinLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#c2a633" />
      {/* Un Ð : le D barré du Dogecoin. Le contre-poinçon est évidé par `evenodd`. */}
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M9.4 5.2h2.9a6.8 6.8 0 0 1 0 13.6H9.4v-5.4H6.6v-2.8h2.8zm2.9 3h-.4v7.6h.4a3.8 3.8 0 0 0 0-7.6z"
      />
    </svg>
  )
}

function CardanoLogo() {
  return (
    <svg {...discProps}>
      <circle cx="12" cy="12" r="12" fill="#0033ad" />
      {/* La constellation de Cardano, réduite à ce qui reste visible : un noyau, six
          satellites, six points lointains. */}
      <g fill="#fff">
        <circle cx="12" cy="12" r="1.8" />
        <g>
          <circle cx="12" cy="6.4" r="1.2" />
          <circle cx="12" cy="17.6" r="1.2" />
          <circle cx="7.2" cy="9.2" r="1.2" />
          <circle cx="16.8" cy="9.2" r="1.2" />
          <circle cx="7.2" cy="14.8" r="1.2" />
          <circle cx="16.8" cy="14.8" r="1.2" />
        </g>
        <g fillOpacity=".85">
          <circle cx="12" cy="3.2" r=".9" />
          <circle cx="12" cy="20.8" r=".9" />
          <circle cx="4.4" cy="7.6" r=".9" />
          <circle cx="19.6" cy="7.6" r=".9" />
          <circle cx="4.4" cy="16.4" r=".9" />
          <circle cx="19.6" cy="16.4" r=".9" />
        </g>
      </g>
    </svg>
  )
}

function TronLogo() {
  return (
    <svg {...discProps}>
      {/* Le rouge veut dire « erreur » partout ailleurs dans l'app — mais un disque de
          marque n'est pas un état, et le rouge EST le logo de Tron. */}
      <circle cx="12" cy="12" r="12" fill="#ef0027" />
      <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M4.6 6.2 19.4 8.7 12.3 19.4z" />
        <path d="M10.4 7.2 12.3 19.4" />
      </g>
    </svg>
  )
}

/**
 * Table ticker → logo. Elle suit `POPULAR_ASSETS` (`src/lib/assets.ts`) : une crypto
 * ajoutée là-bas veut son logo ici, et un test le vérifie.
 *
 * Elle n'est pas exportée — `AssetLogo` est la seule porte d'entrée, ce qui garantit
 * qu'un ticker sans logo obtient toujours son repli au lieu d'un trou dans le tableau.
 */
const ASSET_LOGOS: Record<string, () => React.ReactElement> = {
  BTC: BitcoinLogo,
  ETH: EthereumLogo,
  USDT: TetherLogo,
  XRP: XrpLogo,
  BNB: BnbLogo,
  SOL: SolanaLogo,
  USDC: UsdCoinLogo,
  DOGE: DogecoinLogo,
  ADA: CardanoLogo,
  TRX: TronLogo,
}

/**
 * Le logo d'une crypto, ou son initiale sur une pastille teintée quand il n'y en a pas.
 *
 * Le repli garde exactement la taille et la forme ronde d'un logo, pour que la colonne
 * reste alignée quoi qu'elle contienne. Sa couleur reste déterministe : c'est ce qui
 * permet de reconnaître d'un coup d'œil une crypto arrivée par un import CSV, faute de
 * logo dessiné pour elle.
 */
export function AssetLogo({ asset }: { asset: string }) {
  const ticker = asset.trim().toUpperCase()
  const Logo = ASSET_LOGOS[ticker]
  if (Logo) return <Logo />

  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold ${assetTone(ticker)}`}
    >
      {[...ticker][0] ?? '?'}
    </span>
  )
}
