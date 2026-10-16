# Tasks

## 1. Fondations : structure, modèles, persistance, données de démonstration

- [x] 1.1 Créer l'ossature `src/app/core/{models,persistence,data,services,guards,permissions}`, `src/app/features/{home,auth,catalog,cart,orders,deliveries,dashboard,admin,aide}` et `src/app/shared`, puis vérifier que `ng build` réussit et que `src/app/app.spec.ts` reste vert avec `ng test --watch=false`
- [x] 1.2 Définir dans `core/models` les enums (`Role`, `Categorie`, `Unite`, `StatutCommande`, `StatutLivraison`) et les interfaces `Utilisateur`, `Produit`, `LigneCommande`, `Commande`, `EvenementCommande`, `Livraison`, `EvenementLivraison`, `Panier` conformément à la décision D4, puis vérifier que `ng build` passe en mode strict sans `any`
- [x] 1.3 Implémenter l'interface `StorageAdapter`, `LocalStorageAdapter`, `InMemoryAdapter` et `PersistenceService` avec document racine versionné `agrimarket.v1` et méthode `transaction(mutator)` (décision D2/D3) ; vérifier par des tests Vitest la lecture de données valides, le traitement de données corrompues, d'une `schemaVersion` inconnue et d'une erreur d'écriture
- [x] 1.4 Écrire `core/config.ts` (clé de stockage, `FORFAIT_BASE = 1000`, table des zones Abidjan/villes secondaires/autres, `schemaVersion`) et une fonction `fraisLivraison(localisationProducteur)` ; vérifier par test unitaire les trois montants 1 500 / 2 000 / 2 500 FCFA et le cas d'une localisation inconnue
- [x] 1.5 Créer le pipe/helper `montantFcfa` (entiers FCFA, format `fr-CI`) et vérifier par test unitaire l'absence de décimales et le séparateur de milliers
- [x] 1.6 Écrire `core/data/seed.ts` produisant un jeu cohérent (1 admin, 2 producteurs, 2 acheteurs, 2 livreurs, 8 produits sur les 6 catégories, 3 commandes à statuts différents, 1 livraison `ASSIGNEE` et 1 `LIVREE`, stocks cohérents avec ces commandes) ; vérifier par test que le stock résultant est cohérent avec les commandes du jeu
- [x] 1.7 Câbler l'amorçage unique via `meta.initialized` et vérifier par test qu'un premier appel crée les données puis qu'un second appel ne les modifie ni ne les duplique
- [x] 1.8 Documenter dans `docs/persistence.md` le contrat de la couche de persistance, le format du document racine, la stratégie d'atomicité et la procédure de substitution par une API ; vérifier que les chemins et noms de clés cités correspondent au code
- [x] 1.9 Rédiger `docs/limites-v1.md` listant les limites sans backend (données locales propres au navigateur, absence de synchronisation et de sécurité serveur, absence de paiement réel, pas d'upload d'image) ; vérifier que chaque limite est également couverte par au moins une exigence de `local-persistence` ou `user-auth`

## 2. Authentification et session

- [x] 2.1 Implémenter `AuthService` : inscription validée (nom, e-mail unique, mot de passe ≥ 8 caractères, rôle parmi PRODUCTEUR/ACHETEUR/LIVREUR), connexion, déconnexion et signal `utilisateurCourant` ; vérifier par tests unitaires l'inscription valide, l'e-mail déjà utilisé, le rôle ADMIN refusé et la session ouverte après inscription
- [x] 2.2 Implémenter l'empreinte de mot de passe `SHA-256(sel + motDePasse)` via `crypto.subtle` avec sel aléatoire par compte (décision D10) ; vérifier par test qu'aucun champ enregistré ne contient le mot de passe en clair et que deux comptes de même mot de passe ont des empreintes et des sels différents
- [x] 2.3 Gérer la connexion refusée (identifiants erronés avec message générique, compte désactivé) et vérifier par tests unitaires les trois cas sans révéler l'existence d'une adresse
- [x] 2.4 Persister la session, la restaurer au rechargement et nettoyer une session illisible ; vérifier par test la conservation après rechargement simulé et le traitement d'une session corrompue comme déconnexion
- [x] 2.5 Créer les pages d'inscription et de connexion (Reactive Forms, messages d'erreur sous chaque champ, affichage des identifiants des comptes de démonstration, mention « authentification locale simulée, non sécurisée pour la production ») ; vérifier par tests de composant le blocage d'une soumission invalide et la présence de la mention
- [x] 2.6 Implémenter la déconnexion avec redirection vers l'accueil et vérifier par test de composant que l'action ferme la session et que la navigation redevient celle d'un visiteur
- [x] 2.7 Enregistrer les routes `/inscription` et `/connexion` (chargement paresseux) et vérifier qu'elles s'affichent sans erreur dans `ng build`

