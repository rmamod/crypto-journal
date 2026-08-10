import { assetTone } from '../lib/assets'

/**
 * Le ticker sur une pastille arrondie, teintée d'après la crypto.
 *
 * La taille de police ne change pas : c'est le fond coloré qui porte la mise en
 * valeur, pas un grossissement. Le padding vertical reste minimal pour ne pas
 * gonfler la hauteur des lignes du tableau.
 */
export function AssetBadge({ asset }: { asset: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ${assetTone(asset)}`}>
      {asset}
    </span>
  )
}
