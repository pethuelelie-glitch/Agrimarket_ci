# Persistance locale (AgriMarket CI — V1)

Ce document décrit le contrat de la couche de persistance, le format du document
racine, la stratégie d'atomicité et la procédure de substitution par une API.
Le code correspondant se trouve dans `src/app/core/persistence/`.

## 1. Contrat de la couche

| Élément                                            | Rôle                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `StorageAdapter` (`storage-adapter.ts`)            | Interface unique `read() / write() / clear()`. Aucun composant n'accède au stockage en dehors de cette interface. |
| `LocalStorageAdapter` (`local-storage-adapter.ts`) | Implémentation par défaut : `localStorage` du navigateur, sous la clé `agrimarket.v1`.                            |
| `InMemoryAdapter` (`in-memory-adapter.ts`)         | Implémentation de test : stockage en mémoire, capacité à simuler un échec d'écriture (`echecEcriture`).           |
| `STORAGE_ADAPTER`                                  | Jeton d'injection. Par défaut `LocalStorageAdapter` ; les tests fournissent un `InMemoryAdapter`.                 |
| `PersistenceService` (`persistence.service.ts`)    | Seule porte d'entrée des données : expose `etat` (signal lecture seule) et `transaction()`.                       |

Règles :

1. **Aucun composant ni service métier ne lit ou n'écrit `localStorage` directement.**
   Toute lecture passe par `PersistenceService`, toute écriture par `transaction()`.
2. Les données métier sont lues dans `PersistenceService.etat()`, un `Signal` en
   lecture seule : les écrans se recalculent automatiquement après chaque écriture.
3. Les erreurs de stockage ne sont jamais levées vers l'écran : elles sont
   converties en un avertissement accessible via `PersistenceService.avertissement()`.

## 2. Format du document racine

Clé de stockage : **`agrimarket.v1`** (`CLE_STOCKAGE` dans `core/config.ts`).
Format : JSON, une seule valeur par clé.

```jsonc
{
  "schemaVersion": 1, // version du schéma (SCHEMA_VERSION)
  "meta": {
    "initialized": true, // les données de démonstration sont créées
    "seedVersion": 1, // version du jeu de démonstration
    "revision": 12, // compteur d'écritures
  },
  "users": [/* Utilisateur[] */],
  "products": [/* Produit[] */],
  "orders": [/* Commande[] */],
  "deliveries": [/* Livraison[] */],
  "carts": {/* Record<acheteurId, Panier> */},
  "session": null, // { userId, role, ouvertLe } | null
}
```

Tous les montants sont des **entiers de FCFA**. Toutes les dates sont des chaînes
ISO 8601. Les noms de champs de cette structure sont ceux des modèles de
`src/app/core/models/`.

### Gestion de la lecture

| Situation                           | Comportement                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Clé absente ou vide                 | État vide, aucun avertissement.                                                         |
| JSON illisible / structure invalide | Avertissement, stockage nettoyé, état vide, puis amorçage des données de démonstration. |
| `schemaVersion` inconnue            | Les données ne sont **pas** interprétées : avertissement, nettoyage, état vide.         |
| `localStorage` inaccessible         | Avertissement, l'application démarre sur un état vide.                                  |
| Écriture impossible (quota…)        | L'état mémoire est conservé pour ne pas perdre la saisie, un avertissement est affiché. |

## 3. Stratégie d'atomicité

`PersistenceService.transaction(mutateur)` est le **seul** mécanisme d'écriture :

1. l'état courant est **cloné** (`structuredClone`) ;
2. le `mutateur` modifie ce brouillon (aucun effet tant qu'il n'a pas rendu la main) ;
3. `meta.revision` est incrémentée ;
4. le nouvel état est publié dans le signal ;
5. l'état complet est sérialisé et écrit **en un seul** `setItem`.

Conséquences :

- Une opération métier qui touche plusieurs entités (création d'une commande +
  décrément du stock + vidage du panier, affectation d'une livraison + changement
  de statut de la commande) est réalisée dans **une seule** `transaction`, donc
  avec **une seule** écriture : impossible d'obtenir un état intermédiaire incohérent.
- Aucun composant ne prépare d'écriture par fragments ; toute écriture produit un
  document racine complet et valide.
- En cas d'échec d'écriture, l'état mémoire reste celui de l'application (saisie
  conservée pour la session) et l'utilisateur est averti.

## 4. Substitution par une API

Pour brancher un vrai backend, il n'y a **qu'une seule interface à changer** :
`StorageAdapter`.

```ts
export class ApiStorageAdapter implements StorageAdapter {
  async read(): Promise<string | null> {
    /* GET /api/state  */
  }
  async write(snapshot: string): Promise<void> {
    /* PUT /api/state */
  }
  async clear(): Promise<void> {
    /* DELETE /api/state */
  }
}
```

Étapes concrètes :

1. Créer `src/app/core/persistence/api-storage-adapter.ts` implémentant
   `StorageAdapter`.
2. Remplacer le fournisseur du jeton `STORAGE_ADAPTER` (fourniture par défaut dans
   `storage-adapter.ts`, ou fournisseur dans `app.config.ts`) par l'adaptateur API.
3. Si l'API est asynchrone, adapter la signature de `StorageAdapter` (couleur
   locale : `Promise<string | null>`) puis rendre `PersistenceService.charger()`
   asynchrone. **Les services métier ne changent pas** : ils ne connaissent que
   `PersistenceService.transaction()`.
4. Déplacer la vérification de la `schemaVersion` côté serveur si le document
   racine devient une charge utile réseau.
5. Déplacer la validation d'autorisation (rôles, propriété des commandes) **côté
   serveur** : jusqu'ici elle n'est que côté client (voir `access-control` et
   `docs/limites-v1.md`).

Aucun autre fichier (composant, service métier, règle de calcul) n'a besoin d'être
modifié : c'est précisément le but de cette abstraction.
