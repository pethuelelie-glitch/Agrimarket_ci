# Spec Delta

## Purpose

Afficher à chaque rôle des indicateurs calculés exclusivement à partir des données locales, afin de donner une vue d'activité fiable sans aucune valeur figée ni chiffre inventé.

## ADDED Requirements

### Requirement: Tableau de bord administrateur
Le tableau de bord administrateur SHALL afficher le nombre d'utilisateurs, le nombre de producteurs, le nombre de produits actifs, le nombre de commandes par statut, le nombre de livraisons en cours, le nombre de livraisons terminées et l'évolution des commandes dans le temps.

#### Scenario: Indicateurs globaux affichés
- **WHEN** l'administrateur ouvre son tableau de bord
- **THEN** les compteurs d'utilisateurs, de producteurs, de produits actifs, de commandes par statut et de livraisons en cours et terminées sont affichés

#### Scenario: Répartition des commandes par statut
- **WHEN** l'administrateur consulte la répartition des commandes
- **THEN** chaque statut (EN_ATTENTE, CONFIRMEE, EN_PREPARATION, PRETE, EN_LIVRAISON, LIVREE, ANNULEE) est présenté avec son nombre de commandes

#### Scenario: Évolution des commandes
- **WHEN** l'administrateur consulte l'évolution des commandes
- **THEN** le nombre de commandes est présenté par jour sur une période glissante calculée à partir des dates de création

### Requirement: Tableau de bord producteur
Le tableau de bord producteur SHALL afficher, pour le producteur connecté uniquement, le nombre de produits actifs, le stock disponible cumulé, le nombre de commandes reçues, les quantités vendues et le montant des ventes.

#### Scenario: Indicateurs du producteur
- **WHEN** un producteur ouvre son tableau de bord
- **THEN** ses produits actifs, son stock disponible, ses commandes reçues, ses quantités vendues et le montant de ses ventes sont affichés

#### Scenario: Périmètre des données
- **WHEN** le tableau de bord producteur est affiché
- **THEN** aucun produit ni aucune commande d'un autre producteur n'entre dans les calculs

#### Scenario: Définition des ventes prises en compte
- **WHEN** le montant des ventes est calculé
- **THEN** il additionne les montants des commandes du producteur non annulées

### Requirement: Tableau de bord acheteur
Le tableau de bord acheteur SHALL afficher, pour l'acheteur connecté uniquement, le nombre de commandes en cours, le nombre de commandes livrées et un accès à son historique d'achats.

#### Scenario: Indicateurs de l'acheteur
- **WHEN** un acheteur ouvre son tableau de bord
- **THEN** ses commandes en cours, ses commandes livrées et l'accès à son historique sont affichés

#### Scenario: Définition des commandes en cours
- **WHEN** le nombre de commandes en cours est calculé
- **THEN** il regroupe les commandes dont le statut n'est ni LIVREE ni ANNULEE

#### Scenario: Accès à l'historique
- **WHEN** l'acheteur clique sur Historique des achats
- **THEN** la liste de ses commandes passées s'affiche

### Requirement: Tableau de bord livreur
Le tableau de bord livreur SHALL afficher, pour le livreur connecté uniquement, le nombre de missions attribuées, le nombre de livraisons en cours, le nombre de livraisons terminées et le nombre de livraisons en échec.

#### Scenario: Indicateurs du livreur
- **WHEN** un livreur ouvre son tableau de bord
- **THEN** ses missions attribuées, ses livraisons en cours, terminées et en échec sont affichées

#### Scenario: Périmètre des données
- **WHEN** les indicateurs du livreur sont calculés
- **THEN** seules les livraisons qui lui sont attribuées sont comptées

### Requirement: Calculs fondés uniquement sur les données locales
Tous les indicateurs SHALL être calculés à partir des données effectivement enregistrées localement ; aucun chiffre arbitraire, valeur de démonstration fixe ou résultat aléatoire NE DOIT apparaître dans un tableau de bord.

#### Scenario: Base de données vide
- **WHEN** aucune donnée métier n'existe
- **THEN** tous les compteurs affichent zéro

#### Scenario: Cohérence avec les listes
- **WHEN** un compteur de produits actifs est affiché pour un producteur
- **THEN** sa valeur est égale au nombre de produits actifs visibles dans sa liste de gestion

#### Scenario: Réaction à une action
- **WHEN** un producteur crée un nouveau produit
- **THEN** le compteur de produits actifs augmente en conséquence

### Requirement: États vides des tableaux de bord
Chaque tableau de bord SHALL afficher un état vide explicite avec une action suggérée lorsqu'il n'y a aucune donnée à représenter, sans masquer les indicateurs par une erreur.

#### Scenario: Aucune donnée pour le rôle
- **WHEN** un utilisateur dont le rôle n'a encore aucune donnée ouvre son tableau de bord
- **THEN** les compteurs affichent zéro et un message propose une première action (par exemple créer un produit ou parcourir le catalogue)

### Requirement: Accès aux tableaux de bord par rôle
Chaque tableau de bord SHALL être accessible uniquement au rôle concerné, le tableau de bord administrateur étant réservé aux administrateurs.

#### Scenario: Accès au bon tableau de bord
- **WHEN** un utilisateur connecté ouvre son tableau de bord
- **THEN** celui correspondant à son rôle s'affiche

#### Scenario: Accès au tableau de bord d'un autre rôle
- **WHEN** un utilisateur tente d'ouvrir le tableau de bord d'un autre rôle
- **THEN** l'accès est refusé et il est redirigé vers le sien
