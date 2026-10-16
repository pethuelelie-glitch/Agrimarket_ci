# Spec Delta

## Purpose

Créer et suivre les commandes issues du panier d'un acheteur, appliquer les transitions de statut autorisées par rôle et maintenir la cohérence entre les commandes et le stock des produits.

## ADDED Requirements

### Requirement: Informations obligatoires d'une commande

Une commande SHALL comporter un identifiant unique, une référence lisible, l'acheteur, le producteur, la liste des articles avec quantités et prix unitaires figés au moment de l'achat, le montant des produits, les frais de livraison, le montant total, l'adresse de livraison, la date de création et le statut.

#### Scenario: Affichage complet d'une commande

- **WHEN** un ayant droit ouvre le détail d'une commande
- **THEN** l'ensemble de ces informations est affiché, montant total inclus

#### Scenario: Prix figé malgré un changement ultérieur

- **WHEN** le producteur modifie le prix du produit après la commande
- **THEN** la commande conserve le prix unitaire appliqué au moment de l'achat

#### Scenario: Montant total cohérent

- **WHEN** une commande est affichée
- **THEN** le montant total est égal au montant des produits plus les frais de livraison

### Requirement: Création d'une commande à partir du panier

La validation du panier SHALL créer, dans une même opération, une commande par producteur représenté : référence générée, prix unitaires figés, statut EN_ATTENTE, adresse de livraison reprise du profil ou saisie, décrément du stock des articles commandés et vidage du panier correspondant.

#### Scenario: Validation d'un panier mono-producteur

- **WHEN** l'acheteur valide un panier ne contenant que des articles d'un seul producteur
- **THEN** une commande EN_ATTENTE est créée, le stock des articles est décrémenté et le panier est vidé

#### Scenario: Validation d'un panier multi-producteurs

- **WHEN** l'acheteur valide un panier contenant des articles de deux producteurs et que tous sont disponibles
- **THEN** deux commandes EN_ATTENTE sont créées, une par producteur, chacune avec ses articles et ses frais

#### Scenario: Panier vide

- **WHEN** l'acheteur tente de valider un panier vide
- **THEN** aucune commande n'est créée et l'interface invite à ajouter des produits

#### Scenario: Commande impossible en l'absence d'adresse

- **WHEN** aucune adresse de livraison n'est renseignée
- **THEN** la validation est bloquée avec un message demandant une adresse

### Requirement: Référence de commande lisible et unique

Chaque commande SHALL recevoir une référence lisible de la forme CMD-AAAAMMJJ-XXXX, unique sur l'ensemble des commandes enregistrées localement, affichée à l'acheteur, au producteur et à l'administrateur.

#### Scenario: Format de la référence

- **WHEN** une commande est créée
- **THEN** sa référence respecte le format CMD-AAAAMMJJ-XXXX et comporte la date de création

#### Scenario: Unicité

- **WHEN** deux commandes sont créées le même jour
- **THEN** leurs références sont différentes

### Requirement: Consultation et accès au détail d'une commande

Le détail d'une commande SHALL être accessible à l'acheteur qui l'a passée, au producteur concerné et à l'administrateur, et refusé à tout autre utilisateur, y compris au livreur qui n'y accède que par sa mission de livraison.

#### Scenario: Acheteur propriétaire

- **WHEN** l'acheteur ouvre le détail d'une de ses commandes
- **THEN** le détail et l'historique de statut sont affichés

#### Scenario: Producteur concerné

- **WHEN** le producteur ouvre le détail d'une commande qui le concerne
- **THEN** les articles, quantités et l'acheteur sont affichés

#### Scenario: Utilisateur non autorisé

- **WHEN** un utilisateur sans lien avec la commande en demande le détail
- **THEN** l'accès est refusé et le détail n'est pas affiché

#### Scenario: Commande introuvable

- **WHEN** la référence demandée n'existe pas
- **THEN** un message « commande introuvable » est affiché

### Requirement: Historique des commandes de l'acheteur

L'acheteur SHALL disposer d'une liste de ses commandes, triée de la plus récente à la plus ancienne, avec référence, date, producteur, montant total et statut, ainsi qu'un état vide lorsqu'il n'a jamais commandé.

#### Scenario: Acheteur avec commandes

- **WHEN** l'acheteur ouvre son historique
- **THEN** ses commandes apparaissent de la plus récente à la plus ancienne avec leur statut

#### Scenario: Acheteur sans commande

- **WHEN** l'acheteur n'a passé aucune commande
- **THEN** un état vide l'invite à parcourir le catalogue

### Requirement: Confirmation de la commande par le producteur

Le producteur concerné SHALL confirmer une commande au statut EN_ATTENTE pour la faire passer à CONFIRMEE ; il SHALL également pouvoir la refuser, ce qui annule la commande selon les règles d'annulation.

#### Scenario: Confirmation

- **WHEN** le producteur confirme une commande EN_ATTENTE
- **THEN** le statut devient CONFIRMEE, la date et l'auteur du changement sont enregistrés et l'acheteur voit le nouveau statut

#### Scenario: Confirmation d'une commande déjà confirmée

- **WHEN** le producteur tente de confirmer une commande dont le statut n'est pas EN_ATTENTE
- **THEN** l'action est refusée avec un message indiquant le statut actuel

#### Scenario: Refus par le producteur

- **WHEN** le producteur refuse une commande EN_ATTENTE
- **THEN** la commande passe à ANNULEE et le stock réservé est restitué

### Requirement: Progression de la préparation par le producteur

