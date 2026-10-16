# Spec Delta

## Purpose

Gérer le cycle de vie des produits agricoles publiés par les producteurs — création, consultation, modification, suppression, stock et statut — et permettre aux acheteurs de les trouver par recherche, filtres et tri.

## ADDED Requirements

### Requirement: Informations obligatoires d'un produit

Un produit SHALL comporter un identifiant unique, l'identifiant de son producteur, un nom, une description, une catégorie, un prix, une unité de vente, une quantité disponible, une localisation, une image, un statut actif ou inactif et une date de création ; la création et la modification SHALL refuser toute soumission où un champ obligatoire est vide ou invalide.

#### Scenario: Création avec tous les champs valides

- **WHEN** un producteur soumet un nom, une description, une catégorie, un prix strictement positif, une unité, une quantité positive ou nulle, une localisation et une image
- **THEN** le produit est créé avec un identifiant unique, le statut actif par défaut et la date du jour

#### Scenario: Champ obligatoire manquant

- **WHEN** un producteur soumet le formulaire sans nom, sans catégorie, sans unité, sans localisation ou sans image
- **THEN** un message d'erreur s'affiche sous chaque champ manquant et le produit n'est pas créé

#### Scenario: Valeur numérique invalide

- **WHEN** le prix est négatif ou nul, ou la quantité disponible est négative
- **THEN** la création est refusée avec un message indiquant la valeur attendue

### Requirement: Catégories autorisées

Un produit SHALL appartenir à l'une des catégories céréales, légumes, fruits, tubercules, légumineuses ou produits transformés ; toute autre valeur est refusée.

#### Scenario: Catégorie de la liste

- **WHEN** un producteur choisit une catégorie parmi les six proposées
- **THEN** le produit est enregistré avec cette catégorie

#### Scenario: Catégorie hors liste

- **WHEN** une catégorie absente de la liste est transmise
- **THEN** l'enregistrement est refusé avec un message d'erreur

### Requirement: Modification réservée au producteur propriétaire

Seul le producteur propriétaire d'un produit SHALL pouvoir modifier ses informations ; l'administrateur peut en outre modérer un produit conformément à la capacité d'administration.

#### Scenario: Modification par le propriétaire

- **WHEN** le producteur du produit modifie le prix ou la quantité disponible
- **THEN** les nouvelles valeurs sont enregistrées et visibles au catalogue

#### Scenario: Modification par un autre utilisateur

- **WHEN** un autre producteur tente de modifier ce produit
- **THEN** la modification est refusée et les valeurs restent inchangées

### Requirement: Suppression d'un produit avec confirmation

La suppression d'un produit SHALL exiger une confirmation explicite et SHALL être refusée lorsqu'une commande non terminée référence ce produit ; dans ce cas l'interface propose de passer le produit au statut inactif.

#### Scenario: Confirmation acceptée

- **WHEN** le producteur confirme la suppression d'un produit sans commande en cours
- **THEN** le produit est retiré du catalogue et n'apparaît plus dans les listes

#### Scenario: Confirmation refusée

- **WHEN** le producteur annule la boîte de confirmation
- **THEN** le produit reste inchangé et aucune donnée n'est supprimée

#### Scenario: Produit référencé par une commande en cours

- **WHEN** le produit figure dans une commande dont le statut n'est ni LIVREE ni ANNULEE
- **THEN** la suppression est refusée avec un message proposant de désactiver le produit à la place

### Requirement: Statut actif ou inactif

Un produit inactif SHALL rester visible pour son producteur et l'administrateur mais SHALL être exclu du catalogue public, de la mise en avant et de l'ajout au panier.

#### Scenario: Passage en inactif

- **WHEN** un producteur désactive un de ses produits
- **THEN** le produit disparaît du catalogue public mais reste listé dans son espace de gestion avec la mention « inactif »

#### Scenario: Produit inactif non commandable

- **WHEN** un acheteur ouvre la fiche d'un produit devenu inactif
- **THEN** l'ajout au panier est désactivé avec un message « produit indisponible »

### Requirement: Gestion du stock par le producteur

Le producteur SHALL ajuster la quantité disponible de son produit ; la quantité SHALL ne jamais être négative et SHALL ne pas descendre en dessous des quantités déjà engagées dans des commandes non livrées ni annulées.

#### Scenario: Augmentation du stock

