# Spec Delta

## Purpose

Garantir que toutes les données de la première version sont conservées localement de façon cohérente et remplaçables plus tard par une API, tout en documentant les limites du stockage dans le navigateur.

## ADDED Requirements

### Requirement: Stockage centralisé dans le navigateur
Toutes les données métier (utilisateurs, produits, commandes, livraisons, panier, session) SHALL être lues et écrites par une couche de persistance unique ; aucun composant d'interface NE DOIT accéder directement au stockage du navigateur.

#### Scenario: Accès indirect depuis l'interface
- **WHEN** un écran affiche ou modifie une donnée métier
- **THEN** le passage se fait par la couche de persistance, ce qu'un composant de substitution permet de vérifier sans modifier les écrans

#### Scenario: Clés de stockage identifiables
- **WHEN** le stockage du navigateur est inspecté après utilisation de l'application
- **THEN** les données sont regroupées sous des clés cohérentes préfixées par le nom de l'application

### Requirement: Sérialisation et désérialisation robustes
La couche de persistance SHALL sérialiser et désérialiser les données avec un marqueur de version, et NE DOIT jamais provoquer de plantage lorsque les données sont absentes, illisibles ou d'une version inconnue.

#### Scenario: Lecture de données valides
- **WHEN** des données valides enregistrées sont relues
- **THEN** elles sont restituées à l'identique, types et relations compris

#### Scenario: Données corrompues
- **WHEN** une valeur du stockage local n'est pas exploitable
- **THEN** la lecture échoue proprement : la donnée concernée est remplacée par un état vide ou initial et un message d'avertissement est affiché, sans écran blanc

#### Scenario: Version de schéma inconnue
- **WHEN** les données locales portent une version de schéma non reconnue
- **THEN** elles ne sont pas interprétées de façon hasardeuse : elles sont ignorées au profit d'une initialisation et l'utilisateur en est averti

#### Scenario: Stockage indisponible
- **WHEN** le stockage du navigateur est inaccessible ou plein
- **THEN** un message d'erreur clair est affiché et l'application continue de fonctionner en mémoire sans perdre la saisie en cours

### Requirement: Initialisation des données de démonstration une seule fois
Le jeu de données de démonstration SHALL être créé uniquement lors du premier lancement, puis NE DOIT plus être recréé automatiquement, afin de ne jamais écraser les données saisies par l'utilisateur.

#### Scenario: Premier lancement
- **WHEN** l'application est ouverte alors qu'aucune donnée locale n'existe
- **THEN** le jeu de démonstration (comptes par rôle, produits, commandes et livraisons d'exemple cohérents) est créé et un marqueur d'initialisation est enregistré

#### Scenario: Lancements suivants
- **WHEN** l'application est rouverte alors que le marqueur d'initialisation existe
- **THEN** aucune donnée n'est recréée ni écrasée

#### Scenario: Réinitialisation volontaire
- **WHEN** l'administrateur déclenche la réinitialisation des données de démonstration
- **THEN** les données locales sont remplacées par le jeu initial de façon explicite et confirmée

### Requirement: Conservation des données après actualisation
Les données enregistrées SHALL survivre à une actualisation de la page et à la fermeture puis réouverture du navigateur sur le même profil.

#### Scenario: Actualisation
- **WHEN** l'utilisateur actualise la page après avoir créé un produit ou passé une commande
- **THEN** les données créées sont toujours présentes

#### Scenario: Réouverture du navigateur
- **WHEN** l'utilisateur ferme puis rouvre le navigateur
- **THEN** ses données et sa session sont restaurées

### Requirement: Prévention des incohérences entre commandes, stocks et livraisons
Les écritures liées à une même opération métier (création de commande et décrément de stock, annulation et restitution, changement de statut de livraison et de commande) SHALL être enregistrées ensemble, de sorte qu'aucune commande ne puisse exister sans que le stock et la livraison correspondants soient cohérents.

#### Scenario: Opération atomique de commande
- **WHEN** une commande est créée
- **THEN** la commande, les articles, les nouveaux niveaux de stock et l'éventuelle livraison sont enregistrés dans la même écriture : aucune commande sans décrément de stock n'est possible

#### Scenario: Détection d'une incohérence au démarrage
- **WHEN** les données locales sont chargées et qu'un écart est détecté (par exemple un stock inférieur aux quantités réservées par des commandes en cours)
- **THEN** l'écart est signalé à l'administrateur avec les éléments concernés, sans blocage de l'application

#### Scenario: Statuts croisés cohérents
- **WHEN** une livraison passe à LIVREE
- **THEN** la commande correspondante passe aussi à LIVREE, les deux enregistrements restant cohérents après actualisation

### Requirement: Limites du stockage local rendues explicites
L'application SHALL indiquer que les données sont propres au navigateur et au profil utilisés, qu'elles ne sont pas synchronisées entre utilisateurs ni entre appareils et qu'elles n'offre aucune garantie de sécurité côté serveur.

#### Scenario: Absence de synchronisation entre navigateurs
- **WHEN** l'utilisateur ouvre l'application dans un autre navigateur ou sur un autre appareil
- **THEN** il repart des données de démonstration initiales, ce que la documentation de l'application explique

#### Scenario: Absence de synchronisation entre utilisateurs
- **WHEN** deux personnes utilisent l'application chacune de son côté
- **THEN** leurs données ne se partagent pas, et cette limite est documentée

#### Scenario: Mention de sécurité
- **WHEN** l'utilisateur consulte la page d'aide ou de mentions
- **THEN** il est indiqué que le stockage local ne constitue pas une sécurité serveur et peut être modifié depuis le navigateur

### Requirement: Structure prête pour un remplacement par une API
La couche de persistance SHALL exposer des opérations de lecture et d'écriture indépendantes du support de stockage, de sorte que remplacer le stockage local par un appel à une API NE DOIT pas exiger de modifier les écrans ni les règles métier.

#### Scenario: Substitution du support de stockage
- **WHEN** une implémentation alternative de la couche de persistance est fournie (par exemple pour des tests ou une future API)
- **THEN** les écrans et les services métier continuent de fonctionner sans changement de leur code

#### Scenario: Données de test substituées
- **WHEN** un support de stockage alimenté par des données de test est utilisé
- **THEN** les règles métier (stock, statuts, permissions) s'appliquent de la même manière qu'avec le stockage du navigateur