Le producteur SHALL faire passer une commande confirmée à EN_PREPARATION puis à PRETE ; cette progression SHALL être la seule voie menant à l'expédition.

#### Scenario: Passage en préparation

- **WHEN** le producteur marque une commande CONFIRMEE comme en préparation
- **THEN** le statut devient EN_PREPARATION et l'acheteur est informé

#### Scenario: Commande prête

- **WHEN** le producteur marque une commande EN_PREPARATION comme prête
- **THEN** le statut devient PRETE et la commande devient éligible à l'attribution d'un livreur

### Requirement: Transitions de statut autorisées

Le système SHALL n'autoriser que les transitions EN_ATTENTE → CONFIRMEE, CONFIRMEE → EN_PREPARATION, EN_PREPARATION → PRETE, PRETE → EN_LIVRAISON, EN_LIVRAISON → LIVREE, ainsi que le passage à ANNULEE selon les règles d'annulation ; toute autre transition SHALL être refusée sans modifier la commande.

#### Scenario: Transition valide

- **WHEN** une transition figurant dans la liste est demandée par un utilisateur autorisé
- **THEN** le statut est mis à jour et un événement horodaté est ajouté à l'historique de la commande

#### Scenario: Transition invalide

- **WHEN** une transition absente de la liste est demandée, par exemple EN_ATTENTE → PRETE
- **THEN** la demande est refusée avec un message indiquant les transitions possibles depuis le statut courant

#### Scenario: Transition depuis un statut final

- **WHEN** une transition est demandée sur une commande LIVREE ou ANNULEE
- **THEN** la demande est refusée car ces statuts sont finaux

### Requirement: Passage en livraison et clôture

Une commande PRETE SHALL passer à EN_LIVRAISON dès que sa livraison est attribuée à un livreur, et SHALL passer à LIVREE lorsque la livraison correspondante est confirmée livrée ; ces transitions sont déclenchées par le module de livraison et non par une action directe sur la commande.

#### Scenario: Attribution d'un livreur

- **WHEN** l'administrateur attribue un livreur à la livraison d'une commande PRETE
- **THEN** la commande passe à EN_LIVRAISON

#### Scenario: Livraison confirmée

- **WHEN** le livreur marque la livraison comme livrée
- **THEN** la commande passe à LIVREE et le statut final est figé

#### Scenario: Aucune transition manuelle vers EN_LIVRAISON

- **WHEN** un utilisateur tente de faire passer une commande PRETE à EN_LIVRAISON sans livraison attribuée
- **THEN** l'action est refusée ou sans effet, l'état restant PRETE

### Requirement: Annulation selon les règles par rôle

L'annulation SHALL être possible pour l'acheteur sur une commande EN_ATTENTE ou CONFIRMEE, pour le producteur sur une commande EN_ATTENTE ou CONFIRMEE, et pour l'administrateur sur tout statut sauf LIVREE et ANNULEE ; une annulation SHALL restituer le stock réservé et clôturer toute livraison active en échec.

#### Scenario: Annulation par l'acheteur avant préparation

- **WHEN** l'acheteur annule une commande EN_ATTENTE ou CONFIRMEE
- **THEN** le statut devient ANNULEE et le stock des articles est restitué

#### Scenario: Annulation refusée après préparation

- **WHEN** l'acheteur tente d'annuler une commande au statut EN_PREPARATION ou ultérieur
- **THEN** l'annulation est refusée avec un message expliquant la règle

#### Scenario: Annulation par l'administrateur avec livraison active

- **WHEN** l'administrateur annule une commande dont la livraison est EN_ATTENTE, ASSIGNEE ou EN_COURS
- **THEN** la commande passe à ANNULEE, la livraison passe à ECHEC avec le commentaire « commande annulée » et le stock est restitué

#### Scenario: Annulation d'une commande livrée

- **WHEN** une annulation est demandée sur une commande LIVREE
- **THEN** elle est refusée car le statut est final

### Requirement: Cohérence des stocks lors des commandes

Le stock SHALL être décrémenté une seule fois à la création de la commande, restitué une seule fois en cas d'annulation, et jamais rendu négatif ; les transitions de statut autres que l'annulation SHALL ne pas modifier le stock.

#### Scenario: Décrément à la création

- **WHEN** une commande de trois unités est créée pour un produit à dix unités
- **THEN** la quantité disponible du produit devient sept

#### Scenario: Restitution à l'annulation

- **WHEN** cette commande est annulée
- **THEN** la quantité disponible redevient dix

#### Scenario: Pas de double restitution

- **WHEN** une seconde annulation est tentée sur une commande déjà ANNULEE
- **THEN** elle est refusée et le stock n'est pas augmenté de nouveau

#### Scenario: Stock jamais négatif

- **WHEN** une commande est créée après contrôle de disponibilité
- **THEN** la quantité disponible résultante est supérieure ou égale à zéro

### Requirement: Consentement à l'adresse de livraison

L'acheteur SHALL pouvoir modifier l'adresse de livraison d'une commande uniquement tant que son statut est EN_ATTENTE ou CONFIRMEE ; au-delà, l'adresse est figée.

#### Scenario: Modification avant préparation

- **WHEN** l'acheteur modifie l'adresse d'une commande EN_ATTENTE
- **THEN** la nouvelle adresse est enregistrée et visible par le producteur

#### Scenario: Modification après préparation

- **WHEN** l'acheteur tente de modifier l'adresse d'une commande EN_PREPARATION ou ultérieure
- **THEN** l'action est refusée avec un message expliquant que l'adresse est figée
