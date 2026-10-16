import { Role } from './models';

/**
 * Chemins de navigation de l'application, centralisés pour éviter les chaînes
 * dispersées dans les composants.
 */
export const CHEMINS = {
  accueil: '/',
  catalogue: '/catalogue',
  aide: '/aide',
  connexion: '/connexion',
  inscription: '/inscription',
  panier: '/panier',
  commandes: '/commandes',
  tableauDeBord: '/tableau-de-bord',
  produitsProducteur: '/producteur/produits',
  commandesProducteur: '/producteur/commandes',
  missionsLivreur: '/livreur',
  admin: '/admin',
  adminUtilisateurs: '/admin/utilisateurs',
  adminProduits: '/admin/produits',
  adminCommandes: '/admin/commandes',
  adminLivraisons: '/admin/livraisons',
} as const;

/** Chemin du tableau de bord propre à un rôle. */
export function cheminTableauDeBord(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return `${CHEMINS.tableauDeBord}/administrateur`;
    case 'PRODUCTEUR':
      return `${CHEMINS.tableauDeBord}/producteur`;
    case 'ACHETEUR':
      return `${CHEMINS.tableauDeBord}/acheteur`;
    case 'LIVREUR':
      return `${CHEMINS.tableauDeBord}/livreur`;
  }
}

/** Détail d'une commande. */
export function cheminCommande(commandeId: string): string {
  return `${CHEMINS.commandes}/${commandeId}`;
}

/** Détail d'un produit. */
export function cheminProduit(produitId: string): string {
  return `${CHEMINS.catalogue}/${produitId}`;
}