## 3. Rôles, permissions et guards

- [x] 3.1 Écrire `core/permissions/permissions.ts` : matrice `role -> actions autorisées` couvrant produit, commande, livraison, administration et panier (décision D11) ; vérifier par tests unitaires le refus des actions hors périmètre (par exemple producteur modifiant le produit d'un autre, livreur sur livraison non attribuée)
- [x] 3.2 Implémenter `authGuard`, `roleGuard(roles[])` et `compteActifGuard` (réévaluation de `actif` à chaque navigation) et vérifier par tests de routeur qu'un accès non autorisé redirige vers la connexion ou vers l'espace du rôle, sans afficher l'écran protégé
- [x] 3.3 Vérifier par test unitaire qu'un rôle hors de la liste des quatre invalide la session et redirige vers la connexion, et qu'un compte désactivé est déconnecté à la navigation suivante
- [x] 3.4 Créer la page `features/aide` documentant les limites du contrôle d'accès côté client et de la sécurité locale, et ajouter la mention correspondante dans le pied de page ; vérifier par test de composant la présence de cette information
- [x] 3.5 Ajouter la règle d'affichage « action masquée ou désactivée si non autorisée » dans les composants partagés (`shared`) et vérifier par test de composant qu'un bouton non autorisé n'est pas rendu pour le rôle courant

## 4. Coquille applicative, navigation et accueil

- [x] 4.1 Construire l'ossature responsive (`app.html`, `app.css`) avec en-tête, menu repliable sous 768 px, zone de contenu et pied de page mentionnant les limites ; vérifier manuellement le rendu à 375 px, 768 px et 1 280 px sans défilement horizontal
- [x] 4.2 Implémenter la navigation adaptée au rôle à partir de `utilisateurCourant` (catalogue/connexion/inscription pour un visiteur, lien tableau de bord et déconnexion pour un connecté, entrées spécifiques par rôle) ; vérifier par tests de composant les trois cas de figure
- [x] 4.3 Créer la page d'accueil (présentation de la marketplace, trois appels à l'action, mise en avant de six produits actifs les plus récents triés par date décroissante) ; vérifier par test de composant l'exclusion des produits inactifs et la limite à six éléments
- [x] 4.4 Gérer les états vides et l'erreur de chargement de l'accueil (message + bouton de réessai) dans les composants partagés d'état vide ; vérifier par test de composant l'affichage du message et du bouton
- [x] 4.5 Déclarer les routes racine (`/` → accueil, `/catalogue`, `/aide`) et le repli 404, avec chargement paresseux, puis vérifier que `ng build` produit un découpage par feature

## 5. Catalogue et gestion des produits

- [ ] 5.1 Implémenter `CatalogueService` : création et modification avec validations (champs obligatoires, prix strictement positif, quantité ≥ 0, catégorie et unité dans les énumérations, imageUrl non vide) et vérifier par tests unitaires chaque cas de refus
- [ ] 5.2 Implémenter la suppression avec confirmation, refusée si le produit figure dans une commande non `LIVREE` ni `ANNULEE` (lecture des commandes via `PersistenceService`, cf. D2) ; vérifier par tests unitaires les trois cas : confirmée, annulée, commande en cours
- [ ] 5.3 Implémenter le statut actif/inactif et sa conséquence sur le catalogue public ; vérifier par tests unitaires qu'un produit inactif est exclu de la liste publique et de la mise en avant mais reste visible pour son producteur
- [ ] 5.4 Implémenter la gestion du stock avec refus d'une quantité négative et d'une quantité inférieure à la somme des quantités des commandes en cours ; vérifier par tests unitaires la quantité minimale retournée dans le message d'erreur
- [ ] 5.5 Implémenter recherche (insensible à la casse) et filtres combinables (catégorie, prix min, prix max, disponibilité, localisation) ainsi que les quatre tris (prix asc/desc, date asc/desc, date desc par défaut) ; vérifier par tests unitaires l'intersection des critères et l'absence de résultat
- [ ] 5.6 Créer la page catalogue (grille responsive, barre de recherche, panneau de filtres, sélecteur de tri, réinitialisation des filtres, états vides) ; vérifier par tests de composant le filtrage, le tri et l'état « aucun produit ne correspond »
- [ ] 5.7 Créer la fiche produit détaillée (image avec image générique en secours, description, prix, unité, quantité, localisation, date, producteur, détection « produit introuvable ») ; vérifier par tests de composant le cas nominal et le cas d'identifiant inconnu
- [ ] 5.8 Créer l'espace producteur de gestion des produits (liste avec statut et stock, formulaire de création/modification, actions Modifier/Supprimer/Gérer le stock, état vide avec appel à créer un premier produit) ; vérifier par tests de composant la création d'un produit et l'affichage de l'état vide
- [ ] 5.9 Neutraliser le bouton d'ajout au panier pour un produit inactif ou épuisé depuis la fiche produit et le catalogue, avec message « rupture de stock » ; vérifier par test de composant que le bouton est désactivé et que le message est présent

