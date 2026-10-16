import { Commande, estLivraisonActive, Livraison, Produit, Role, Utilisateur } from '../models';

/**
 * Permissions et périmètre de données par rôle (Module C, décision D11).
 *
 * Deux niveaux sont distingués :
 * 1. **Permissions par rôle** (`peut`) : la matrice action → rôles autorisés.
 * 2. **Périmètre de données** (helpers `peutVoir…`) : la propriété de l'entité
 *    (par exemple un producteur ne modifie que ses propres produits).
 *
 * Ces vérifications sont des protections d'interface (voir `docs/limites-v1.md`) :
 * elles ne remplacent pas un contrôle serveur.
 */

export type Action =
  // Catalogue et produits
  | 'product:create'
  | 'product:update'
  | 'product:delete'
  | 'product:manage-stock'
  | 'product:moderate'
  // Panier
  | 'cart:manage'
  // Commandes
  | 'order:create'
  | 'order:read-own'
  | 'order:read-received'
  | 'order:read-all'
  | 'order:advance'
  | 'order:cancel'
  // Livraisons
  | 'delivery:create'
  | 'delivery:assign'
  | 'delivery:read-assigned'
  | 'delivery:read-all'
  | 'delivery:read-own'
  | 'delivery:update-status'
  // Administration
  | 'admin:users'
  | 'admin:dashboard'
  | 'admin:orders'
  | 'admin:deliveries'
  | 'admin:reset';

/** Libellés affichables des actions, utilisés par les infobulles. */
export const LIBELLES_ACTION: Readonly<Record<Action, string>> = {
  'product:create': 'Créer un produit',
  'product:update': 'Modifier ce produit',
  'product:delete': 'Supprimer ce produit',
  'product:manage-stock': 'Gérer le stock',
  'product:moderate': 'Modérer ce produit',
  'cart:manage': 'Gérer son panier',
  'order:create': 'Passer commande',
  'order:read-own': 'Consulter ses commandes',
  'order:read-received': 'Consulter les commandes reçues',
  'order:read-all': 'Consulter toutes les commandes',
  'order:advance': 'Faire évoluer une commande',
  'order:cancel': 'Annuler une commande',
  'delivery:create': 'Créer une livraison',
  'delivery:assign': 'Attribuer un livreur',
  'delivery:read-assigned': 'Consulter ses livraisons',
  'delivery:read-all': 'Consulter toutes les livraisons',
  'delivery:read-own': 'Suivre les livraisons de ses commandes',
  'delivery:update-status': 'Mettre à jour une livraison',
  'admin:users': 'Gérer les comptes',
  'admin:dashboard': 'Accéder au tableau de bord global',
  'admin:orders': 'Superviser les commandes',
  'admin:deliveries': 'Superviser les livraisons',
  'admin:reset': 'Réinitialiser les données locales',
};

/** Matrice action → rôles autorisés (décision D11). */
export const MATRICE_PERMISSIONS: Readonly<Record<Action, readonly Role[]>> = {
  'product:create': ['PRODUCTEUR'],
  'product:update': ['PRODUCTEUR'],
  'product:delete': ['PRODUCTEUR', 'ADMIN'],
  'product:manage-stock': ['PRODUCTEUR'],
  'product:moderate': ['ADMIN'],
  'cart:manage': ['ACHETEUR'],
  'order:create': ['ACHETEUR'],
  'order:read-own': ['ACHETEUR'],
  'order:read-received': ['PRODUCTEUR'],
  'order:read-all': ['ADMIN'],
  'order:advance': ['PRODUCTEUR'],
  'order:cancel': ['ACHETEUR', 'PRODUCTEUR', 'ADMIN'],
  'delivery:create': ['ADMIN'],
  'delivery:assign': ['ADMIN'],
  'delivery:read-assigned': ['LIVREUR'],
  'delivery:read-all': ['ADMIN'],
  'delivery:read-own': ['ACHETEUR', 'PRODUCTEUR'],
  'delivery:update-status': ['LIVREUR'],
  'admin:users': ['ADMIN'],
  'admin:dashboard': ['ADMIN'],
  'admin:orders': ['ADMIN'],
  'admin:deliveries': ['ADMIN'],
  'admin:reset': ['ADMIN'],
};

/** Le rôle possède-t-il la permission `action` ? */
export function peut(role: Role, action: Action): boolean {
  return (MATRICE_PERMISSIONS[action] as readonly string[]).includes(role);
}

/** Le rôle courant (ou un visiteur) peut-il exécuter `action` ? */
export function peutAvecUtilisateur(utilisateur: Utilisateur | null, action: Action): boolean {
  if (!utilisateur || !utilisateur.actif) {
    return false;
  }
  return peut(utilisateur.role, action);
}

/* ------------------------------------------------------------------ */
/* Périmètre de données : produits                                     */
/* ------------------------------------------------------------------ */

/** Un produit est-il visible par cet utilisateur (ou ce visiteur) ? */
export function peutVoirProduit(utilisateur: Utilisateur | null, produit: Produit): boolean {
  if (utilisateur?.role === 'ADMIN') {
    return true;
  }
  if (utilisateur?.role === 'PRODUCTEUR' && produit.producteurId === utilisateur.id) {
    return true;
  }
  // Un visiteur, un acheteur ou un livreur ne voit que les produits actifs.
  return produit.actif;
}

