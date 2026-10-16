# Spec Delta

## Purpose

Organiser le transport des commandes validées : création et attribution d'une livraison à un livreur, mise à jour des statuts par le livreur autorisé, suivi par l'acheteur et conservation d'un historique horodaté des étapes.

## ADDED Requirements

### Requirement: Informations obligatoires d'une livraison

Une livraison SHALL comporter un identifiant, la référence de la commande concernée, le livreur attribué (vide avant attribution), l'adresse de destination, un statut, la date d'affectation, la date de livraison, un commentaire et un historique horodaté des changements.

#### Scenario: Consultation d'une livraison

- **WHEN** un ayant droit ouvre le détail d'une livraison
- **THEN** toutes ces informations sont affichées, l'historique compris

#### Scenario: Livraison non encore attribuée

- **WHEN** une livraison existe sans livreur attribué
- **THEN** le statut est EN_ATTENTE, le livreur est vide et la date d'affectation n'est pas renseignée

### Requirement: Création d'une livraison après validation de la commande

La création d'une livraison SHALL être possible uniquement pour une commande au statut CONFIRMEE, EN_PREPARATION ou PRETE, et SHALL être refusée s'il existe déjà une livraison active (ni LIVREE ni ECHEC) pour cette même commande ; une commande peut avoir plusieurs livraisons au fil du temps, mais une seule active à la fois.

#### Scenario: Création sur commande éligible

- **WHEN** l'administrateur crée une livraison pour une commande CONFIRMEE sans livraison active
- **THEN** la livraison est créée au statut EN_ATTENTE avec l'adresse de livraison de la commande et un historique initial

#### Scenario: Commande non éligible

- **WHEN** l'administrateur tente de créer une livraison pour une commande EN_ATTENTE, LIVREE ou ANNULEE
- **THEN** la création est refusée avec un message indiquant le motif

#### Scenario: Livraison active déjà présente

- **WHEN** une livraison active existe déjà pour la commande
- **THEN** une nouvelle livraison ne peut pas être créée

#### Scenario: Nouvelle tentative après échec

- **WHEN** une livraison a échoué et que la commande est revenue à PRETE
- **THEN** l'administrateur peut créer une nouvelle livraison, la livraison échouée restant consultable comme historique

### Requirement: Attribution d'un livreur par l'administrateur

L'administrateur SHALL attribuer une livraison à un compte LIVREUR actif, ce qui fait passer la livraison à ASSIGNEE, renseigne la date d'affectation et déclenche le passage de la commande à EN_LIVRAISON ; l'attribution d'un livreur SHALL exiger que la commande soit au statut PRETE.

#### Scenario: Attribution valide

- **WHEN** l'administrateur attribue un livreur actif à la livraison d'une commande PRETE
- **THEN** la livraison passe à ASSIGNEE, la date d'affectation est enregistrée et la commande passe à EN_LIVRAISON

#### Scenario: Livreur inactif ou inexistant

- **WHEN** l'administrateur sélectionne un compte qui n'est pas un livreur actif
- **THEN** l'attribution est refusée avec un message et la livraison reste EN_ATTENTE

#### Scenario: Commande pas encore prête

- **WHEN** l'administrateur tente d'attribuer un livreur alors que la commande n'est pas au statut PRETE
- **THEN** l'attribution est refusée avec un message expliquant que la commande n'est pas prête

### Requirement: Consultation des missions par le livreur

Le livreur SHALL disposer d'une liste de ses missions, groupées par statut, contenant pour chacune la référence de commande, l'adresse de destination, le statut et les dates utiles, ainsi qu'un état vide lorsqu'aucune mission ne lui est attribuée.

#### Scenario: Missions groupées

- **WHEN** le livreur ouvre son espace
- **THEN** ses livraisons sont présentées par statut (à prendre en charge, en cours, terminées, en échec)

#### Scenario: Aucune mission

- **WHEN** aucune livraison ne lui est attribuée
- **THEN** un état vide est affiché

#### Scenario: Périmètre des missions

- **WHEN** le livreur consulte sa liste
- **THEN** seules les livraisons qui lui sont attribuées apparaissent

### Requirement: Mise à jour du statut de livraison par le livreur autorisé

Seul le livreur attribué à une livraison SHALL pouvoir la faire progresser : ASSIGNEE → EN_COURS puis EN_COURS → LIVREE, ou déclarer un échec ; ECHEC est accessible depuis ASSIGNEE ou EN_COURS et exige un commentaire obligatoire.

