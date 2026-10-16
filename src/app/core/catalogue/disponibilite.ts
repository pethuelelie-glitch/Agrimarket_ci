import { Produit } from '../models';

/**
 * Disponibilité commerciale d'un produit (tasks 5.9 et 6.1).
 *
 * Un produit n'est vendable que s'il est **actif** et que sa quantité
 * disponible est **strictement positive**. Ces règles sont partagées par la
 * fiche produit, le catalogue et le panier.
 */

/** Le produit peut-il être ajouté au panier ? */
export function estDisponible(produit: Produit): boolean {
  return produit.actif && produit.quantiteDisponible > 0;
}

/**
 * Message expliquant l'indisponibilité, ou `null` si le produit est vendable.
 * Deux causes distinctes sont distinguées : produit désactivé, produit épuisé.
 */
export function messageIndisponibilite(produit: Produit): string | null {
  if (!produit.actif) {
    return 'Produit indisponible : ce produit a été désactivé par son producteur.';
  }
  if (produit.quantiteDisponible <= 0) {
    return 'Rupture de stock : ce produit est momentanément épuisé.';
  }
  return null;
}
