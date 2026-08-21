import { AssetLogo } from './AssetLogo'

/**
 * Le logo de la crypto, suivi de son ticker.
 *
 * Le fond coloré a laissé la place au logo : c'est lui, désormais, qui se reconnaît
 * d'un coup d'œil dans le tableau. Le ticker reste écrit à côté — un logo seul se
 * devine pour BTC, jamais pour les cryptos qu'on possède sans les connaître par cœur,
 * et c'est le ticker que reprennent le CSV et les filtres.
 */
export function AssetBadge({ asset }: { asset: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
      <AssetLogo asset={asset} />
      {asset}
    </span>
  )
}