- **WHEN** le producteur augmente la quantité disponible
- **THEN** la nouvelle quantité est enregistrée et affichée aux acheteurs

#### Scenario: Diminution sous les quantités engagées

- **WHEN** le producteur saisit une quantité inférieure à la somme des quantités de ses commandes en cours
- **THEN** la modification est refusée avec un message indiquant la quantité minimale autorisée

### Requirement: Refus de vente d'un produit indisponible

Aucune vente SHALL être possible pour un produit inactif ou dont la quantité disponible est nulle, et une quantité demandée supérieure au stock disponible SHALL être refusée avec la quantité maximale autorisée.

#### Scenario: Produit épuisé

- **WHEN** un acheteur ouvre la fiche d'un produit dont la quantité disponible est zéro
- **THEN** le bouton d'ajout au panier est désactivé et un message « rupture de stock » s'affiche

#### Scenario: Quantité demandée supérieure au stock

- **WHEN** un acheteur demande une quantité supérieure au stock disponible
- **THEN** la demande est refusée et un message indique la quantité maximale possible

### Requirement: Recherche par nom

Le catalogue SHALL proposer une recherche par nom qui ignore la casse et les espaces superflus et retourne tous les produits actifs dont le nom contient le texte recherché.

#### Scenario: Correspondance partielle

- **WHEN** l'utilisateur saisit « riz » ou « RIZ »
- **THEN** tous les produits actifs dont le nom contient « riz » sont affichés

#### Scenario: Aucun résultat

- **WHEN** la recherche ne correspond à aucun produit actif
- **THEN** un état vide « aucun produit ne correspond à votre recherche » est affiché sans erreur

### Requirement: Filtres combinables

Le catalogue SHALL proposer des filtres par catégorie, prix minimum, prix maximum, disponibilité et localisation, applicables simultanément, et SHALL indiquer clairement comment les réinitialiser.

#### Scenario: Filtres combinés

- **WHEN** l'utilisateur sélectionne la catégorie tubercules, un prix maximum de 5 000 FCFA et la disponibilité « en stock »
- **THEN** seuls les produits satisfaisant les trois critères sont affichés

#### Scenario: Aucun produit ne satisfait les filtres

- **WHEN** la combinaison de filtres ne renvoie aucun produit
- **THEN** un état vide est affiché avec un bouton de réinitialisation des filtres

### Requirement: Tri des résultats

Le catalogue SHALL permettre de trier les produits par prix croissant, prix décroissant, date de création la plus récente et date de création la plus ancienne, le tri le plus récent étant appliqué par défaut.

#### Scenario: Tri par prix

- **WHEN** l'utilisateur choisit le tri par prix croissant
- **THEN** les produits sont affichés du moins cher au plus cher en respectant les filtres actifs

#### Scenario: Tri par date

- **WHEN** l'utilisateur choisit le tri par date de création la plus récente
- **THEN** les produits les plus récents apparaissent en premier

### Requirement: Fiche détaillée d'un produit

Chaque produit SHALL disposer d'une fiche détaillée affichant son image, son nom, sa description complète, sa catégorie, son prix, son unité de vente, sa quantité disponible, sa localisation, la date de mise en ligne et l'identité du producteur, ainsi qu'un accès à l'ajout au panier lorsque le produit est disponible.

#### Scenario: Ouverture d'une fiche

- **WHEN** un acheteur ouvre la fiche d'un produit actif disponible
- **THEN** toutes les informations du produit et l'action d'ajout au panier sont affichées

#### Scenario: Produit inexistant

- **WHEN** l'adresse d'une fiche référence un identifiant inconnu
- **THEN** un message « produit introuvable » est affiché avec un lien vers le catalogue

### Requirement: Liste de gestion des produits du producteur

L'espace producteur SHALL lister ses produits avec nom, catégorie, prix, quantité disponible, statut et date de création, ainsi que les actions Modifier, Supprimer et Gérer le stock, et SHALL afficher un état vide accompagné d'un appel à créer un premier produit.

#### Scenario: Producteur sans produit

- **WHEN** un producteur n'a publié aucun produit
- **THEN** un état vide l'invite à créer son premier produit

#### Scenario: Vue de gestion

- **WHEN** un producteur ouvre la gestion de ses produits
- **THEN** il voit le statut et le stock de chacun de ses produits et peut agir dessus
