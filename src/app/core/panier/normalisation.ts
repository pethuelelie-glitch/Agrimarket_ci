import { ItemPanier, Panier } from '../models/panier';

/**
 * Normalisation défensive d'un panier stocké (task 6.6).
 *
 * Un panier dont la structure ne correspond pas exactement au modèle est
 * considéré comme **corrompu** : la fonction renvoie `null` et l'appelant
 * réinitialise le panier de l'acheteur à vide, sans erreur bloquante.
 */

/** Un article est-il structurellement valide ? */
export function estItemValide(valeur: unknown): valeur is ItemPanier {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const item = valeur as Partial<ItemPanier>;
  return (
    typeof item.produitId === 'string' &&
    item.produitId.length > 0 &&
    typeof item.quantite === 'number' &&
    Number.isInteger(item.quantite) &&
    item.quantite >= 1
  );
}

/**
 * Renvoie une copie propre du panier, ou `null` si la donnée est absente ou
 * corrompue. Les articles valides sont conservés, l'ordre d'origine est gardé.
 */
export function normaliserPanier(brut: unknown): Panier | null {
  if (typeof brut !== 'object' || brut === null) {
    return null;
  }
  const panier = brut as Partial<Panier>;
  if (!Array.isArray(panier.items)) {
    return null;
  }

  const items: ItemPanier[] = [];
  for (const candidat of panier.items) {
    if (!estItemValide(candidat)) {
      return null;
    }
    items.push({ produitId: candidat.produitId, quantite: candidat.quantite });
  }

  return {
    acheteurId: typeof panier.acheteurId === 'string' ? panier.acheteurId : '',
    items,
    majLe: typeof panier.majLe === 'string' ? panier.majLe : '',
  };
}

/** Le panier stocké est-il présent mais inexploitable ? */
export function panierCorrompu(brut: unknown): boolean {
  return brut !== undefined && normaliserPanier(brut) === null;
}

/** Insère, met à jour ou retire un article dans une liste, en renvoyant une copie. */
export function avecQuantite(
  items: readonly ItemPanier[],
  produitId: string,
  quantite: number,
): ItemPanier[] {
  const index = items.findIndex((item) => item.produitId === produitId);
  if (index === -1) {
    return [...items, { produitId, quantite }];
  }
  const copie = items.map((item) => ({ ...item }));
  copie[index] = { produitId, quantite };
  return copie;
}

/** Retire un article d'une liste, en renvoyant une copie. */
export function sansProduit(items: readonly ItemPanier[], produitId: string): ItemPanier[] {
  return items.filter((item) => item.produitId !== produitId);
}
