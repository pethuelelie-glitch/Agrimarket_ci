import { Produit } from '../models';

/** Nombre de produits mis en avant sur la page d'accueil (task 4.3). */
export const NOMBRE_PRODUITS_MISE_EN_AVANT = 6;

/**
 * Sélection des produits mis en avant sur la page d'accueil :
 * produits **actifs** uniquement, triés par date de création décroissante,
 * limités à `limite` éléments (storefront — « Mise en avant des produits »).
 *
 * La fonction est pure et ne modifie jamais le tableau reçu.
 */
export function selectionnerMiseEnAvant(
  produits: readonly Produit[],
  limite: number = NOMBRE_PRODUITS_MISE_EN_AVANT,
): Produit[] {
  return produits
    .filter((produit) => produit.actif)
    .sort((gauche, droite) => droite.dateCreation.localeCompare(gauche.dateCreation))
    .slice(0, limite);
}
