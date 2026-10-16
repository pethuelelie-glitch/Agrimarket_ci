/**
 * Catégories de produits agricoles (Module D — catalogue).
 */
export type Categorie =
  'CEREALES' | 'LEGUMES' | 'FRUITS' | 'TUBERCULES' | 'LEGUMINEUSES' | 'TRANSFORMES';

/** Les six catégories autorisées. */
export const CATEGORIES: readonly Categorie[] = [
  'CEREALES',
  'LEGUMES',
  'FRUITS',
  'TUBERCULES',
  'LEGUMINEUSES',
  'TRANSFORMES',
];

export const LIBELLES_CATEGORIE: Readonly<Record<Categorie, string>> = {
  CEREALES: 'Céréales',
  LEGUMES: 'Légumes',
  FRUITS: 'Fruits',
  TUBERCULES: 'Tubercules',
  LEGUMINEUSES: 'Légumineuses',
  TRANSFORMES: 'Produits transformés',
};

export function estCategorie(valeur: unknown): valeur is Categorie {
  return typeof valeur === 'string' && (CATEGORIES as readonly string[]).includes(valeur);
}

/**
 * Unités de vente.
 */
export type Unite = 'KG' | 'SAC' | 'TONNE' | 'LITRE' | 'PIECE' | 'BOTTE' | 'REGIME';

export const UNITES: readonly Unite[] = ['KG', 'SAC', 'TONNE', 'LITRE', 'PIECE', 'BOTTE', 'REGIME'];

export const LIBELLES_UNITE: Readonly<Record<Unite, string>> = {
  KG: 'kg',
  SAC: 'sac',
  TONNE: 'tonne',
  LITRE: 'litre',
  PIECE: 'pièce',
  BOTTE: 'botte',
  REGIME: 'régime',
};

export function estUnite(valeur: unknown): valeur is Unite {
  return typeof valeur === 'string' && (UNITES as readonly string[]).includes(valeur);
}

/** Trace d'une modération réalisée par un administrateur. */
export interface ModerationProduit {
  motif: string;
  parAdminId: string;
  /** Date ISO 8601 de la modération. */
  le: string;
}

/**
 * Données d'un formulaire produit (tasks 5.1, 5.6, 5.8).
 *
 * La catégorie et l'unité sont représentées par `''` tant que l'utilisateur n'a
 * rien choisi dans la liste déroulante : elles sont alors refusées par la
 * validation, qui signale chaque champ fautif séparément.
 */
export interface DonneesFormulaireProduit {
  nom: string;
  description: string;
  categorie: Categorie | '';
  prix: number;
  unite: Unite | '';
  quantiteDisponible: number;
  localisation: string;
  imageUrl: string;
}

/** Formulaire produit vide, valeur de départ d'un formulaire de création. */
export function formulaireProduitVide(): DonneesFormulaireProduit {
  return {
    nom: '',
    description: '',
    categorie: '',
    prix: 0,
    unite: '',
    quantiteDisponible: 0,
    localisation: '',
    imageUrl: '',
  };
}

/**
 * Produit agricole publié par un producteur (Module D).
 */
export interface Produit {
  id: string;
  /** Identifiant du producteur propriétaire. */
  producteurId: string;
  nom: string;
  description: string;
  categorie: Categorie;
  /** Prix unitaire en FCFA (entier). */
  prix: number;
  unite: Unite;
  /** Quantité disponible à la vente (entier ≥ 0). */
  quantiteDisponible: number;
  localisation: string;
  imageUrl: string;
  actif: boolean;
  /** Date ISO 8601 de création. */
  dateCreation: string;
  /** Renseigné si le produit a été modéré par un administrateur. */
  moderation?: ModerationProduit;
}