## 6. Panier

- [ ] 6.1 Implémenter `CartService` : réservé au rôle ACHETEUR, ajout avec contrôle de disponibilité (produit inactif, épuisé, quantité supérieure au stock, cumul plafonné) ; vérifier par tests unitaires les quatre cas de refus et le cumul
- [ ] 6.2 Implémenter la modification de quantité (minimum 1, plafond au stock disponible avec message) et la suppression d'article avec recalcul immédiat ; vérifier par tests unitaires le plafonnement et le recalcul des totaux
- [ ] 6.3 Implémenter le calcul des sous-totaux, du montant des produits, des frais de livraison par producteur (via `fraisLivraison`, décision D7) et du montant total ; vérifier par tests unitaires le montant total = produits + frais et la disparition des frais lorsqu'un groupe producteur devient vide
- [ ] 6.4 Implémenter le regroupement du panier par producteur ; vérifier par tests unitaires qu'un panier de deux producteurs produit deux groupes avec montants et frais distincts
- [ ] 6.5 Implémenter la revérification des stocks avant validation (article insuffisant signalé, produit devenu inactif ou supprimé signalé, validation bloquée) ; vérifier par tests unitaires l'absence de création tant qu'un article reste indisponible
- [ ] 6.6 Persister le panier par acheteur (`carts[acheteurId]`), le vider après validation et gérer un panier illisible ; vérifier par tests unitaires la conservation après rechargement, l'isolement entre deux comptes et la réinitialisation sur données corrompues
- [ ] 6.7 Créer la page panier (regroupement par producteur, sous-totaux, montant des produits, frais séparés, total, suppressions, état vide) et l'indicateur du nombre d'articles dans la navigation ; vérifier par tests de composant le recalcul après suppression et l'état vide
- [ ] 6.8 Implémenter la redirection vers la connexion pour un visiteur ou un rôle non acheteur tentant d'ajouter au panier ; vérifier par test de routeur l'absence de modification du panier

## 7. Commandes

- [ ] 7.1 Implémenter le générateur de référence `CMD-AAAAMMJJ-XXXX` avec unicité (décision D16) ; vérifier par tests unitaires le format, la présence de la date et l'unicité de vingt références générées le même jour
- [ ] 7.2 Implémenter la création de commande depuis le panier en une seule transaction : une commande par producteur, lignes instantanées (nom, unité, prix unitaire figé, sous-total), montants calculés, statut `EN_ATTENTE`, décrément du stock, vidage du panier correspondant, prolongement de l'historique ; vérifier par tests unitaires le cas mono-producteur, le cas multi-producteurs et le cas panier vide
- [ ] 7.3 Vérifier par tests unitaires que la commande conserve son prix unitaire après modification du prix du produit et que `montantTotal = montantProduits + fraisLivraison`
- [ ] 7.4 Implémenter les transitions de statut par rôle conformément aux tables D5 (confirmation, refus, `EN_PREPARATION`, `PRETE`) et le message listant les transitions possibles en cas de demande invalide ; vérifier par tests unitaires chaque transition autorisée et au moins trois transitions refusées
- [ ] 7.5 Implémenter l'annulation par rôle (acheteur et producteur sur `EN_ATTENTE`/`CONFIRMEE`, administrateur sur tout statut sauf `LIVREE` et `ANNULEE`), la restitution exacte du stock et l'idempotence ; vérifier par tests unitaires la restitution simple, le refus après préparation, le refus sur statut final et l'absence de double restitution
- [ ] 7.6 Implémenter la règle d'adresse de livraison (obligatoire à la validation, modifiable seulement en `EN_ATTENTE` ou `CONFIRMEE`) ; vérifier par tests unitaires la validation bloquée sans adresse et le refus de modification après préparation
- [ ] 7.7 Implémenter le contrôle d'accès au détail de commande (acheteur propriétaire, producteur concerné, administrateur ; refus pour les autres rôles) ; vérifier par tests unitaires les quatre cas
- [ ] 7.8 Créer les pages commandes : historique acheteur (tri antéchronologique, filtres par statut, état vide), détail avec historique horodaté, liste des commandes reçues du producteur et actions de transition autorisées ; vérifier par tests de composant l'affichage de l'historique et le masquage des actions interdites

