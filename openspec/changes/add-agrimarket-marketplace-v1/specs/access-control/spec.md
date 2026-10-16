# Spec Delta

## Purpose

Définir les quatre rôles de la plateforme, leurs droits et le périmètre de données de chacun, afin que les écrans et les actions soient réservés au bon profil tout en documentant les limites d'un contrôle d'accès purement côté client.

## ADDED Requirements

### Requirement: Quatre rôles et leurs responsabilités
Le système SHALL reconnaître exactement quatre rôles — ADMIN, PRODUCTEUR, ACHETEUR, LIVREUR — et SHALL refuser toute session dont le rôle ne fait pas partie de cette liste.

#### Scenario: Rôle reconnu
- **WHEN** un utilisateur connecté possède le rôle PRODUCTEUR, ACHETEUR, LIVREUR ou ADMIN
- **THEN** les écrans correspondant à ce rôle lui sont accessibles

#### Scenario: Rôle inconnu dans la session locale
- **WHEN** la session locale contient un rôle hors de cette liste
- **THEN** la session est considérée comme invalide et l'utilisateur est redirigé vers la connexion

### Requirement: Droits du producteur
Un utilisateur PRODUCTEUR SHALL créer des produits, consulter et modifier uniquement les produits dont il est le producteur, gérer son stock, consulter les commandes qui le concernent, confirmer les commandes, en faire évoluer le statut autorisé et consulter ses indicateurs de ventes ; il SHALL ne pas accéder à l'administration, au catalogue de gestion d'autres producteurs ni aux livraisons qui ne lui sont pas confiées.

#### Scenario: Action sur son propre produit
- **WHEN** un producteur ouvre la fiche d'un de ses produits
- **THEN** les actions Modifier, Supprimer et Gérer le stock sont disponibles

#### Scenario: Action sur le produit d'un autre producteur
- **WHEN** un producteur tente d'ouvrir ou de modifier un produit dont il n'est pas le producteur
- **THEN** l'accès est refusé et un message « action non autorisée » est affiché

#### Scenario: Accès aux commandes reçues
- **WHEN** un producteur consulte la liste des commandes
- **THEN** seules les commandes dont il est le producteur apparaissent

### Requirement: Droits de l'acheteur
Un utilisateur ACHETEUR SHALL consulter le catalogue, gérer son panier, créer des commandes, consulter et gérer uniquement ses propres commandes, suivre les livraisons de ses commandes et consulter son historique d'achats ; il SHALL ne pas modifier les produits, ni les statuts réservés au producteur, ni les livraisons.

#### Scenario: Consultation de ses commandes
- **WHEN** un acheteur ouvre la liste de ses commandes
- **THEN** seules ses propres commandes apparaissent

#### Scenario: Consultation de la commande d'un autre acheteur
- **WHEN** un acheteur tente d'ouvrir une commande rattachée à un autre acheteur
- **THEN** l'accès est refusé et aucun détail n'est affiché

#### Scenario: Modification du catalogue interdite
- **WHEN** un acheteur consulte la fiche d'un produit
- **THEN** aucune action de modification, de suppression ou de gestion de stock n'est proposée

### Requirement: Droits du livreur
Un utilisateur LIVREUR SHALL consulter uniquement les livraisons qui lui sont attribuées et mettre à jour leur statut ; il SHALL ne pas consulter le catalogue de gestion, ni les commandes d'autres utilisateurs, ni modifier une livraison qui ne lui est pas attribuée.

#### Scenario: Missions du livreur
- **WHEN** un livreur ouvre son espace de missions
- **THEN** seules les livraisons dont le livreur attribué est lui-même apparaissent

#### Scenario: Mise à jour d'une livraison non attribuée
- **WHEN** un livreur tente de changer le statut d'une livraison attribuée à un autre livreur
- **THEN** l'accès est refusé et le statut reste inchangé

### Requirement: Droits de l'administrateur
Un utilisateur ADMIN SHALL superviser l'ensemble des données de la plateforme : consulter et modifier les comptes autorisés, activer ou désactiver des comptes, modérer les produits, superviser toutes les commandes, attribuer les livreurs, consulter toutes les livraisons et accéder au tableau de bord global.

#### Scenario: Vue globale des données
- **WHEN** un administrateur ouvre son espace d'administration
- **THEN** il peut consulter les utilisateurs, les produits, toutes les commandes et toutes les livraisons

#### Scenario: Accès administrateur refusé aux autres rôles
- **WHEN** un utilisateur non administrateur ouvre directement une adresse de l'espace d'administration
- **THEN** il est redirigé vers sa propre page avec un message d'accès refusé

### Requirement: Contrôle d'accès appliqué à la navigation
Le système SHALL vérifier le rôle à chaque navigation vers un écran protégé et SHALL rendre indisponibles les commandes non autorisées plutôt que de les laisser échouer après soumission.

#### Scenario: Navigation vers un écran protégé
- **WHEN** un utilisateur connecté demande un écran réservé à un autre rôle
- **THEN** la page n'est pas affichée et l'utilisateur est redirigé vers son espace

#### Scenario: Bouton masqué pour un rôle non autorisé
- **WHEN** un écran affiche une action que le rôle courant ne peut pas exécuter
- **THEN** cette action est masquée ou désactivée avec une infobulle indiquant qu'elle ne lui est pas accessible

### Requirement: Prise en compte immédiate d'un compte désactivé
Le système SHALL réévaluer l'état du compte à chaque navigation de sorte qu'un compte désactivé par l'administrateur soit rejeté et sa session locale fermée.

#### Scenario: Navigation avec un compte désactivé
- **WHEN** un utilisateur dont le compte vient d'être désactivé navigue vers un écran protégé
- **THEN** sa session est fermée et il est redirigé vers la connexion avec un message expliquant la désactivation

### Requirement: Limites documentées du contrôle d'accès local
Les contrôles d'accès SHALL être présentés comme des protections d'interface, et non comme une sécurité de production : la documentation visible de l'application SHALL indiquer qu'ils peuvent être contournés par une modification du stockage local et qu'ils ne remplacent pas une vérification côté serveur.

#### Scenario: Mention des limites
- **WHEN** un utilisateur consulte la page d'aide ou de mentions de l'application
- **THEN** la limite du contrôle d'accès côté client est expliquée, y compris le fait qu'un stockage local modifié manuellement peut tromper les gardes

#### Scenario: Contrôle effectif dans le flux normal
- **WHEN** un utilisateur non administrateur accède à une adresse d'administration sans modifier le stockage local
- **THEN** l'accès est refusé
