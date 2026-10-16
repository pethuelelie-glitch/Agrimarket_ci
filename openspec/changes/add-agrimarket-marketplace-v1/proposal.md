# Proposal

## Why

AgriMarket CI est un projet scolaire (L3 Génie Logiciel) : une marketplace de produits agricoles pour le marché ivoirien, développée en Angular 21 / TypeScript strict, sans backend pour la V1 (données locales dans `localStorage`). Le dépôt ne contient aujourd'hui que la coquille Angular fraîchement générée (aucune route, aucun service, aucun modèle métier) et aucun dépôt de spécifications existant. Sans règles écrites, les dix modules seraient implémentés à partir d'interprétations divergentes — en particulier sur les transitions de statut des commandes et livraisons, l'attribution des permissions par rôle, et la cohérence entre stocks, commandes et livraisons. Formaliser ces règles et leurs critères d'acceptation avant le développement permet d'implémenter puis de tester contre des exigences vérifiables plutôt que contre des souvenirs du cahier des charges.

## What Changes

- Ajout d'une marketplace côté client complète : accueil/navigation, authentification locale simulée, gestion des quatre rôles (ADMIN, PRODUCTEUR, ACHETEUR, LIVREUR), catalogue de produits agricoles, panier, commandes, livraisons, tableaux de bord par rôle, supervision administrative et persistance locale.
- Introduction d'une couche de persistance locale centralisée (`localStorage`) avec sérialisation, amorçage unique de données de démonstration, détection des données absentes/corrompues et contract de remplacement ultérieur par une API REST.
- Introduction d'un modèle de données TypeScript strict (utilisateurs, produits, commandes, lignes de commande, livraisons, événements d'historique) partagé par tous les modules.
- Ajout de gardes de route et de contrôles de permission côté client, clairement documentés comme limités à la démonstration (aucune sécurité serveur).
- Ajout de la navigation adaptée au rôle (liens et zones visibles selon le rôle connecté), de formulaires validés et de messages d'erreur explicites.
- Ajout des règles métier de stock : réservation à la commande, restitution en cas d'annulation, interdiction de vendre un produit indisponible ou en quantité insuffisante.
- Ajout des transitions de statut autorisées pour les commandes (`EN_ATTENTE → CONFIRMEE → EN_PREPARATION → PRETE → EN_LIVRAISON → LIVREE`, plus `ANNULEE`) et pour les livraisons (`EN_ATTENTE → ASSIGNEE → EN_COURS → LIVREE | ECHEC`), avec commentaire obligatoire en cas d'échec.
- Ajout des tableaux de bord calculés exclusivement à partir des données locales (aucun indicateur fictif/hardcodé).
- Ajout des tests : tests unitaires des services et des règles métier (Vitest, déjà installé) et tests de parcours des scénarios principaux.
- **Hypotheses retenues** (règles absentes du cahier des charges, à valider avant implémentation) : le panier multi-producteurs est scindé en une commande par producteur à la validation ; les frais de livraison sont un forfait de base complété par un supplément de zone, calculés et mémorisés dans la commande ; les mots de passe de démonstration ne sont jamais stockés en clair (empreinte non réversible) et l'authentification reste une simulation pédagogique ; les artefacts sont rédigés en français, les identifiants de code en anglais.

Hors périmètre de ce changement : backend/API, paiement réel, déploiement Vercel, publication GitHub, synchronisation multi-utilisateurs.

## Capabilities

### New Capabilities

- `storefront`: accueil professionnel, présentation de la marketplace, mise en avant des produits, navigation responsive et adaptation des liens au rôle connecté.
- `user-auth`: inscription, connexion, déconnexion, session locale persistante, validation des formulaires, messages d'erreur et comptes de démonstration — avec la limite explicite d'une authentification simulée et non sécurisée.
- `access-control`: définition des quatre rôles (ADMIN, PRODUCTEUR, ACHETEUR, LIVREUR), de leurs droits, du périmètre de données propre à chaque rôle (produits, commandes, livraisons) et des limites des gardes Angular.
- `product-catalog`: modèle de produit, création/consultation/modification/suppression avec confirmation, gestion du stock et du statut actif/inactif, recherche, filtres (catégorie, prix, disponibilité, localisation), tri et fiche détaillée.
- `shopping-cart`: ajout, modification des quantités, suppression d'article, sous-totaux, total, affichage distinct des frais de livraison, contrôle de disponibilité avant validation et conservation locale du panier.
- `order-management`: modèle de commande (référence lisible, articles, prix figés, frais, adresse, statut), création à partir du panier, consultation, historique, transitions de statut, annulation selon règles, une commande par producteur et effets cohérents sur les stocks.
- `delivery-management`: modèle de livraison, création après validation de la commande, affectation par l'administrateur, missions du livreur, transitions de statut, suivi acheteur, historique horodaté et commentaire obligatoire en cas d'échec.
- `dashboard`: indicateurs par rôle (administrateur, producteur, acheteur, livreur) entièrement calculés à partir des données locales.
- `admin-oversight`: consultation et modification des utilisateurs, activation/désactivation de comptes, modération des produits, supervision des commandes, attribution des livreurs et vue d'ensemble des livraisons.
- `local-persistence`: stockage centralisé `localStorage`, sérialisation/désérialisation, amorçage unique des données de démonstration, gestion des données absentes ou corrompues, prévention des incohérences stocks/commandes/livraisons et contract d'accès permettant de remplacer `localStorage` par une API.

### Modified Capabilities

Aucune — `openspec list --specs` ne renvoie aucune spécification existante ; toutes les capacités ci-dessus sont nouvelles.

## Impact

- **Code** : `src/app/` — ajout de routes (`app.routes.ts`), de gardes, de feature modules organisés par domaine (accueil, auth, catalogue, panier, commandes, livraisons, tableaux de bord, administration), de services métier, de modèles TypeScript et de composants responsive. `src/app/app.html` et `app.css` évoluent pour l'ossature de navigation.
- **Tests** : `src/app/**/*.spec.ts` existant (test de création de l'application, à conserver) + nouveaux tests unitaires de services et de règles de statut/permission + tests de parcours. Outil déjà présent : Vitest via `ng test` (aucune dépendance à ajouter).
- **Données** : nouvelles clés `localStorage` préfixées `agrimarket.*`, schéma versionné pour détecter les données corrompues, jeu de données de démonstration amorcé une seule fois.
- **Dépendances** : aucune nouvelle (Angular 21, `@angular/forms`, `@angular/router`, RxJS déjà installés).
- **Systèmes** : aucun backend, aucune API, aucun paiement. `angular.json` est déjà modifié localement ; le déploiement (Vercel) et la publication (GitHub) sont explicitement hors périmètre.
