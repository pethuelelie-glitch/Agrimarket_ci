# storefront Specification

## Purpose

Présenter la marketplace AgriMarket CI aux visiteurs et guider chaque profil (visiteur, producteur, acheteur, livreur, administrateur) vers les écrans et actions qui le concernent, sur écran large comme sur mobile.

## Requirements

### Requirement: Présentation de la marketplace sur la page d'accueil

La page d'accueil SHALL afficher le nom de la marketplace, une présentation de son objet (mise en relation des producteurs, acheteurs et livreurs du marché ivoirien) et des accès directs vers le catalogue, la connexion et l'inscription pour un visiteur non authentifié.

#### Scenario: Affichage pour un visiteur

- **WHEN** un visiteur non authentifié ouvre la page d'accueil
- **THEN** le titre, la présentation et trois boutons (Catalogue, Connexion, Inscription) sont visibles

#### Scenario: Raccourcis de navigation

- **WHEN** le visiteur clique sur Catalogue, Connexion ou Inscription
- **THEN** il est dirigé vers la page correspondante sans erreur

### Requirement: Mise en avant des produits agricoles

La page d'accueil SHALL afficher une sélection des produits actifs les plus récents, limitée à six produits et triée par date de création décroissante.

#### Scenario: Des produits actifs existent

- **WHEN** au moins un produit actif existe et que la page d'accueil se charge
- **THEN** jusqu'à six produits sont affichés avec nom, prix, unité et localisation, du plus récent au plus ancien

#### Scenario: Aucun produit actif

- **WHEN** aucun produit n'est actif
- **THEN** un état vide est affiché avec un message invitant à consulter le catalogue

#### Scenario: Les produits inactifs ne figurent jamais à la une

- **WHEN** la page d'accueil se charge
- **THEN** aucun produit au statut inactif apparaît dans la mise en avant

### Requirement: Navigation responsive

La navigation SHALL rester utilisable et lisible quel que soit la largeur d'écran : barre de navigation complète sur écran large, menu repliable sur écran étroit, sans défilement horizontal du contenu principal.

#### Scenario: Écran large

- **WHEN** la largeur de fenêtre est supérieure ou égale à 768 px
- **THEN** les liens de navigation sont visibles directement dans l'en-tête

#### Scenario: Écran étroit

- **WHEN** la largeur de fenêtre est inférieure à 768 px
- **THEN** les liens sont regroupés dans un menu repliable qui s'ouvre et se ferme à la demande

### Requirement: Navigation adaptée au rôle

Les liens de navigation SHALL correspondre au rôle de l'utilisateur : liens catalogue/connexion/inscription pour un visiteur, lien vers le tableau de bord et déconnexion pour un utilisateur connecté, et entrées propres au rôle (produits, commandes, livraisons, administration) selon le rôle de la session.

#### Scenario: Visiteur non connecté

- **WHEN** aucun utilisateur n'est connecté
- **THEN** seuls Catalogue, Connexion et Inscription sont proposés

#### Scenario: Utilisateur connecté

- **WHEN** un utilisateur connecté consulte une page
- **THEN** son tableau de bord et la déconnexion sont proposés, et l'inscription ne l'est plus

#### Scenario: Entrée propre à un autre rôle absente

- **WHEN** un acheteur connecté consulte la navigation
- **THEN** aucune entrée d'administration ni d'espace producteur n'est proposée

### Requirement: États vides et erreurs de la page d'accueil

La page d'accueil SHALL afficher un état vide explicite lorsque des données sont absentes et un message d'erreur compréhensible lorsqu'une erreur de chargement survient, sans écran blanc ni plantage.

#### Scenario: Erreur de chargement des produits

- **WHEN** le chargement des produits échoue
- **THEN** un message d'erreur en français est affiché avec un bouton de réessai
