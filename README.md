# AgriMarket CI

**Marketplace agricole ivoirienne** — application web développée en **Angular 21 / TypeScript strict**, **sans backend pour la V1** : toutes les données vivent dans le navigateur (`localStorage`).

Le projet met en relation **producteurs agricoles**, **acheteurs** et **livreurs**, avec une **supervision administrative**. C'est un projet scolaire (L3 Génie Logiciel) qui vise à démontrer des règles métier complètes et testées à partir de données locales uniquement.

> ⚠️ V1 pédagogique : aucun paiement réel, aucune API, aucune synchronisation multi-appareils. L'authentification est une **simulation locale** volontairement non sécurisée pour la production. Voir [`docs/limites-v1.md`](docs/limites-v1.md).

---

## Sommaire

- [1. Le projet en bref](#1-le-projet-en-bref)
- [2. Fonctionnalités](#2-fonctionnalités)
- [3. Comment on en est arrivé là](#3-comment-on-en-est-arrivé-là)
- [4. Architecture et dossiers concernés](#4-architecture-et-dossiers-concernés)
- [5. Démarrer le projet](#5-démarrer-le-projet)
- [6. Comptes de démonstration](#6-comptes-de-démonstration)
- [7. Règles métier clés](#7-règles-métier-clés)
- [8. Routes de l'application](#8-routes-de-lapplication)
- [9. Tests](#9-tests)
- [10. Limites de la V1](#10-limites-de-la-v1)
- [11. État d'avancement et suite](#11-état-davancement-et-suite)

---

## 1. Le projet en bref

| Élément               | Détail                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Nom**               | AgriMarket CI                                                                             |
| **Nature**            | Marketplace de produits agricoles (marché ivoirien)                                       |
| **Framework**         | Angular 21.2 (composants standalone, signals, zoneless)                                   |
| **Langage**           | TypeScript 5.9 en mode `strict` (sans `any`)                                              |
| **Tests**             | Vitest 4 + jsdom 28                                                                       |
| **Backend**           | Aucun — données locales dans `localStorage` (clé `agrimarket.v1`)                         |
| **Persistance**       | Couche centralisée `PersistenceService`, transactionnelle et versionnée                   |
| **Rôles**             | `ADMIN`, `PRODUCTEUR`, `ACHETEUR`, `LIVREUR`                                              |
| **Catégories**        | 6 catégories de produits agricoles                                                        |
| **Statuts commande**  | `EN_ATTENTE`, `CONFIRMEE`, `EN_PREPARATION`, `PRETE`, `EN_LIVRAISON`, `LIVREE`, `ANNULEE` |
| **Statuts livraison** | `EN_ATTENTE`, `ASSIGNEE`, `EN_COURS`, `LIVREE`, `ECHEC`                                   |
| **Hors périmètre**    | Backend/API, paiement réel, déploiement, publication GitHub                               |

---

## 2. Fonctionnalités

### 👤 Visiteur (non connecté)

- **Page d'accueil** : présentation de la marketplace, appels à l'action (Catalogue, Connexion, Inscription) et mise en avant des **6 produits actifs les plus récents**.
- **Catalogue public** : grille responsive des produits actifs uniquement, avec **recherche** (insensible à la casse), **filtres combinables** (catégorie, prix min/max, disponibilité, localisation) et **4 tris** (prix croissant/décroissant, date croissante/décroissante).
- **Fiche produit** : description, prix, unité, quantité, localisation, date, producteur, image de secours en cas d'échec de chargement, détection « produit introuvable ».
- **Inscription / connexion** : formulaires validés (Reactive Forms), messages d'erreur sous chaque champ, liste des comptes de démonstration, mention explicite « authentification locale simulée ».
- **Page d'aide** : documentation des limites du contrôle d'accès côté client.

### 🛒 Acheteur

- **Panier** : ajout avec contrôle de disponibilité (produit inactif, épuisé, quantité supérieure au stock), modification des quantités (plafonnée au stock), suppression d'articles, récapitulatif **regroupé par producteur** avec sous-totaux, montant des produits, **frais de livraison affichés séparément** et total.
- **Validation du panier** : revérification des stocks → création des commandes (une par producteur), décrément du stock, vidage du panier.
- **Mes commandes** : historique antéchronologique, filtres par statut, détail avec historique horodaté ; annulation selon les règles.
- **Suivi de livraison** depuis le détail de commande.
- **Tableau de bord acheteur** : commandes en cours / livrées.

### 🌾 Producteur

- **Espace produits** : création / modification / suppression (avec confirmation), gestion du stock et du statut **actif / inactif**.
- **Commandes reçues** : liste des commandes, transitions de statut autorisées (confirmation, refus, préparation, prête).
- **Tableau de bord producteur** : produits actifs, stock disponible cumulé, commandes reçues, quantités vendues, montant des ventes (hors commandes annulées).

### 🚚 Livreur

- **Mes missions** : livraisons attribuées, groupées par statut ; mises à jour autorisées (`ASSIGNEE → EN_COURS → LIVREE`, ou `ECHEC` avec **commentaire obligatoire**).
- **Tableau de bord livreur** : missions attribuées, en cours, terminées, en échec (limitées aux livraisons attribuées).

### 🛡️ Administrateur

- **Comptes** : consultation (role, statut, recherche), modification (nom, localisation, téléphone, réinitialisation de mot de passe), changement de rôle, **activation/désactivation** avec protections (pas sur son propre compte, pas si aucun administrateur actif ne subsiste).
- **Produits** : modération (désactivation avec **motif tracé**, suppression avec confirmation et refus si commande en cours) ; prix/unité/stock en lecture seule.
- **Commandes** : supervision filtrable (statut, producteur), détail en lecture seule.
- **Livraisons** : vue d'ensemble et **attribution d'un livreur** (avec message « aucun livreur disponible »).
- **Tableau de bord global** : utilisateurs, producteurs, produits actifs, commandes par statut, livraisons en cours/terminées, **évolution des commandes sur 14 jours**.
- **Réinitialisation** des données de démonstration (avec confirmation).

### 🔁 Transverse

- **Navigation adaptée au rôle** (liens et zones visibles selon le profil), **indicateur du nombre d'articles** du panier.
- **Contrôle d'accès côté client** : `authGuard`, `roleGuard(roles[])`, `compteActifGuard` (réévaluation du statut actif à chaque navigation) + masquage/désactivation des actions non autorisées.
- **Persistance robuste** : document racine versionné, amorçage unique des données de démonstration, gestion des données corrompues / schéma inconnu / quota dépassé / session illisible **sans écran blanc**.
- **Formatage** : montants en FCFA (`MontantFcfaPipe`, séparateur de milliers, sans décimales) et dates au format `fr-FR`.

---

## 3. Comment on en est arrivé là

Le projet a été conduit **spec-first** avec **OpenSpec**, avant toute ligne de code métier. La démarche :

1. **Proposition** (`proposal.md`) — le dépôt ne contenait que la coquille Angular générée. Le constat : sans règles écrites, les modules seraient implémentés selon des interprétations divergentes (transitions de statut, permissions par rôle, cohérence stocks/commandes/livraisons). D'où la formalisation des 10 capacités et de leurs critères d'acceptation.
2. **Conception** (`design.md`) — décisions d'architecture **D1 à D16** : persistance transactionnelle (D2/D3), modèles (D4), transitions de commande (D5) et couplage commande↔livraison (D6), frais de livraison (D7), éclatement multi-producteurs (D8), permissions (D11), fenêtre d'évolution (D13), référence de commande (D16), etc.
3. **Spécifications** (`specs/**/spec.md`) — 10 capacités décrites en exigences (`Requirement`) et scénarios (`Scenario`) : `storefront`, `user-auth`, `access-control`, `product-catalog`, `shopping-cart`, `order-management`, `delivery-management`, `dashboard`, `admin-oversight`, `local-persistence`.
4. **Plan de tâches** (`tasks.md`) — 11 groupes, 77 tâches vérifiables, chacune avec sa preuve (test unitaire, test de composant ou vérification manuelle).
5. **Implémentation** — groupes 1 à 11 : fondations (modèles, persistance, données de démo), authentification, rôles/permissions/guards, coquille + accueil, catalogue, panier, commandes, livraisons, tableaux de bord, administration, intégration.
6. **Vérification** — tests unitaires, tests de composant et **tests de parcours** de bout en bout ; `revue.md` assure la couverture des 10 capacités.
7. **Revue fonctionnelle** — hypothèses à valider avec l'enseignant (frais de livraison, éclatement du panier, unicité de rôle par compte).

**Hypothèses retenues** (règles absentes du cahier des charges initial) :

- **D7 — Frais de livraison** : forfait de base `1 000 FCFA` + supplément de zone → **1 500** (Abidjan), **2 000** (villes secondaires), **2 500** (autre).
- **D8 — Panier multi-producteurs** : à la validation, le panier est **scindé en une commande par producteur**.
- **D10 — Sécurité** : un compte a **un seul rôle** ; `ADMIN` n'est **pas auto-inscriptible** ; les mots de passe ne sont **jamais stockés en clair** (empreinte `SHA-256(sel + mot de passe)` via `crypto.subtle`).
- Les artefacts sont rédigés en français, les identifiants de code en anglais.

Ces valeurs sont figées par les tests et détaillées dans `openspec/changes/add-agrimarket-marketplace-v1/revue.md` (§2). La **validation enseignant** de ces trois points (tâche 11.4) reste **en attente**.

L'ensemble des artefacts OpenSpec se trouve dans `openspec/`, et les documents d'accompagnement dans `docs/`.

---

## 4. Architecture et dossiers concernés

### Vue d'ensemble

```
agrimarket-ci/
├─ src/
│  ├─ app/
│  │  ├─ core/                 # Cœur métier (sans UI)
│  │  │  ├─ models/            # Modèles TypeScript (utilisateur, produit, commande, livraison, panier, état)
│  │  │  ├─ persistence/       # Stockage centralisé (StorageAdapter, LocalStorageAdapter, InMemoryAdapter, PersistenceService)
│  │  │  ├─ data/              # Données de démonstration (seed.ts) et amorçage (initialisation.ts)
│  │  │  ├─ services/          # Auth, Catalogue, Panier, Commandes, Livraisons, Tableaux de bord, Admin, Identifiants, Hachage
│  │  │  ├─ guards/            # authGuard, roleGuard, compteActifGuard, redirection du tableau de bord
│  │  │  ├─ permissions/       # Matrice de permissions par rôle
│  │  │  ├─ commandes/         # Transitions + opérations pures des commandes
│  │  │  ├─ livraisons/        # Transitions + opérations pures des livraisons
│  │  │  ├─ catalogue/         # Recherche, filtres, tri, disponibilité
│  │  │  ├─ tableaux/          # Calcul des indicateurs de tableau de bord
│  │  │  ├─ panier/            # Normalisation et résumés du panier
│  │  │  ├─ config.ts          # Constantes métier (clé, schéma, frais de livraison, zones)
│  │  │  ├─ navigation.ts      # Chemins et helpers de routes
│  │  │  └─ resultat.ts        # Types de résultats d'opération
│  │  ├─ features/             # Écrans par domaine
│  │  │  ├─ accueil/  auth/  catalogue/  panier/  produits/
│  │  │  ├─ commandes/  livraisons/  tableaux-de-bord/  admin/
│  │  │  └─ aide/  pas-trouve/
│  │  ├─ shared/               # Composants et pipes réutilisables (produit-carte, carte-indicateur, état vide, montant FCFA…)
│  │  ├─ testing/              # Helpers de test (configurerTestBed, InMemoryAdapter…)
│  │  ├─ integration/          # Tests de parcours de bout en bout (parcours.spec.ts)
│  │  ├─ app.ts / app.html / app.css   # Coquille (en-tête, navigation, pied de page)
│  │  ├─ app.routes.ts         # Toutes les routes (chargement paresseux)
│  │  └─ app.config.ts         # Configuration de l'application
│  ├─ index.html  main.ts  styles.css
├─ docs/
│  ├─ persistence.md           # Contrat de la couche de persistance
│  └─ limites-v1.md            # Limites de la V1 (sans backend)
├─ openspec/
│  ├─ specs/                   # Spécifications consolidées par capacité
│  └─ changes/
│     └─ add-agrimarket-marketplace-v1/
│        ├─ proposal.md  design.md  tasks.md  revue.md
│        └─ specs/**/spec.md   # Delta specs (10 capacités)
├─ public/                     # Ressources statiques (favicon)
├─ angular.json  package.json  tsconfig*.json
└─ README.md
```

### Rôle des dossiers clés

| Dossier / fichier                       | Contenu                                                                                                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/core/models/`                  | Types métier : `Utilisateur`, `Produit`, `LigneCommande`, `Commande`, `Livraison`, `Panier`, enums (`Role`, `Categorie`, `Unite`, `StatutCommande`, `StatutLivraison`) et état global `EtatApplication`. |
| `src/app/core/persistence/`             | **Seule porte d'entrée des données.** `StorageAdapter` (interface), `LocalStorageAdapter`, `InMemoryAdapter` (tests), `PersistenceService` (`etat` en signal lecture seule + `transaction()` atomique).  |
| `src/app/core/services/`                | Logique métier : `AuthService`, `CatalogueService`, `CartService`, `OrderService`, `DeliveryService`, `DashboardService`, `AdminService`, `NotificationsService`, helpers de hachage et d'identifiants.  |
| `src/app/core/guards/` + `permissions/` | Protection des routes et matrice de droits par rôle (documentés comme **contrôle côté client uniquement**).                                                                                              |
| `src/app/core/{commandes,livraisons}/`  | **Source unique de vérité** des transitions de statut + opérations pures réutilisées par les services et l'administration.                                                                               |
| `src/app/features/`                     | Composants d'écran, un dossier par domaine fonctionnel.                                                                                                                                                  |
| `src/app/shared/`                       | Composants/pipes transverses (`produit-carte`, `carte-indicateur`, `repartition-barres`, `etat-vide`, `bouton-ajout-panier`, `deconnexion-bouton`, `pied-de-page`, `montant-fcfa`).                      |
| `src/app/testing/`                      | Helpers de test partagés (exclus du build applicatif).                                                                                                                                                   |
| `src/app/integration/`                  | Tests de parcours (inscription→livraison, cycle producteur, affectation livreur, multi-producteurs, robustesse).                                                                                         |
| `docs/`                                 | Documentation de la persistance et des limites.                                                                                                                                                          |
| `openspec/`                             | Démarche spec-first : proposition, conception, spécifications, tâches, revue.                                                                                                                            |

---

## 5. Démarrer le projet

### Prérequis

- **Node.js** (avec npm) — le projet utilise `npm@11`.
- Aucune base de données, aucun serveur backend.

### Installation

```bash
npm install
```

### Serveur de développement

```bash
npm start          # ou : npx ng serve
```

Ouvrir `http://localhost:4200/`. L'application se recharge automatiquement à chaque modification.

### Build de production

```bash
npm run build      # ou : npx ng build
```

Les artefacts sont générés dans `dist/`.

### Tests

```bash
npm test           # ou : npx ng test --watch=false
```

---

## 6. Comptes de démonstration

Les données de démonstration sont amorcées automatiquement au premier lancement. Les mots de passe sont **affichés volontairement** sur la page de connexion (usage pédagogique uniquement).

| Rôle           | Nom                    | E-mail                         | Mot de passe |
| -------------- | ---------------------- | ------------------------------ | ------------ |
| Administrateur | Aïcha Diomandé         | `admin@agrimarket.ci`          | `Admin1234`  |
| Producteur     | Awa Koné (Abidjan)     | `awa.kone@agrimarket.ci`       | `Produ1234`  |
| Producteur     | Bakary Traoré (Bouaké) | `bakary.traore@agrimarket.ci`  | `Produ1234`  |
| Acheteur       | Koffi Yao              | `koffi.yao@agrimarket.ci`      | `Achete1234` |
| Acheteur       | Adjoua Bamba           | `adjoua.bamba@agrimarket.ci`   | `Achete1234` |
| Livreur        | Ibrahim Diallo         | `ibrahim.diallo@agrimarket.ci` | `Livre1234`  |
| Livreur        | Sery Kouassi           | `sery.kouassi@agrimarket.ci`   | `Livre1234`  |

Le jeu de démonstration contient **8 produits** répartis sur les **6 catégories**, **3 commandes** à statuts différents et **2 livraisons** (`ASSIGNEE` et `LIVREE`), avec des stocks cohérents.

---

## 7. Règles métier clés

- **Une commande par producteur** : un panier multi-producteurs est éclaté à la validation.
- **Stock** : réservé à la création de commande ; **restitué une seule fois** en cas d'annulation (idempotent). Interdiction de vendre un produit inactif ou en quantité insuffisante.
- **Prix figés** : une commande conserve les prix unitaires appliqués au moment de l'achat, même si le produit change ensuite.
- **Transitions de commande** :
  `EN_ATTENTE → CONFIRMEE → EN_PREPARATION → PRETE → EN_LIVRAISON → LIVREE`, plus `ANNULEE` sous conditions (jamais depuis un statut final). Chaque transition est autorisée par rôle.
- **Transitions de livraison** :
  `EN_ATTENTE → ASSIGNEE → EN_COURS → LIVREE | ECHEC`. Un **échec exige un commentaire**.
- **Couplage commande ↔ livraison** (dans la même transaction) :
  affectation → commande `EN_LIVRAISON` ; livraison `LIVREE` → commande `LIVREE` ; livraison `ECHEC` → commande `PRETE` ; annulation administrative d'une commande `EN_LIVRAISON` → livraison `ECHEC` (avec commentaire) + commande `ANNULEE` + stock restitué.
- **Adresse de livraison** : obligatoire à la validation, modifiable seulement en `EN_ATTENTE` ou `CONFIRMEE`.
- **Indicateurs** : calculés **exclusivement** à partir des données locales, jamais codés en dur.

---

## 8. Routes de l'application

| Chemin                                                          | Écran                               | Accès                            |
| --------------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| `/`                                                             | Accueil                             | Public                           |
| `/catalogue`                                                    | Catalogue                           | Public                           |
| `/catalogue/:id`                                                | Fiche produit                       | Public                           |
| `/aide`                                                         | Aide et limites                     | Public                           |
| `/connexion`, `/inscription`                                    | Authentification                    | Public                           |
| `/panier`                                                       | Panier                              | Acheteur                         |
| `/commandes`, `/commandes/:id`                                  | Mes commandes / détail              | Acheteur (détail : ayants droit) |
| `/producteur/produits`                                          | Mes produits                        | Producteur                       |
| `/producteur/commandes`                                         | Commandes reçues                    | Producteur                       |
| `/livreur`                                                      | Mes missions                        | Livreur                          |
| `/tableau-de-bord`                                              | Redirection vers le tableau du rôle | Connecté                         |
| `/tableau-de-bord/{administrateur,producteur,acheteur,livreur}` | Tableaux de bord                    | Rôle correspondant               |
| `/admin`, `/admin/{utilisateurs,produits,commandes,livraisons}` | Administration                      | Administrateur                   |
| `**`                                                            | Page introuvable                    | Public                           |

---

## 9. Tests

Le projet est couvert par des **tests unitaires** (services, règles métier, transitions), des **tests de composant** (écrans et interactions) et des **tests de parcours** de bout en bout (`src/app/integration/parcours.spec.ts`), exécutés avec **Vitest**.

```bash
npm test
```

La suite couvre notamment :

- la couche de persistance (lecture, données corrompues, `schemaVersion` inconnue, échec d'écriture, amorçage unique) ;
- l'authentification (inscription, unicité e-mail, refus du rôle `ADMIN`, hachage sans mot de passe en clair) ;
- les permissions et guards (accès refusé par rôle, compte désactivé) ;
- le catalogue (validations, suppression protégée, filtres/tri, disponibilité) ;
- le panier (contrôles de disponibilité, regroupement par producteur, calcul des frais) ;
- les commandes (références uniques, prix figés, transitions, annulation et restitution du stock) ;
- les livraisons (affectation, transitions, échec avec commentaire, couplage commande↔livraison) ;
- les tableaux de bord (indicateurs par rôle, valeurs à zéro sur données vides) ;
- l'administration (protections d'activation, modération, réinitialisation) ;
- la robustesse de bout en bout (données corrompues, quota, session illisible, multi-producteurs).

---

## 10. Limites de la V1

La V1 est **entièrement locale** (contraintes assumées du projet). Détail complet dans [`docs/limites-v1.md`](docs/limites-v1.md) :

- **Données locales** : scope navigateur, aucune synchronisation entre appareils.
- **Sécurité** : authentification **simulée**, contrôle d'accès **côté client uniquement** (contournable par un utilisateur ayant accès au stockage). Aucun mot de passe en clair, mais **pas de sécurité serveur**.
- **Pas de backend** : aucune API, aucune requête HTTP ; les données ne circulent que dans les signaux Angular.
- **Pas de paiement réel** et **pas d'upload d'image** (les produits utilisent une `imageUrl`).
- **Robustesse** : en cas d'écriture impossible (quota, navigation privée), l'état **en mémoire** est conservé (la saisie n'est pas perdue) et un avertissement est affiché.

---

## 11. État d'avancement et suite

- Groupes de tâches **1 à 11 implémentés** ; **76 / 77 tâches** terminées.
- La seule tâche restante, **11.4**, est la **validation avec l'enseignant** des hypothèses D7 (frais de livraison), D8 (éclatement du panier) et de l'unicité de rôle par compte — un point **externe** au développement. Les valeurs retenues sont déjà figées par les tests et documentées dans `revue.md`.
- **Prochaines étapes** : valider la tâche 11.4, puis **archiver le changement OpenSpec** (`add-agrimarket-marketplace-v1`). Le déploiement et la publication GitHub feront l'objet d'une décision séparée.

### Documentation

- [`docs/persistence.md`](docs/persistence.md) — contrat de la couche de persistance et procédure de remplacement par une API.
- [`docs/limites-v1.md`](docs/limites-v1.md) — limites de la V1.
- `openspec/changes/add-agrimarket-marketplace-v1/proposal.md` — pourquoi et quoi.
- `openspec/changes/add-agrimarket-marketplace-v1/design.md` — décisions d'architecture D1–D16.
- `openspec/changes/add-agrimarket-marketplace-v1/tasks.md` — plan de tâches.
- `openspec/changes/add-agrimarket-marketplace-v1/revue.md` — revue de couverture des capacités.
