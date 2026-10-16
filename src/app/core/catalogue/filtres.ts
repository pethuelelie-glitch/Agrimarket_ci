import { normaliserLocalisation } from '../config';
import { Categorie, Produit } from '../models';

/**
 * Recherche, filtres et tri du catalogue (task 5.5).
 *
 * Ces fonctions sont pures : elles ne modifient jamais le tableau reçu et ne
 * dépendent ni du stockage ni du routeur. Elles sont donc testables isolément.
 */

/** Disponibilité retenue par le filtre. */
export type Disponibilite = 'TOUS' | 'EN_STOCK' | 'EPUISE';

/** Critères combinables du catalogue. */
export interface CriteresCatalogue {
  /** Recherche par nom, insensible à la casse et aux espaces superflus. */
  recherche: string;
  /** Catégorie retenue, ou `TOUTES` pour ne pas filtrer. */
  categorie: Categorie | 'TOUTES';
  /** Prix minimum en FCFA, ou `null`. */
  prixMin: number | null;
  /** Prix maximum en FCFA, ou `null`. */
  prixMax: number | null;
  /** Disponibilité : tout, uniquement en stock, ou uniquement épuisé. */
  disponibilite: Disponibilite;
  /** Localisation recherchée, insensible à la casse et aux accents. */
  localisation: string;
}

/** Critères neutres : aucun filtrage. */
export const CRITERES_PAR_DEFAUT: CriteresCatalogue = {
  recherche: '',
  categorie: 'TOUTES',
  prixMin: null,
  prixMax: null,
  disponibilite: 'TOUS',
  localisation: '',
};

/** Ordres de tri disponibles. */
export type TriCatalogue = 'date-desc' | 'date-asc' | 'prix-asc' | 'prix-desc';

/** Tri appliqué par défaut : les produits les plus récents d'abord. */
export const TRI_DEFAUT: TriCatalogue = 'date-desc';

export const LIBELLES_TRI: Readonly<Record<TriCatalogue, string>> = {
  'date-desc': 'Plus récents',
  'date-asc': 'Plus anciens',
  'prix-asc': 'Prix croissant',
  'prix-desc': 'Prix décroissant',
};

/** Vrai si au moins un critère diffère de la valeur par défaut. */
export function filtresActifs(criteres: CriteresCatalogue): boolean {
  return (
    criteres.recherche.trim() !== '' ||
    criteres.categorie !== 'TOUTES' ||
    criteres.prixMin !== null ||
    criteres.prixMax !== null ||
    criteres.disponibilite !== 'TOUS' ||
    criteres.localisation.trim() !== ''
  );
}

/** Recherche par nom : ignore la casse et les espaces superflus. */
export function rechercherParNom(produits: readonly Produit[], texte: string): Produit[] {
  const recherche = texte.trim().toLowerCase();
  if (recherche === '') {
    return [...produits];
  }
  return produits.filter((produit) => produit.nom.toLowerCase().includes(recherche));
}

/** Le produit satisfait-il tous les critères renseignés ? */
export function correspondAuxCriteres(produit: Produit, criteres: CriteresCatalogue): boolean {
  if (criteres.categorie !== 'TOUTES' && produit.categorie !== criteres.categorie) {
    return false;
  }
  if (criteres.prixMin !== null && produit.prix < criteres.prixMin) {
    return false;
  }
  if (criteres.prixMax !== null && produit.prix > criteres.prixMax) {
    return false;
  }
  if (criteres.disponibilite === 'EN_STOCK' && produit.quantiteDisponible <= 0) {
    return false;
  }
  if (criteres.disponibilite === 'EPUISE' && produit.quantiteDisponible > 0) {
    return false;
  }
  const localisation = criteres.localisation.trim();
  if (
    localisation !== '' &&
    !normaliserLocalisation(produit.localisation).includes(normaliserLocalisation(localisation))
  ) {
    return false;
  }
  return true;
}

/** Applique la recherche puis les filtres combinables. */
export function filtrerProduits(
  produits: readonly Produit[],
  criteres: CriteresCatalogue,
): Produit[] {
  return rechercherParNom(produits, criteres.recherche).filter((produit) =>
    correspondAuxCriteres(produit, criteres),
  );
}

/** Applique l'ordre de tri demandé. */
export function trierProduits(produits: readonly Produit[], tri: TriCatalogue): Produit[] {
  const copies = [...produits];
  switch (tri) {
    case 'prix-asc':
      return copies.sort((gauche, droite) => gauche.prix - droite.prix);
    case 'prix-desc':
      return copies.sort((gauche, droite) => droite.prix - gauche.prix);
    case 'date-asc':
      return copies.sort((gauche, droite) => gauche.dateCreation.localeCompare(droite.dateCreation));
    case 'date-desc':
      return copies.sort((gauche, droite) => droite.dateCreation.localeCompare(gauche.dateCreation));
  }
}

/** Enchaîne recherche, filtres et tri : le pipeline complet du catalogue. */
export function appliquerCriteres(
  produits: readonly Produit[],
  criteres: CriteresCatalogue,
  tri: TriCatalogue = TRI_DEFAUT,
): Produit[] {
  return trierProduits(filtrerProduits(produits, criteres), tri);
}
