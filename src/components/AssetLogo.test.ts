import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { POPULAR_ASSETS } from '../lib/assets'
import { AssetLogo } from './AssetLogo'

/**
 * Le rendu est vérifié sur le HTML produit, sans navigateur : `renderToStaticMarkup`
 * suffit, et évite d'installer un DOM pour trois assertions. Les éléments sont
 * construits avec `createElement` parce que le fichier est un `.ts` — le JSX vit dans
 * les composants, pas dans les tests.
 */
const render = (asset: string) => renderToStaticMarkup(createElement(AssetLogo, { asset }))

describe('AssetLogo', () => {
  // Une crypto ajoutée au top 10 sans son logo passerait inaperçue : elle s'afficherait
  // avec la pastille d'initiale des cryptos inconnues, ce qui ne casse rien mais trahit
  // un oubli.
  it('dessine un logo pour chaque crypto proposée par le formulaire', () => {
    for (const { ticker } of POPULAR_ASSETS) {
      expect(render(ticker), ticker).toContain('<svg')
    }
  })

  it('reconnaît une crypto quelle que soit la casse et les espaces', () => {
    expect(render(' btc ')).toBe(render('BTC'))
  })

  it('replie une crypto inconnue sur son initiale', () => {
    const markup = render('PEPE')
    expect(markup).not.toContain('<svg')
    expect(markup).toContain('>P<')
  })

  // Un ticker vide ne devrait pas exister — mais il ne doit surtout pas faire tomber
  // le tableau qui l'affiche.
  it('affiche un point d’interrogation plutôt que rien', () => {
    expect(render('  ')).toContain('>?<')
  })
})
