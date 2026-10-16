# Design

## Context

Voir `proposal.md` (Why) pour la motivation. État actuel du dépôt, vérifié :

- Angular **21.2** généré par `ng new`, composants **standalone**, `provideRouter` déjà branché dans `src/app/app.config.ts`.
- `src/app/app.routes.ts` est **vide** (`export const routes: Routes = []`), aucun service, aucun modèle, aucun guard.
- TypeScript en **strict** (`strict`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates`) — voir `tsconfig.json`.
- Tests via **Vitest** (`ng test`, `vitest` et `jsdom` déjà en `devDependencies`) ; `src/app/app.spec.ts` existe et doit rester vert.
- Aucun backend, aucune dépendance HTTP (`provideHttpClient` est absent).
- `openspec/` ne contient **aucune** spécification existante : les dix capacités créées par ce changement sont toutes nouvelles.
- `angular.json` est modifié localement par rapport au dépôt ; ce changement n'a pas à intervenir sur cette modification.

Contrainte structurante : toutes les capacités partagent un même jeu de données local, avec des règles croisées (commande ↔ stock ↔ livraison). Le design privilégie donc une source de vérité unique et des écritures atomiques.

## Goals / Non-Goals

**Goals**

- Une architecture par domaine fonctionnel (un dossier par capacité) avec une couche `core` pour les modèles, la persistance, les guards et les services métier partagés.
- Une persistance locale à support interchangeable (interface de stockage), pour préparer un remplacement par une API sans toucher aux écrans ni aux règles.
- Des règles métier isolées dans des services testables indépendamment du DOM (stock, transitions de statut, calcul des frais, permissions).
- Des tables de transitions de statut explicites et uniques, implémentées au même endroit et vérifiées par des tests unitaires.
- Des montants en FCFA entiers (aucun flottant) et un affichage `fr-CI` / `XOF`.

**Non-Goals**

- Pas de backend, pas d'API, pas de paiement, pas de temps réel, pas de synchronisation multi-navigateurs ou multi-utilisateurs.
- Pas d'upload de fichiers (aucun serveur) : l'image d'un produit est une URL ou une image de substitution fournie localement.
- Pas de sécurité de production : l'authentification et les contrôles d'accès sont des simulations pédagogiques assumées.
- Pas de déploiement Vercel ni de publication GitHub dans ce changement.
- Pas de SSR / prérendu.

## Decisions

### D1 — Organisation des dossiers par domaine

```
src/app/
  core/
    models/            # types et enums métier (User, Product, Order, Delivery, statuts)
    persistence/       # StorageAdapter, LocalStorageAdapter, InMemoryAdapter (tests), schéma et version
    data/              # catalogue de données de démonstration (seed)
    services/          # AuthService, CatalogueService, CartService, OrderService,
                       # DeliveryService, DashboardService, AdminService, MoneyService
    guards/            # authGuard, roleGuard, compteActifGuard
    permissions/       # matrice rôle -> action (source unique des droits)
  features/
    home/ auth/ catalog/ cart/ orders/ deliveries/ dashboard/ admin/ aide/
  shared/              # composants d'interface, pipes (montantFcfa), boutons d'état vide
  app.routes.ts        # routes avec chargement paresseux par feature et guards
```

Chaque feature est chargée paresseusement (`loadChildren`/`loadComponent`). Les services de `core/features` sont fournis à la racine.

*Alternative écartée* : un unique `NgModule` par feature et un `SharedModule` — inutile en Angular 21 standalone et plus verbeux.

### D2 — Source de vérité unique et écritures atomiques

Tout l'état métier vit dans **un document racine unique** `agrimarket.v1` :

```
{
  "schemaVersion": 1,
  "meta": { "initialized": true, "seedVersion": 1, "revision": 42 },
  "users": [...], "products": [...], "orders": [...], "deliveries": [...],
  "carts": { "<acheteurId>": { "items": [{ "produitId", "quantite" }], "majLe": "..." } },
  "session": { "userId": "...", "role": "...", "ouvertLe": "..." }
}
```

Une opération métier compose le nouvel état complet **en mémoire** puis l'écrit en un seul `setItem` : la création d'une commande décrémente le stock, crée la commande et vide le panier dans la **même** écriture. Aucune commande sans décrément de stock ni l'inverse n'est possible, ce qui satisfait le critère d'atomicité de `local-persistence`.

*Alternatives écartées* : une clé par collection (écritures partielles → incohérences possibles entre commande et stock) ; IndexedDB (complexité non justifiée pour un jeu de démonstration).

*Conséquences assumées* : réécriture complète du document à chaque changement (acceptable sous ~1 Mo) ; pas de fusion automatique entre onglets (la dernière écriture gagne).

### D3 — Support de stockage interchangeable

```ts
interface StorageAdapter {
  read(): string | null;
  write(snapshot: string): void;
  clear(): void;
}
```

`LocalStorageAdapter` en production, `InMemoryAdapter` pour les tests unitaires et de parcours. Les services ne connaissent que `PersistenceService`, qui expose des lectures typées et une méthode `transaction(mutator)` garantissant le « compose puis écris » de D2. Aucun composant n'accède à `localStorage` directement (contrainte de `local-persistence`, vérifiable en substituant l'adaptateur).

### D4 — Modèles TypeScript

Montants en entiers FCFA.

```ts
type Role = 'ADMIN' | 'PRODUCTEUR' | 'ACHETEUR' | 'LIVREUR';
type Categorie = 'CEREALES' | 'LEGUMES' | 'FRUITS' | 'TUBERCULES' | 'LEGUMINEUSES' | 'TRANSFORMES';
type Unite = 'KG' | 'SAC' | 'TONNE' | 'LITRE' | 'PIECE' | 'BOTTE' | 'REGIME';

interface Utilisateur {
  id: string; nom: string; email: string;          // email = identifiant unique, non modifiable
  empreinteMotDePasse: string; sel: string;        // jamais le mot de passe en clair
  role: Role; telephone?: string; localisation: string;
  actif: boolean; dateCreation: string;            // ISO 8601
}

interface Produit {
  id: string; producteurId: string; nom: string; description: string;
  categorie: Categorie; prix: number; unite: Unite; quantiteDisponible: number;
  localisation: string; imageUrl: string; actif: boolean; dateCreation: string;
  moderation?: { motif: string; parAdminId: string; le: string };
}

interface LigneCommande {
  produitId: string; nomProduit: string; unite: Unite;   // instantané (snapshot)
  quantite: number; prixUnitaire: number; sousTotal: number;
}

interface Commande {
  id: string; reference: string;                          // CMD-AAAAMMJJ-XXXX
  acheteurId: string; producteurId: string;
  lignes: LigneCommande[];
  montantProduits: number; fraisLivraison: number; montantTotal: number;
  adresseLivraison: string; statut: StatutCommande;
  dateCreation: string; historique: EvenementCommande[];
}

interface EvenementCommande {
  le: string; statutPrecedent: StatutCommande | null; statut: StatutCommande;
  acteurId: string; commentaire?: string;
}

interface Livraison {
  id: string; reference: string;                          // LIV-AAAAMMJJ-XXXX
  commandeId: string; commandeReference: string;
  livreurId: string | null; adresseDestination: string; statut: StatutLivraison;
  dateCreation: string; dateAffectation: string | null; dateLivraison: string | null;
  commentaire: string; historique: EvenementLivraison[];
}

interface EvenementLivraison {
  le: string; ancienStatut: StatutLivraison; nouveauStatut: StatutLivraison;
  acteurId: string; commentaire?: string;
}

interface Panier { acheteurId: string; items: { produitId: string; quantite: number }[]; majLe: string; }
```

Règles de modèle : un produit est identifié par `producteurId` (Module D) ; une commande porte **un seul** `producteurId` (Module F) ; une livraison référence une commande par `commandeId` + `commandeReference` (Module G) ; une commande peut avoir plusieurs livraisons au fil du temps mais **une seule active** (ni `LIVREE` ni `ECHEC`).

### D5 — Transitions de statut

Statuts de commande : `EN_ATTENTE`, `CONFIRMEE`, `EN_PREPARATION`, `PRETE`, `EN_LIVRAISON`, `LIVREE`, `ANNULEE`.

| Statut courant | Acteur → nouveau statut | Condition |
|---|---|---|
| EN_ATTENTE | PRODUCTEUR → CONFIRMEE | — |
| EN_ATTENTE | ACHETEUR, PRODUCTEUR, ADMIN → ANNULEE | à l'écriture : restitue le stock |
| CONFIRMEE | PRODUCTEUR → EN_PREPARATION | — |
| CONFIRMEE | ACHETEUR, PRODUCTEUR, ADMIN → ANNULEE | restitue le stock |
| EN_PREPARATION | PRODUCTEUR → PRETE | — |
| EN_PREPARATION | ADMIN → ANNULEE | restitue le stock |
| PRETE | système → EN_LIVRAISON | déclenché par l'affectation d'un livreur (D6) |
| PRETE | ADMIN → ANNULEE | restitue le stock |
| EN_LIVRAISON | système → LIVREE | déclenché par la livraison `LIVREE` |
| EN_LIVRAISON | système → PRETE | déclenché par la livraison `ECHEC` |
| EN_LIVRAISON | ADMIN → ANNULEE | livraison active → `ECHEC` + commentaire, stock restitué |
| LIVREE | — | état final |
| ANNULEE | — | état final |

Statuts de livraison : `EN_ATTENTE`, `ASSIGNEE`, `EN_COURS`, `LIVREE`, `ECHEC`.

| Statut courant | Acteur → nouveau statut | Condition |
|---|---|---|
| EN_ATTENTE | ADMIN → ASSIGNEE | commande au statut PRETE, livreur actif de rôle LIVREUR |
| ASSIGNEE | LIVREUR attribué → EN_COURS | — |
| ASSIGNEE | LIVREUR attribué → ECHEC | commentaire obligatoire |
| EN_COURS | LIVREUR attribué → LIVREE | renseigne `dateLivraison` |
| EN_COURS | LIVREUR attribué → ECHEC | commentaire obligatoire |
| LIVREE / ECHEC | — | états finaux |

Transitions interdites : toute paire absente des tables ; chaque refus renvoie la liste des transitions possibles depuis le statut courant (exigence `order-management`).

### D6 — Effets croisés commande ↔ livraison

- Création d'une livraison : possible si `statut ∈ {CONFIRMEE, EN_PREPARATION, PRETE}` **et** aucune livraison active pour la commande. La livraison naît `EN_ATTENTE`.
- Affectation (livreur actif, commande `PRETE`) : livraison `ASSIGNEE`, `dateAffectation` renseignée, **commande → `EN_LIVRAISON`**.
- Livraison `LIVREE` : **commande → `LIVREE`**.
- Livraison `ECHEC` : **commande → `PRETE`** (la commande redevient éligible à une nouvelle livraison ; la livraison échouée reste dans l'historique).
- Annulation administrative d'une commande avec livraison active : livraison → `ECHEC` avec commentaire `« commande annulée »`, puis commande → `ANNULEE`.

Ces couplages sont implémentés dans `OrderService`/`DeliveryService` au travers de la même transaction (D2), jamais par des écrans qui écriraient deux fois.

### D7 — Règle des frais de livraison (hypothèse à valider)

Les frais sont calculés, jamais saisis, et **par producteur** (une commande = un producteur) :

```
fraisLivraison(producteur) = FORFAIT_BASE + SUPPLEMENT_ZONE(zoneDuProducteur(produit.localisation))

FORFAIT_BASE = 1 000 FCFA
SUPPLEMENT_ZONE : Abidjan = 500 ; villes secondaires (Bouaké, Yamoussoukro, San-Pédro,
                  Korhogo, Daloa, Man, Gagnoa) = 1 000 ; autres localisations = 1 500
```

Résultat : 1 500 / 2 000 / 2 500 FCFA. Les constantes vivent dans un fichier de configuration (`core/config.ts`) pour être ajustées sans toucher aux règles. Le panier affiche les frais par groupe producteur puis la somme (exigence `shopping-cart`).

*Alternative écartée* : forfait unique (ignore la localisation, pourtant exigée comme filtre et information produit).

### D8 — Éclatement du panier multi-producteurs (hypothèse à valider)

Le panier regroupe les lignes par producteur. À la validation, l'application crée **une commande par producteur** dans une seule transaction, puis affiche un récapitulatif des commandes créées (référence, producteur, montant). Le stock est décrémenté ligne à ligne.

*Alternative écartée* : bloquer la validation si le panier mélange deux producteurs — plus simple mais dégrade l'expérience d'achat.

### D9 — Stock : réservation à la création, restitution à l'annulation

`quantiteDisponible` est décrémenté **à la création** de la commande (le produit est réservé à l'acheteur) et restitué **exactement une fois** à l'annulation. Les transitions de préparation/expédition ne touchent pas au stock. Le producteur ne peut pas réduire sa quantité sous la somme des quantités de ses commandes non livrées ni annulées (exigence `product-catalog`).

*Alternative écartée* : décrémenter à la confirmation du producteur — plus fidèle à un stock « physique », mais laisse deux acheteurs réserver la même unité et complique le contrôle de disponibilité du panier.

### D10 — Authentification et empreinte de mot de passe

- L'inscription propose `PRODUCTEUR`, `ACHETEUR`, `LIVREUR` ; le rôle `ADMIN` n'est jamais auto-attribuable (seul le compte de démonstration l'est).
- Le mot de passe n'est **jamais** stocké en clair : `empreinteMotDePasse = SHA-256(sel + motDePasse)` via `crypto.subtle.digest`, avec un `sel` aléatoire par compte (`crypto.getRandomValues`).
- Les messages d'erreur de connexion sont génériques (pas d'énumération d'adresses).
- Assumé et documenté : SHA-256 salé reste **insuffisant en production** (pas de KDF lent type Argon2/bcrypt, pas de serveur) ; c'est une simulation pédagogique. Les pages d'inscription, de connexion et de mentions l'indiquent explicitement.

### D11 — Permissions, guards et session

- `core/permissions/permissions.ts` définit une matrice `role -> actions autorisées` (source unique, réutilisée par les guards, les boutons et les tests).
- `authGuard` (session valide) + `roleGuard(roles[])` sur les routes de feature, plus `compteActifGuard` qui vérifie `actif` **à chaque navigation** (exigence `access-control` sur le compte désactivé).
- La navigation s'adapte au rôle depuis un `AuthService` exposant un signal `utilisateurCourant`.
- Limite assumée : ces contrôles sont côté client et contournables en modifiant le stockage local (scénario documenté dans `access-control`).

### D12 — État et réactivité

Services `providedIn: 'root'` exposant des **signals** (`computed` pour les indicateurs) ; pas de `NgRx` (sur-dimensionné pour la V1). Les formulaires utilisent les **Reactive Forms** avec validateurs synchrones (email, longueurs, nombres positifs, catégorie/unite dans l'énumération).

### D13 — Calcul des indicateurs

`DashboardService` produit des `computed` à partir des signals de données ; aucune constante d'affichage. « Évolution des commandes » = comptage par jour de `dateCreation` sur une fenêtre glissante de 14 jours, séries présentées sous forme de liste ou de barres simples (pas de librairie de graphiques). « Montant des ventes » = somme des `montantTotal` des commandes du producteur non `ANNULEE`.

### D14 — Données de démonstration

`core/data/seed.ts` construit un état cohérent : 1 administration, 2 producteurs, 2 acheteurs, 2 livreurs, 8 produits couvrant les 6 catégories, 3 commandes à des statuts différents et 2 livraisons (une `ASSIGNEE`, une `LIVREE`), avec des stocks cohérents avec ces commandes. Les identifiants sont stables (lisibles, ex. `usr_admin`, `prd_riz_01`) pour des tests déterministes ; les années des références sont calculées à partir de la date courante. Les comptes de démonstration utilisent des mots de passe connus affichés sur la page de connexion, mais stockés sous forme d'empreinte.

### D15 — Images sans backend

`imageUrl` accepte une URL absolue ou un chemin d'asset local. Le dépôt fournit un petit jeu d'images de substitution sous `public/produits/` et une image générique pour les cas manquants ; en cas d'échec de chargement, un `onerror` bascule vers l'image générique (état d'erreur visible, non bloquant).

### D16 — Références lisibles

`CMD-AAAAMMJJ-XXXX` et `LIV-AAAAMMJJ-XXXX`, où `XXXX` est un compteur aléatoire à 4 chiffres régénéré tant que la référence existe déjà dans le jeu local (unicité garantie, vérifiée par test unitaire).

## Risks / Trade-offs

- **Document racine réécrit intégralement** → Simple et atomique mais coûteux en taille ; mitigation : jeu de données de démonstration restreint, corbeille à images distantes, et `revision` pour détecter les écritures concurrentes entre onglets.
- **Aucune synchronisation entre onglets/utilisateurs/appareils** → Limite assumée de la V1 ; mitigation : message explicite dans l'aide et dans `local-persistence`.
- **Authentification non sécurisée (SHA-256 salé, côté client)** → Risque pédagogique ; mitigation : jamais de mot de passe en clair, mention non ambiguë sur les écrans concernés, et un `TODO` de remplacement par une vérification serveur.
- **Guards contournables** → Risque assumé ; mitigation : contrôles aussi dans les services métier (défense en profondeur côté client) + scénario documentant la limite.
- **Éclatement du panier multi-producteurs** → Peut surprendre l'acheteur (plusieurs commandes et frais) ; mitigation : regroupement visible par producteur dès le panier, confirmation explicite des commandes créées. Hypothèse à valider (voir Open Questions).
- **Règle des frais de livraison inventée** → Valeurs arbitraires ; mitigation : constantes centralisées et affichage détaillé par producteur ; à faire valider par l'enseignant.
- **Fuseaux horaires / dates locales** → Risque de comptage d'évolution décalé ; mitigation : horodatage ISO stocké, regroupement par jour sur la date locale calculée au moment de la lecture.
- **Pas d'upload d'image** → Un producteur réel ne peut pas publier de photo ; mitigation : champ URL + galerie d'images fournies, documenté comme limite de la V1.
- **Quota `localStorage`** → Risque de saturation ; mitigation : gestion d'erreur d'écriture explicite (exigence `local-persistence`) et document de taille maîtrisée.

## Migration Plan

- Changement **additif** : le dépôt ne contient aucune fonctionnalité métier et `app.routes.ts` est vide ; il n'y a donc **pas de migration de données**.
- Le nouveau schéma local est marqué `schemaVersion: 1` ; toute donnée locale antérieure ou d'une version inconnue est ignorée avec avertissement et remplacée par le jeu de démonstration (voir `local-persistence`).
- Retour arrière : le changement est livré sur une branche/dépôt local ; l'abandon consiste à supprimer les fichiers ajoutés et la clé locale `agrimarket.v1`. Aucune donnée serveur n'est concernée.
- Déploiement Vercel et publication GitHub : **hors périmètre**, à décider après le développement et les tests.

## Open Questions

- Les montants des frais de livraison (1 000 FCFA de base + 1 500/2 000/2 500 FCFA selon la zone) sont une hypothèse : faut-il les remplacer par un barème imposé par le cahier des charges ou par l'enseignant ? Aucun impact sur la structure des spécifications (les montants ne sont pas des exigences), seulement sur `core/config.ts`.
- Un même compte doit-il pouvoir cumuler plusieurs rôles (par exemple producteur **et** acheteur) ? Hypothèse retenue : **un rôle par compte**, modifiable par l'administrateur. Le changement serait local (type `Role` → `Role[]`) mais impacte les guards, le catalogue et les tableaux de bord.
- Faut-il prévoir un moyen de saisir des images locales (glisser-déposer) sans backend ? Hypothèse retenue : non pour la V1 (champ URL + images fournies).