## 8. Livraisons

- [ ] 8.1 Implémenter `DeliveryService` : création sur commande `CONFIRMEE`/`EN_PREPARATION`/`PRETE` sans livraison active, refus sinon, référence `LIV-AAAAMMJJ-XXXX`, statut initial `EN_ATTENTE` et historique initial ; vérifier par tests unitaires la création valide, le refus sur statut non éligible et le refus en présence d'une livraison active
- [ ] 8.2 Implémenter l'affectation par l'administrateur (livreur actif de rôle LIVREUR, commande au statut `PRETE`) avec `dateAffectation` et passage à `ASSIGNEE` ; vérifier par tests unitaires l'affectation valide, le refus d'un livreur inactif ou non livreur et le refus si la commande n'est pas prête
- [ ] 8.3 Implémenter les transitions du livreur attribué (`ASSIGNEE → EN_COURS`, `EN_COURS → LIVREE` avec `dateLivraison`, `ASSIGNEE|EN_COURS → ECHEC` avec commentaire obligatoire) et le refus sur livraison non attribuée ou statut final ; vérifier par tests unitaires chaque transition, l'échec sans commentaire et l'accès d'un autre livreur
- [ ] 8.4 Implémenter le couplage commande ↔ livraison dans la même transaction (D6) : affectation → commande `EN_LIVRAISON` ; livraison `LIVREE` → commande `LIVREE` ; livraison `ECHEC` → commande `PRETE` ; annulation administrative d'une commande en `EN_LIVRAISON` → livraison `ECHEC` avec commentaire puis commande `ANNULEE` et stock restitué ; vérifier par tests unitaires les quatre effets croisés
- [ ] 8.5 Vérifier par tests unitaires la cohérence des statuts croisés après sérialisation/désérialisation du document racine, et qu'une nouvelle livraison est possible après un échec tout en conservant l'historique de la livraison échouée
- [ ] 8.6 Implémenter l'historique horodaté des livraisons (ancien statut, nouveau statut, acteur, date/heure, commentaire) affiché dans l'ordre chronologique ; vérifier par test unitaire l'ajout d'une entrée par changement et par test de composant l'affichage chronologique
- [ ] 8.7 Créer les pages livraisons : missions du livreur groupées par statut avec états vides, écran d'affectation administrateur (avec message « aucun livreur disponible »), supervision filtrable par statut et suivi acheteur depuis la commande ; vérifier par tests de composant l'affichage par rôle et le refus d'accès à la livraison d'un autre acheteur

## 9. Tableaux de bord

