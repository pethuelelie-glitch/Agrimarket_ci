# Spec Delta

## Purpose

Permettre à l'administrateur de superviser les comptes, les produits, les commandes et les livraisons de la plateforme, avec des permissions et des validations explicites protégeant l'accès à son propre compte.

## ADDED Requirements

### Requirement: Consultation des utilisateurs
L'administrateur SHALL consulter la liste de tous les comptes avec nom, adresse e-mail, rôle, statut actif ou désactivé et date de création, rechercher un compte par nom ou e-mail et accéder au détail d'un compte ; tout autre rôle en est exclu.

#### Scenario: Liste complète
- **WHEN** l'administrateur ouvre la gestion des utilisateurs
- **THEN** tous les comptes apparaissent avec leur rôle et leur statut, les comptes désactivés étant clairement distingués

#### Scenario: Recherche d'un compte
- **WHEN** l'administrateur recherche un nom ou une adresse e-mail
- **THEN** seuls les comptes correspondants sont affichés

#### Scenario: Accès refusé à un non-administrateur
- **WHEN** un utilisateur non administrateur ouvre la gestion des utilisateurs
- **THEN** l'accès est refusé sans afficher la liste

### Requirement: Modification des informations autorisées d'un compte
L'administrateur SHALL pouvoir modifier le nom, la localisation, le rôle, le téléphone éventuel et réinitialiser le mot de passe d'un compte ; l'adresse e-mail SHALL servir d'identifiant unique et NE DOIT pas être modifiable par l'administrateur.

#### Scenario: Modification du nom et de la localisation
- **WHEN** l'administrateur modifie le nom ou la localisation d'un compte et valide
- **THEN** les nouvelles valeurs sont enregistrées et visibles dans la liste des utilisateurs

#### Scenario: Réinitialisation du mot de passe
- **WHEN** l'administrateur réinitialise le mot de passe d'un compte
- **THEN** une nouvelle empreinte non réversible est enregistrée, sans qu'aucun mot de passe ne soit affiché ni stocké en clair

#### Scenario: Modification de l'adresse e-mail refusée
- **WHEN** l'administrateur tente de modifier l'adresse e-mail d'un compte
- **THEN** le champ est en lecture seule et la modification est refusée

#### Scenario: Saisie invalide
- **WHEN** un champ soumis est vide ou de format invalide
- **THEN** la modification est refusée avec un message d'erreur sous le champ concerné

### Requirement: Changement de rôle d'un compte
L'administrateur SHALL pouvoir changer le rôle d'un compte vers l'un des quatre rôles reconnus, ce changement prenant effet à la connexion suivante du compte concerné.

#### Scenario: Changement de rôle
- **WHEN** l'administrateur attribue le rôle LIVREUR à un compte ACHETEUR
- **THEN** le rôle est enregistré et, lors de sa prochaine connexion, l'utilisateur voit les écrans de livreur

#### Scenario: Rôle inconnu refusé
- **WHEN** un rôle hors de la liste des quatre rôles est transmis
- **THEN** le changement est refusé

### Requirement: Activation et désactivation des comptes
L'administrateur SHALL activer ou désactiver un compte ; un compte désactivé NE DOIT pas pouvoir ouvrir de session, et l'administrateur NE DOIT pas pouvoir désactiver son propre compte ni le dernier compte administrateur actif.

#### Scenario: Désactivation d'un compte
- **WHEN** l'administrateur désactive le compte d'un producteur
- **THEN** le compte est marqué comme désactivé et ce producteur ne peut plus se connecter

#### Scenario: Réactivation
- **WHEN** l'administrateur réactive un compte désactivé
- **THEN** le compte peut de nouveau se connecter

#### Scenario: Désactivation de son propre compte refusée
- **WHEN** l'administrateur tente de désactiver le compte avec lequel il est connecté
- **THEN** l'action est refusée avec un message explicatif