/** Le producteur peut-il modifier (prix, stock, description) ce produit ? */
export function peutModifierProduit(utilisateur: Utilisateur | null, produit: Produit): boolean {
  if (!utilisateur || !utilisateur.actif || utilisateur.role !== 'PRODUCTEUR') {
    return false;
  }
  if (produit.producteurId !== utilisateur.id) {
    return false;
  }
  return peut(utilisateur.role, 'product:update');
}

/** L'utilisateur peut-il supprimer ce produit (propriétaire, ou administrateur) ? */
export function peutSupprimerProduit(utilisateur: Utilisateur | null, produit: Produit): boolean {
  if (!utilisateur || !utilisateur.actif) {
    return false;
  }
  if (utilisateur.role === 'ADMIN') {
    return peut('ADMIN', 'product:delete');
  }
  return utilisateur.role === 'PRODUCTEUR' && produit.producteurId === utilisateur.id;
}

/**
 * L'utilisateur peut-il modérer (activer/désactiver) ce produit ?
 * Droit réservé à l'administrateur (`product:moderate`), quel que soit le
 * producteur propriétaire (spéc. « l'administrateur peut modérer un produit »).
 */
export function peutModerer(utilisateur: Utilisateur | null): boolean {
  if (!utilisateur || !utilisateur.actif) {
    return false;
  }
  return peut(utilisateur.role, 'product:moderate');
}

/** Produits visibles pour l'utilisateur (filtrage des listes publiques). */
export function produitsVisibles(
  utilisateur: Utilisateur | null,
  produits: readonly Produit[],
): Produit[] {
  return produits.filter((produit) => peutVoirProduit(utilisateur, produit));
}

/**
 * Produits que l'utilisateur peut **gérer** (catalogue de gestion) : ses propres
 * produits pour un producteur, tous pour un administrateur, aucun pour les autres.
 */
export function produitsGerables(
  utilisateur: Utilisateur | null,
  produits: readonly Produit[],
): Produit[] {
  if (!utilisateur || !utilisateur.actif) {
    return [];
  }
  if (utilisateur.role === 'ADMIN') {
    return [...produits];
  }
  if (utilisateur.role === 'PRODUCTEUR') {
    return produits.filter((produit) => produit.producteurId === utilisateur.id);
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Périmètre de données : commandes                                    */
/* ------------------------------------------------------------------ */

/** L'utilisateur peut-il voir le détail de cette commande ? */
export function peutVoirCommande(utilisateur: Utilisateur | null, commande: Commande): boolean {
  if (!utilisateur || !utilisateur.actif) {
    return false;
  }
  switch (utilisateur.role) {
    case 'ADMIN':
      return true;
    case 'ACHETEUR':
      return commande.acheteurId === utilisateur.id;
    case 'PRODUCTEUR':
      return commande.producteurId === utilisateur.id;
    case 'LIVREUR':
      return false;
  }
}

/** Commandes visibles pour l'utilisateur (filtrage des listes). */
export function commandesVisibles(
  utilisateur: Utilisateur | null,
  commandes: readonly Commande[],
): Commande[] {
  return commandes.filter((commande) => peutVoirCommande(utilisateur, commande));
}

/* ------------------------------------------------------------------ */
/* Périmètre de données : livraisons                                   */
/* ------------------------------------------------------------------ */

/**
 * L'utilisateur peut-il voir cette livraison ?
 * `commande` est la commande liée, utilisée pour le suivi par l'acheteur et le
 * producteur concernés.
 */
export function peutVoirLivraison(
  utilisateur: Utilisateur | null,
  livraison: Livraison,
  commande: Commande | null,
): boolean {
  if (!utilisateur || !utilisateur.actif) {
    return false;
  }
  switch (utilisateur.role) {
    case 'ADMIN':
      return true;
    case 'LIVREUR':
      return livraison.livreurId === utilisateur.id;
    case 'ACHETEUR':
      return commande?.acheteurId === utilisateur.id;
    case 'PRODUCTEUR':
      return commande?.producteurId === utilisateur.id;
  }
}

/** Le livreur peut-il faire évoluer le statut de cette livraison ? */
export function peutModifierLivraison(
  utilisateur: Utilisateur | null,
  livraison: Livraison,
): boolean {
  if (!utilisateur || !utilisateur.actif || utilisateur.role !== 'LIVREUR') {
    return false;
  }
  if (livraison.livreurId !== utilisateur.id) {
    return false;
  }
  return estLivraisonActive(livraison.statut);
}

/** Livraisons visibles pour l'utilisateur (filtrage des listes). */
export function livraisonsVisibles(
  utilisateur: Utilisateur | null,
  livraisons: readonly Livraison[],
  commandes: readonly Commande[],
): Livraison[] {
  const commandeParId = new Map(commandes.map((commande) => [commande.id, commande]));
  return livraisons.filter((livraison) =>
    peutVoirLivraison(utilisateur, livraison, commandeParId.get(livraison.commandeId) ?? null),
  );
}
