import { Unite } from './produit';

/**
 * Statuts d'une commande (Module F).
 */
export type StatutCommande =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'EN_PREPARATION'
  | 'PRETE'
  | 'EN_LIVRAISON'
  | 'LIVREE'
  | 'ANNULEE';

/** Tous les statuts, dans l'ordre du cycle de vie. */
export const STATUTS_COMMANDE: readonly StatutCommande[] = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'EN_PREPARATION',
  'PRETE',
  'EN_LIVRAISON',
  'LIVREE',
  'ANNULEE',
];

export const LIBELLES_STATUT_COMMANDE: Readonly<Record<StatutCommande, string>> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  EN_LIVRAISON: 'En livraison',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

export function estStatutCommande(valeur: unknown): valeur is StatutCommande {
  return typeof valeur === 'string' && (STATUTS_COMMANDE as readonly string[]).includes(valeur);
}

/** Les statuts finaux d'une commande : aucune transition n'en sort. */
export const STATUTS_COMMANDE_FINAUX: readonly StatutCommande[] = ['LIVREE', 'ANNULEE'];

/** Une commande est « en cours » si elle n'est ni livrée ni annulée. */
export function estCommandeEnCours(statut: StatutCommande): boolean {
  return !(STATUTS_COMMANDE_FINAUX as readonly string[]).includes(statut);
}

/** Ligne d'une commande : instantané du produit au moment de l'achat (prix figé). */
export interface LigneCommande {
  produitId: string;
  /** Nom du produit au moment de l'achat (instantané). */
  nomProduit: string;
  /** Unité de vente au moment de l'achat (instantané). */
  unite: Unite;
  quantite: number;
  /** Prix unitaire en FCFA, figé à l'achat. */
  prixUnitaire: number;
  /** quantite × prixUnitaire. */
  sousTotal: number;
}

/** Événement horodaté de l'historique d'une commande. */
export interface EvenementCommande {
  /** Date ISO 8601. */
  le: string;
  statutPrecedent: StatutCommande | null;
  statut: StatutCommande;
  /** Identifiant de l'auteur du changement. */
  acteurId: string;
  commentaire?: string;
}

/**
 * Commande d'un acheteur auprès d'un unique producteur (Module F).
 */
export interface Commande {
  id: string;
  /** Référence lisible et unique, de la forme CMD-AAAAMMJJ-XXXX. */
  reference: string;
  acheteurId: string;
  /** Une commande porte un seul producteur. */
  producteurId: string;
  lignes: LigneCommande[];
  /** Somme des sous-totaux des lignes (FCFA). */
  montantProduits: number;
  /** Frais de livraison calculés (FCFA). */
  fraisLivraison: number;
  /** montantProduits + fraisLivraison (FCFA). */
  montantTotal: number;
  adresseLivraison: string;
  statut: StatutCommande;
  /** Date ISO 8601 de création. */
  dateCreation: string;
  historique: EvenementCommande[];
}