- [ ] 9.1 Implémenter les indicateurs administrateur (utilisateurs, producteurs, produits actifs, commandes par statut, livraisons en cours et terminées, évolution sur 14 jours) dans `DashboardService` ; vérifier par tests unitaires les valeurs attendues pour le jeu de démonstration et l'égalité avec les comptages des listes
- [ ] 9.2 Implémenter les indicateurs producteur (produits actifs, stock disponible cumulé, commandes reçues, quantités vendues, montant des ventes hors commandes annulées) ; vérifier par tests unitaires le périmètre limité au producteur connecté
- [ ] 9.3 Implémenter les indicateurs acheteur (commandes en cours hors `LIVREE`/`ANNULEE`, commandes livrées, accès à l'historique) et livreur (missions attribuées, en cours, terminées, en échec, limitées aux livraisons attribuées) ; vérifier par tests unitaires chaque définition
- [ ] 9.4 Vérifier par test unitaire qu'avec un jeu de données vide tous les compteurs valent zéro et qu'aucune valeur codée en dur n'est renvoyée
- [ ] 9.5 Créer les quatre tableaux de bord (cartes d'indicateurs, répartition des commandes par statut, évolution des commandes en liste de barres simples, états vides avec action suggérée) et les routes protégées par rôle ; vérifier par tests de composant l'affichage à zéro sur données vides et la redirection d'un rôle vers son propre tableau de bord

## 10. Administration

- [ ] 10.1 Implémenter la consultation des utilisateurs (liste avec rôle et statut, comptes désactivés distingués, recherche par nom ou e-mail, détail) réservée à l'administrateur ; vérifier par tests unitaires la recherche et le refus d'accès aux autres rôles
- [ ] 10.2 Implémenter la modification des informations autorisées (nom, localisation, téléphone, réinitialisation du mot de passe) et le refus de modifier l'e-mail ; vérifier par tests unitaires la modification enregistrée, l'e-mail en lecture seule et la réinitialisation sans mot de passe en clair
- [ ] 10.3 Implémenter le changement de rôle vers l'un des quatre rôles reconnus et vérifier par tests unitaires l'enregistrement effectif et le refus d'un rôle inconnu
- [ ] 10.4 Implémenter l'activation/désactivation avec protections (impossible sur son propre compte, impossible si aucun administrateur actif ne subsiste) et vérifier par tests unitaires les deux protections et l'effet sur la connexion d'un compte désactivé
- [ ] 10.5 Implémenter la modération des produits : désactivation avec motif tracé, suppression avec confirmation, refus si commande en cours, prix/unité/stock en lecture seule pour l'administrateur ; vérifier par tests unitaires les quatre comportements
- [ ] 10.6 Implémenter la supervision des commandes (filtres par statut et producteur, détail lecture seule incluant les statuts de commande et de livraison) et vérifier par tests unitaires les filtres et la non-modifiabilité du contenu
- [ ] 10.7 Implémenter la réinitialisation des données de démonstration avec confirmation réservée à l'administrateur et vérifier par tests unitaires l'effet de la confirmation, l'absence d'effet de l'annulation et le refus pour les autres rôles
- [ ] 10.8 Créer les pages d'administration (utilisateurs, produits, commandes, livraisons, attribution des livreurs, tableau de bord global, réinitialisation) et vérifier par tests de composant l'accès réservé à l'administrateur et la disponibilité de chaque écran

## 11. Intégration et vérification globale

- [ ] 11.1 Écrire des tests de parcours avec `InMemoryAdapter` couvrant les trois scénarios principaux : inscription d'un acheteur puis achat jusqu'à la livraison, cycle producteur (création de produit → confirmation → préparation → prête), et affectation/mise à jour d'une livraison par un livreur ; vérifier qu'ils passent via `ng test --watch=false`
- [ ] 11.2 Écrire un test de parcours multi-producteurs vérifiant la création de deux commandes, le décrément cohérent du stock et la restitution après annulation ; vérifier que les compteurs du tableau de bord et les listes concordent ensuite
- [ ] 11.3 Vérifier la robustesse de bout en bout : document racine corrompu, `schemaVersion` inconnue, quota d'écriture dépassé et session illisible, chacun n'entraînant ni écran blanc ni perte des données valides ; vérifier par tests d'intégration
- [ ] 11.4 Traiter les points de revue fonctionnelle : valider la règle des frais de livraison (D7), l'éclatement du panier multi-producteurs (D8) et l'unicité de rôle par compte avec l'enseignant, puis ajuster `core/config.ts` ou les spécifications si une règle diffère ; vérifier que les valeurs retenues sont reflétées dans les tests
- [ ] 11.5 Exécuter `ng test --watch=false` (suite complète au vert) et `ng build` (production sans erreur stricte), et vérifier que le test `src/app/app.spec.ts` d'origine est toujours présent et passant
- [ ] 11.6 Parcourir les dix capacités de `specs/` et vérifier qu'au moins un test automatisé ou une vérification manuelle documentée couvre chaque exigence ; consigner les écarts éventuels dans la revue avant archivage

## Workflow follow-up

- Archiver ce changement après validation des spécifications et des points de revue 11.4.
- Après développement et tests, décider séparément du déploiement Vercel et de la publication GitHub (hors périmètre de ce changement).
