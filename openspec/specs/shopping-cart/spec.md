# shopping-cart Specification

## Purpose

Permettre à un acheteur de composer son panier, d'en vérifier le détail des montants et la disponibilité des stocks avant validation, et de conserver ce panier localement entre deux visites.

## Requirements

### Requirement: Accès au panier réservé à l'acheteur connecté

Le panier SHALL être accessible uniquement à un utilisateur connecté possédant le rôle ACHETEUR ; un visiteur ou un utilisateur d'un autre rôle qui tente d'ajouter un produit est redirigé vers la connexion sans modification du panier.

#### Scenario: Acheteur connecté

- **WHEN** un acheteur connecté ajoute un produit disponible à son panier
- **THEN** l'article est ajouté et le nombre d'articles du panier est mis à jour dans la navigation

#### Scenario: Visiteur non connecté

- **WHEN** un visiteur non connecté clique sur « Ajouter au panier »
- **THEN** il est redirigé vers la connexion et le panier reste inchangé

#### Scenario: Rôle non acheteur

- **WHEN** un producteur ou un livreur tente d'ajouter un produit à son panier
- **THEN** l'action est refusée avec le message « réservé aux acheteurs »

### Requirement: Ajout d'un article avec contrôle de disponibilité

L'ajout au panier SHALL être refusé pour un produit inactif ou épuisé, et une quantité demandée supérieure au stock disponible SHALL être refusée avec indication de la quantité maximale.

#### Scenario: Ajout valide

- **WHEN** l'acheteur ajoute un produit actif avec une quantité inférieure ou égale au stock disponible
- **THEN** une ligne (produit, quantité, prix unitaire, sous-total) apparaît dans le panier

#### Scenario: Produit épuisé ou inactif

- **WHEN** l'acheteur tente d'ajouter un produit dont la quantité disponible est zéro ou dont le statut est inactif
- **THEN** l'ajout est refusé, un message « produit indisponible » est affiché et le panier reste inchangé

#### Scenario: Quantité supérieure au stock

- **WHEN** l'acheteur demande une quantité supérieure au stock disponible du produit
- **THEN** l'ajout est refusé avec un message indiquant la quantité maximale possible

#### Scenario: Produit déjà présent dans le panier

- **WHEN** l'acheteur ajoute une seconde fois le même produit
- **THEN** les quantités sont cumulées dans la limite du stock disponible

### Requirement: Modification de la quantité d'un article

L'acheteur SHALL pouvoir augmenter ou diminuer la quantité d'un article avec une quantité minimale de 1, l'augmentation étant plafonnée au stock disponible avec un message d'information.

#### Scenario: Augmentation dans la limite du stock

- **WHEN** l'acheteur augmente la quantité sans dépasser le stock disponible
- **THEN** la quantité et le sous-total de l'article sont recalculés

#### Scenario: Augmentation au-delà du stock

- **WHEN** l'acheteur tente de dépasser le stock disponible
- **THEN** la quantité est bloquée au maximum disponible avec le message « stock maximum atteint »

#### Scenario: Quantité minimale

- **WHEN** la quantité d'un article est de 1 et que l'acheteur la diminue
- **THEN** la quantité reste à 1 et l'interface invite à supprimer l'article pour le retirer

### Requirement: Suppression d'un article

L'acheteur SHALL pouvoir retirer une ligne du panier ; la suppression recalcule immédiatement les totaux et, si le panier devient vide, un état vide est affiché.

#### Scenario: Suppression d'un article

- **WHEN** l'acheteur supprime une ligne du panier
- **THEN** la ligne disparaît et le nombre d'articles et les totaux sont recalculés

#### Scenario: Panier vidé

- **WHEN** l'acheteur supprime le dernier article du panier
- **THEN** un état vide invite à parcourir le catalogue

### Requirement: Affichage détaillé des montants

Le panier SHALL afficher pour chaque article le prix unitaire et le sous-total, puis le montant des produits, les frais de livraison affichés séparément, et le montant total égal à la somme des produits et des frais de livraison. Les frais de livraison SHALL être calculés par producteur et non saisis par l'utilisateur.

#### Scenario: Calcul des sous-totaux

- **WHEN** le panier contient un article de 3 unités à 1 000 FCFA
- **THEN** la ligne affiche 3 000 FCFA en sous-total et le montant des produits inclut 3 000 FCFA

#### Scenario: Frais de livraison séparés du montant des produits

- **WHEN** le panier affiche un montant de produits de 10 000 FCFA et des frais de livraison de 1 500 FCFA
- **THEN** les deux montants sont affichés distinctement et le total affiché est 11 500 FCFA

#### Scenario: Frais recalculés après modification

- **WHEN** l'acheteur retire le dernier article d'un producteur
- **THEN** les frais de livraison correspondant à ce producteur sont retirés du total

### Requirement: Regroupement du panier par producteur

Le panier SHALL regrouper les articles par producteur, afficher pour chaque groupe son montant et ses frais de livraison, et la validation SHALL produire une commande par producteur.

#### Scenario: Panier multi-producteurs

- **WHEN** le panier contient des articles de deux producteurs
- **THEN** deux groupes distincts sont affichés et la validation crée deux commandes, une par producteur

#### Scenario: Confirmation après validation

- **WHEN** la validation d'un panier multi-producteurs aboutit
- **THEN** un récapitulatif liste chaque commande créée avec sa référence et son producteur

### Requirement: Vérification des stocks avant validation

Avant de créer la commande, le système SHALL revérifier la disponibilité de chaque article ; si un article est épuisé, inactif ou insuffisant, la validation SHALL être bloquée et l'article signalé.

#### Scenario: Stock insuffisant au moment de la validation

- **WHEN** un article dépasse le stock disponible au moment de la validation
- **THEN** aucune commande n'est créée, l'article est mis en évidence et la quantité ajustable est proposée

#### Scenario: Produit devenu inactif ou supprimé

- **WHEN** un article du panier correspond à un produit devenu inactif ou supprimé
- **THEN** l'article est signalé comme indisponible et la validation reste bloquée jusqu'à son retrait ou son ajustement

#### Scenario: Tous les articles disponibles

- **WHEN** tous les articles sont disponibles en quantité suffisante
- **THEN** la validation se poursuit vers la création des commandes

### Requirement: Conservation locale du panier

Le panier SHALL être conservé localement, rattaché à l'acheteur connecté, afin qu'il survive à une actualisation ; il SHALL être vidé après validation réussie et un changement de compte SHALL afficher le panier du compte concerné.

#### Scenario: Actualisation de la page

- **WHEN** l'acheteur actualise le navigateur alors que son panier contient des articles
- **THEN** les articles, quantités et totaux sont restaurés à l'identique

#### Scenario: Panier vidé après commande

- **WHEN** la validation du panier réussit
- **THEN** le panier est vide et un nouveau passage au catalogue repart d'un panier vide

#### Scenario: Changement de compte

- **WHEN** un acheteur se déconnecte et qu'un autre acheteur se connecte
- **THEN** ce dernier voit son propre panier, et non celui du compte précédent

#### Scenario: Données de panier illisibles

- **WHEN** les données locales du panier sont corrompues
- **THEN** le panier est réinitialisé à vide et un message en informe l'acheteur, sans erreur bloquante
