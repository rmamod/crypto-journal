# Suivi des achats crypto

Journal personnel des achats de crypto : type de crypto, montant dépensé, quantité, cours EUR↔crypto,
frais, date et plateforme. Résumé par crypto (prix de revient unitaire) et export/import CSV.

Application statique (aucun serveur), hébergée gratuitement sur GitHub Pages. Les données vivent dans
un fichier JSON d'un **repo GitHub privé séparé**, versionné à chaque modification.

---

## La convention qui gouverne tous les calculs

> **Le montant saisi est le montant TOTAL débité par la plateforme, frais inclus.**

Il en découle :

```
montant réellement investi = montant total − frais
quantité                   = (montant total − frais) / cours
cours                      = (montant total − frais) / quantité
```

Exemple : 500 € débités dont 2,50 € de frais, à un cours de 61 550,12 € →
**0,00808284 BTC** (et non 0,00812346, qui serait le résultat sans déduire les frais).

Le résumé affiche deux prix de revient unitaires, qui répondent à deux questions différentes :

| PRU | Formule | Ce qu'il dit |
|---|---|---|
| **frais inclus** | `Σ montant total / Σ quantité` | ce que la crypto t'a réellement coûté |
| hors frais | `Σ (montant total − frais) / Σ quantité` | le cours moyen que tu as obtenu |

Le montant net n'est jamais stocké, il est toujours recalculé — c'est ce qui garantit qu'il ne peut
pas diverger du montant saisi.

---

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests des calculs, du CSV et de l'encodage
npm run build    # vérification TypeScript + build de production
```

L'app est pleinement utilisable **sans rien configurer** : les données restent alors dans le
`localStorage` du navigateur. La synchronisation GitHub est une couche optionnelle.

---

## Mise en place complète

### 1. Le repo de données (privé)

Crée un repo **privé** — par exemple `crypto-data`. Rien à y mettre : le fichier `purchases.json`
sera créé automatiquement au premier achat enregistré.

### 2. Le token GitHub

**Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**

| Réglage | Valeur |
|---|---|
| Repository access | **Only select repositories** → `crypto-data` |
| Permissions → Repository → **Contents** | **Read and write** |
| Toute autre permission | *laisser sur « No access »* |
| Expiration | **1 an** — note la date ci-dessous |

> **Token expirant le : `____ / ____ / ______`** ← à remplir à la création

**Impérativement un token « fine-grained », jamais un token classique.** Le scope `repo` d'un token
classique donne lecture et écriture sur **tous** les repos du compte ; le token ci-dessus ne peut rien
faire d'autre que lire et écrire des fichiers dans `crypto-data` — il ne peut même pas supprimer ce
repo (cela relèverait de la permission `Administration`, non accordée).

Et comme les données sont dans git, **même un écrasement malveillant se restaure par un `git revert`**.

### 3. Connecter l'app

Dans l'app : **Configurer la synchronisation** → owner, repo, chemin (`purchases.json`) et token →
**Connecter et charger**. Si des achats avaient déjà été saisis en local, ils sont poussés vers le repo
lors de cette première connexion.

### 4. Publier sur GitHub Pages

1. Pousser ce projet dans un repo **public** nommé `crypto-tracker`
   (le nom doit correspondre à `base` dans `vite.config.ts` — sinon tous les assets partent en 404).
2. **Settings → Pages → Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` publie à chaque push sur `main`, après avoir fait passer
   les tests.

Le repo du code est public : c'est la condition pour que Pages soit gratuit, et ce n'est pas un
problème puisque **le code ne contient aucun secret** — le token est saisi à l'exécution.

---

## Sécurité : ce qui rend ce montage acceptable

Le token est stocké dans le `localStorage` du navigateur. Trois conditions le rendent défendable, et
elles doivent être maintenues :

1. **Le token n'est jamais transmis ailleurs qu'à `api.github.com`.**
2. **Aucun script tiers, aucun CDN, aucune dépendance chargée à l'exécution.** Tout le JavaScript
   exécuté est celui de ce repo, ce qui réduit le risque XSS à quasi rien. *Ne pas ajouter de balise
   `<script src="https://…">` ni de police Google Fonts : ce serait renoncer à cette garantie.*
3. **Le token est saisi à l'exécution** : jamais en dur dans le code, jamais dans un `.env` committé,
   **jamais dans une variable préfixée `VITE_`** — Vite inline ces variables en clair dans le bundle.

Si un token est committé par accident, le secret scanning de GitHub le révoque automatiquement.

**Sur un autre appareil** : crée un **second** token dédié, révocable indépendamment, plutôt que de
faire transiter le premier.

---

## Format CSV

En-tête : `date,asset,platform,totalPaidEur,feesEur,quantity,unitPriceEur,note`

- **Export** : virgule comme séparateur, point décimal, BOM UTF-8 (pour qu'Excel FR affiche les accents).
- **Import** : accepte aussi le point-virgule, la virgule décimale et les dates `JJ/MM/AAAA`
  (ce que recrache Excel FR). Le cours peut être omis, il est alors recalculé.
  Les lignes invalides sont listées et ignorées, elles ne font pas échouer le fichier.

---

## Hors périmètre (choix assumé)

Pas de cours en direct ni de plus-value latente, pas de graphiques, pas de suivi des ventes ni de
calcul fiscal. Le format de données reste extensible si ces besoins apparaissent.

Dans la même logique, les cryptos proposées dans le formulaire (top 10 par capitalisation) sont
**écrites en dur** dans `src/lib/assets.ts` — aucune API n'est interrogée, conformément à la règle 2
ci-dessus. La liste se rafraîchit à la main quand le classement a bougé.

Le champ « Crypto » est une **liste déroulante**, sans saisie libre. Elle contient le top 10 plus
toutes les cryptos déjà présentes dans le journal — un achat en cours de modification y retrouve donc
toujours la sienne. Corollaire à connaître : **pour saisir une crypto hors du top 10 pour la première
fois**, il faut l'ajouter à `src/lib/assets.ts`, ou la faire entrer par un import CSV (l'import, lui,
accepte n'importe quel ticker) — elle est ensuite proposée pour toujours.
