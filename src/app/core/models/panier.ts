/**
 * Panier d'un acheteur (Module E), conservé localement par utilisateur.
 */
export interface ItemPanier {
  produitId: string;
  quantite: number;
}

export interface Panier {
  acheteurId: string;
  items: ItemPanier[];
  /** Date ISO 8601 de dernière modification. */
  majLe: string;
}