#### Scenario: Désactivation du dernier administrateur refusée
- **WHEN** la désactivation laisserait la plateforme sans administrateur actif
- **THEN** l'action est refusée avec un message explicatif

### Requirement: Modération des produits
L'administrateur SHALL consulter tous les produits, y compris ceux appartenant à d'autres producteurs, et SHALL pouvoir les désactiver avec un motif ou les supprimer avec confirmation ; il NE DOIT pas modifier le prix ni le stock d'un produit à la place de son producteur.

#### Scenario: Désactivation d'un produit non conforme
- **WHEN** l'administrateur désactive un produit en saisissant un motif
- **THEN** le produit passe au statut inactif, disparaît du catalogue public et la modération est tracée avec son motif

#### Scenario: Suppression modérée
- **WHEN** l'administrateur confirme la suppression d'un produit non référencé par une commande en cours
- **THEN** le produit est retiré de la plateforme

#### Scenario: Suppression refusée si commande en cours
- **WHEN** le produit figure dans une commande non livrée ni annulée
- **THEN** la suppression est refusée et la désactivation est proposée

#### Scenario: Modification du prix interdite
- **WHEN** l'administrateur ouvre la fiche d'un produit
- **THEN** les champs de prix, d'unité et de stock ne sont pas modifiables

### Requirement: Supervision des commandes
L'administrateur SHALL consulter toutes les commandes, les filtrer par statut et par producteur, accéder à leur détail et les annuler selon les règles d'annulation, sans pouvoir modifier leur contenu.

#### Scenario: Liste et filtres
- **WHEN** l'administrateur filtre les commandes par statut EN_LIVRAISON
- **THEN** seules les commandes de ce statut sont affichées

#### Scenario: Détail d'une commande
- **WHEN** l'administrateur ouvre une commande
- **THEN** les articles, les montants, les statuts de la commande et de sa livraison sont affichés

#### Scenario: Contenu non modifiable
- **WHEN** l'administrateur consulte une commande non annulée
- **THEN** les articles, quantités et montants ne sont pas modifiables

### Requirement: Attribution des livreurs et suivi des livraisons
L'administrateur SHALL consulter toutes les livraisons et attribuer un livreur actif aux livraisons éligibles conformément à la capacité de livraison, et SHALL pouvoir relancer une commande dont la livraison a échoué.

#### Scenario: Attribution depuis l'administration
- **WHEN** l'administrateur attribue un livreur à une livraison EN_ATTENTE d'une commande PRETE
- **THEN** la livraison passe à ASSIGNEE et la commande passe à EN_LIVRAISON

#### Scenario: Relance après échec
- **WHEN** l'administrateur crée une nouvelle livraison pour une commande revenue à PRETE après un échec
- **THEN** la nouvelle livraison est créée et peut être attribuée à un livreur

#### Scenario: Aucun livreur disponible
- **WHEN** aucun compte LIVREUR actif n'existe
- **THEN** l'interface l'indique et aucune attribution n'est possible

### Requirement: Supervision globale et réinitialisation contrôlée
Le tableau de bord d'administration SHALL être accessible à l'administrateur, qui SHALL disposer d'une action protégée de réinitialisation des données de démonstration, refusée à tout autre rôle et précédée d'une confirmation.

#### Scenario: Accès au tableau de bord global
- **WHEN** l'administrateur ouvre son tableau de bord
- **THEN** les indicateurs globaux définis par la capacité de tableau de bord sont affichés

#### Scenario: Réinitialisation confirmée
- **WHEN** l'administrateur confirme la réinitialisation des données de démonstration
- **THEN** les données locales sont remplacées par le jeu de démonstration initial et un message de confirmation est affiché

#### Scenario: Réinitialisation annulée
- **WHEN** l'administrateur ferme la boîte de confirmation sans valider
- **THEN** les données restent inchangées

#### Scenario: Réinitialisation refusée à un autre rôle
- **WHEN** un utilisateur non administrateur tente d'atteindre l'action de réinitialisation
- **THEN** l'action n'est pas disponible