#### Scenario: Prise en charge

- **WHEN** le livreur attribué marque une livraison ASSIGNEE comme en cours
- **THEN** le statut devient EN_COURS et un événement horodaté est ajouté

#### Scenario: Livraison confirmée

- **WHEN** le livreur attribué marque une livraison EN_COURS comme livrée
- **THEN** le statut devient LIVREE, la date de livraison est renseignée et la commande passe à LIVREE

#### Scenario: Échec avec commentaire

- **WHEN** le livreur marque une livraison ASSIGNEE ou EN_COURS comme échouée en saisissant un commentaire
- **THEN** le statut devient ECHEC, le commentaire est enregistré et la commande repasse à PRETE afin de permettre une nouvelle tentative

#### Scenario: Échec sans commentaire

- **WHEN** le livreur tente de déclarer un échec sans saisir de commentaire
- **THEN** l'action est refusée avec le message « un commentaire est obligatoire en cas d'échec » et le statut reste inchangé

#### Scenario: Transition invalide

- **WHEN** une transition hors ASSIGNEE → EN_COURS, EN_COURS → LIVREE, ASSIGNEE → ECHEC ou EN_COURS → ECHEC est demandée
- **THEN** elle est refusée avec un message indiquant les transitions possibles

#### Scenario: Livraison non attribuée

- **WHEN** un livreur tente de mettre à jour une livraison qui ne lui est pas attribuée
- **THEN** l'action est refusée et le statut reste inchangé

#### Scenario: Mise à jour depuis un statut final

- **WHEN** une mise à jour est demandée sur une livraison LIVREE ou en ECHEC
- **THEN** elle est refusée car le statut est final

### Requirement: Suivi de la livraison par l'acheteur

L'acheteur SHALL consulter l'état de la livraison associée à chacune de ses commandes (statut, livreur quand il est attribué, date d'affectation, date de livraison, commentaire) ; tout autre acheteur ne doit pas y accéder.

#### Scenario: Suivi depuis la commande

- **WHEN** l'acheteur ouvre le suivi d'une de ses commandes dont la livraison est attribuée
- **THEN** le statut de la livraison, le nom du livreur et les dates sont affichés

#### Scenario: Accès à la livraison d'un autre acheteur

- **WHEN** un acheteur tente d'ouvrir le suivi d'une livraison rattachée à une autre commande que les siennes
- **THEN** l'accès est refusé

#### Scenario: Commandes sans livraison

- **WHEN** l'acheteur consulte une commande dont la livraison n'existe pas encore
- **THEN** un message indique que la livraison sera organisée après préparation

### Requirement: Historique horodaté des livraisons

Chaque changement de statut d'une livraison SHALL produire une entrée d'historique contenant l'ancien statut, le nouveau statut, l'auteur du changement, la date et l'heure, et le commentaire éventuel, affichée dans l'ordre chronologique.

#### Scenario: Enregistrement d'un changement

- **WHEN** le statut d'une livraison change
- **THEN** une nouvelle entrée horodatée est ajoutée à l'historique

#### Scenario: Consultation de l'historique

- **WHEN** un ayant droit affiche l'historique d'une livraison
- **THEN** les étapes apparaissent de la plus ancienne à la plus récente, avec auteur et horodatage

#### Scenario: Historique conservé après échec et nouvelle tentative

- **WHEN** une livraison échoue puis qu'une nouvelle livraison est créée pour la même commande
- **THEN** l'historique de la livraison échouée reste consultable

### Requirement: Vue d'ensemble des livraisons pour l'administrateur

L'administrateur SHALL consulter toutes les livraisons avec leur commande, leur livreur, leur adresse, leur statut et leurs dates, et SHALL pouvoir filtrer par statut.

#### Scenario: Liste complète

- **WHEN** l'administrateur ouvre la supervision des livraisons
- **THEN** toutes les livraisons apparaissent avec leur statut et leur livreur

#### Scenario: Filtrage par statut

- **WHEN** l'administrateur filtre sur le statut EN_ATTENTE
- **THEN** seules les livraisons en attente d'attribution sont affichées

#### Scenario: Aucune livraison

- **WHEN** aucune livraison n'existe
- **THEN** un état vide est affiché
