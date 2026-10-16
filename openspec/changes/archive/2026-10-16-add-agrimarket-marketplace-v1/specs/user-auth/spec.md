# Spec Delta

## Purpose

Permettre l'inscription, la connexion, la déconnexion et la conservation locale de la session, en traitant cette authentification comme une simulation pédagogique qui ne stocke jamais de mot de passe en clair.

## ADDED Requirements

### Requirement: Inscription avec formulaire validé

La page d'inscription SHALL créer un compte à partir d'un nom, d'une adresse e-mail, d'un mot de passe et d'un rôle parmi PRODUCTEUR, ACHETEUR et LIVREUR, en validant chaque champ avant soumission ; le rôle ADMIN n'est jamais proposé à l'inscription.

#### Scenario: Inscription valide

- **WHEN** un visiteur soumet un nom, un e-mail valide, un mot de passe de huit caractères ou plus et un rôle autorisé
- **THEN** le compte est créé, la session est ouverte et l'utilisateur est redirigé vers son tableau de bord

#### Scenario: Rôle administrateur non choisi à l'inscription

- **WHEN** le visiteur ouvre la liste des rôles de l'inscription
- **THEN** ADMIN n'y figure pas ; seuls PRODUCTEUR, ACHETEUR et LIVREUR sont proposés

#### Scenario: Adresse e-mail déjà utilisée

- **WHEN** l'e-mail soumis correspond déjà à un compte existant
- **THEN** un message indique que l'adresse est déjà utilisée, aucun compte n'est créé et la saisie des autres champs est conservée

#### Scenario: Saisie invalide

- **WHEN** l'e-mail est mal formé ou le mot de passe compte moins de huit caractères
- **THEN** un message d'erreur est affiché sous le champ fautif et le formulaire n'est pas soumis

### Requirement: Connexion avec identifiants contrôlés

La page de connexion SHALL ouvrir une session lorsque l'adresse e-mail et le mot de passe correspondent à un compte actif, et afficher sinon un message d'erreur compréhensible sans révéler si l'adresse existe.

#### Scenario: Identifiants corrects

- **WHEN** un utilisateur soumet une adresse et un mot de passe valides pour un compte actif
- **THEN** la session est ouverte et il est redirigé vers son tableau de bord

#### Scenario: Identifiants inconnus ou erronés

- **WHEN** l'adresse n'existe pas ou le mot de passe ne correspond pas
- **THEN** un message « adresse e-mail ou mot de passe incorrect » s'affiche et la session reste fermée

#### Scenario: Compte désactivé

- **WHEN** les identifiants correspondent à un compte désactivé par l'administrateur
- **THEN** un message indique que le compte est désactivé et aucune session n'est ouverte

### Requirement: Déconnexion de la session

La déconnexion SHALL fermer la session de l'utilisateur, conserver les données locales de l'application et rediriger vers la page d'accueil ; toute route protégée ultérieure est refusée.

#### Scenario: Déconnexion depuis l'interface

- **WHEN** un utilisateur connecté clique sur Déconnexion
- **THEN** la session est fermée, la navigation redevient celle d'un visiteur et l'accueil s'affiche

#### Scenario: Accès à une route protégée après déconnexion

- **WHEN** un ancien utilisateur déconnecté ouvre directement l'adresse d'un écran protégé
- **THEN** il est redirigé vers la page de connexion sans voir le contenu de l'écran

### Requirement: Session conservée après actualisation

La session SHALL être conservée localement de sorte qu'une actualisation de la page ou un retour ultérieur n'imposent pas de se reconnecter tant que la déconnexion n'a pas eu lieu.

#### Scenario: Actualisation de la page

- **WHEN** un utilisateur connecté actualise le navigateur
- **THEN** il reste connecté avec le même rôle et le même tableau de bord

#### Scenario: Session absente ou illisible

- **WHEN** la donnée de session locale est absente ou illisible
- **THEN** l'utilisateur est traité comme déconnecté et la donnée corrompue est supprimée sans erreur bloquante

### Requirement: Aucun mot de passe stocké en clair

Le système SHALL NE JAMAIS enregistrer de mot de passe en clair dans le stockage local : il mémorise uniquement une empreinte non réversible, y compris pour les comptes de démonstration, et l'écran d'inscription SHALL signaler que l'authentification est une simulation pédagogique sans sécurité de production.

#### Scenario: Contenu du stockage après inscription

- **WHEN** un compte est créé puis que le stockage local est inspecté
- **THEN** aucun champ ne contient le mot de passe saisi, mais une empreinte non réversible

#### Scenario: Mention affichée aux utilisateurs

- **WHEN** un visiteur ouvre les pages d'inscription ou de connexion
- **THEN** une mention indique que l'authentification est locale, simulée et non sécurisée pour la production

### Requirement: Comptes de démonstration initialisés une seule fois

Un jeu de comptes de démonstration (un administrateur, un producteur, un acheteur, un livreur) SHALL être créé lors du premier lancement uniquement, avec des identifiants affichés sur l'écran de connexion pour les tests.

#### Scenario: Premier lancement

- **WHEN** l'application est ouverte pour la première fois sur un navigateur vierge
- **THEN** les quatre comptes de démonstration sont créés et leurs identifiants sont affichés sur la page de connexion

#### Scenario: Lancement suivant

- **WHEN** l'application est rouverte alors que les comptes existent déjà
- **THEN** aucun compte de démonstration n'est dupliqué ni écrasé

#### Scenario: Compte de démonstration effacé

- **WHEN** un compte de démonstration a été supprimé manuellement depuis le stockage local
- **THEN** il n'est pas recréé automatiquement lors du lancement suivant
