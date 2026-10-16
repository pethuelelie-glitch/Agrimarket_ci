# Limites V1 — sans backend

L'objectif de cette version est de montrer les règles métier sur **des données
locales uniquement**. L'application **ne dispose d'aucun backend**. Les points
ci-dessous sont explicités à l'utilisateur (pied de page, page d'aide) et font
partie des contraintes du projet.

## 1. Données locales

- **Portée navigateur** : toutes les données (`agrimarket.v1`), le panier et la
  session sont stockés dans `localStorage` et n'existent que sur l'appareil
  de l'utilisateur.
- **Aucune synchronisation** : aucun envoi entre plusieurs appareils. Passer sur
  un autre navigateur ou sur une autre machine vide le contexte.
- **Isolation** : chaque domaine de stockage est propre au navigateur (Web Storage).
- **Aucune restitution centralisée** : la réinitialisation est locale. Une
  réinitialisation administrative (Module 10) restaure uniquement les données
  de démonstration sur l'appareil courant.

## 2. Sécurité (authentification locale simulée)

- **Pas sécurisé pour la production** : l'inscription/connexion est une simulation
  pédagogique. Il ne faut **pas** l'utiliser avec des mots de passe réels.
- **Pas de mot de passe stocké en clair** : seuls `sel` et `empreinteMotDePasse`
  (`SHA-256(sel + motDePasse)` via `crypto.subtle`) sont enregistrés.
  Les mots de passe des comptes de démonstration sont **affichés volontairement**
  sur la page de connexion (à des fins pédagogiques uniquement).
- **Contrôle d'accès côté client uniquement** : les routes protégées,
  `authGuard`, `roleGuard` et `compteActifGuard` sont évalués côté navigateur.
  Aucun service serveur ne vérifie les requêtes.
- **Compte désactivé** : un compte désactivé ne peut pas ouvrir de session ;
  sa session existante est considérée comme illégitime lors de la navigation.
- **Unicité de rôle par compte** : un compte a exactement un rôle parmi
  `{ADMIN, PRODUCTEUR, ACHETEUR, LIVREUR}`. `ADMIN` n'est pas auto-inscriptible.

## 3. Stockage, corruption et atomicité

- **Document racine unique** : toutes les écritures passent par
  `PersistenceService.transaction()` (un seul `setItem`). Les opérations
  croisées (commande + stock + livraison) sont donc réalisées en une seule
  écriture atomique.
- **Robustesse** : un contenu illisible, une structure invalide ou une
  `schemaVersion` inconnue déclenche un avertissement et, par mesure de
  continuité pédagogique, une réinitialisation de l'état courant (remplacement
  par les données de démonstration).
- **Échec d'écriture** : si `localStorage` refuse l'écriture (quota, mode privé),
  l'état **en mémoire** est conservé : la saisie en cours n'est pas perdue.
  Un avertissement est affiché.
- **Session illisible** : une session corrompue est ignorée (déconnexion).
- **Limite de taille** : `localStorage` est limité par le navigateur (souvent
  quelques Mo). Cette application utilise un document de taille modérée.

## 4. Pas de backend, pas de fonctionnalités non implémentées

- **Aucun paiement réel** : aucun intégrateur de paiement. Aucun processus de
  règlement n'est simulé comme étant réel.
- **Aucune fausse API** : aucune requête HTTP n'est émise. Les données ne
  transitent que dans les signaux Angular.
- **Aucun upload d'image** : les produits utilisent une `imageUrl` (liens externes
  ou images fournies). Aucun transfert de fichier côté navigateur vers un serveur.
- **Pas d'envoi d'e-mails** : la création de compte, les notifications de
  changement de statut et l'attribution de livraison sont purement locales.
- **Pas de synchronisation multi-utilisateurs en temps réel** : les effets sont
  visibles uniquement sur la même session locale.

## 5. Lignes directrices pour l'enseignant et l'étudiant

1. Les vérifications d'accès sont pédagogiques : un attaquant disposant du
   stockage local pourrait les contourner. Ne pas en déduire une sécurité serveur.
2. Conserver la portée « client-only » : si une évolution nécessite du réseau,
   utiliser **uniquement** `StorageAdapter` pour l'abstraction (cf.
   `docs/persistence.md` §4).
3. Respecter le principe « une commande par producteur » (éclatement au passage
   au panier/commande) : vérifié par les spécifications et les tests.
4. Le couplage commande ↔ livraison s'effectue **dans la même transaction** afin
   de conserver la cohérence (cf. spécification `delivery-management`).
