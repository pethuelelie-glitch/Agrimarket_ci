/**
 * Statuts d'une livraison (Module G).
 */
export type StatutLivraison = 'EN_ATTENTE' | 'ASSIGNEE' | 'EN_COURS' | 'LIVREE' | 'ECHEC';

export const STATUTS_LIVRAISON: readonly StatutLivraison[] = [
  'EN_ATTENTE',
  'ASSIGNEE',
  'EN_COURS',
  'LIVREE',
  'ECHEC',
];

export const LIBELLES_STATUT_LIVRAISON: Readonly<Record<StatutLivraison, string>> = {
  EN_ATTENTE: 'En attente d’attribution',
  ASSIGNEE: 'Assignée',
  EN_COURS: 'En cours',
  LIVREE: 'Livrée',
  ECHEC: 'Échec',
};

export function estStatutLivraison(valeur: unknown): valeur is StatutLivraison {
  return typeof valeur === 'string' && (STATUTS_LIVRAISON as readonly string[]).includes(valeur);
}

/** Statuts finaux d'une livraison : aucune transition n'en sort. */
export const STATUTS_LIVRAISON_FINAUX: readonly StatutLivraison[] = ['LIVREE', 'ECHEC'];

/**
 * Une livraison est « active » si elle n'est ni livrée ni en échec.
 * Une commande ne peut avoir qu'une seule livraison active à la fois.
 */
export function estLivraisonActive(statut: StatutLivraison): boolean {
  return !(STATUTS_LIVRAISON_FINAUX as readonly string[]).includes(statut);
}

/** Événement horodaté de l'historique d'une livraison. */
export interface EvenementLivraison {
  /** Date ISO 8601. */
  le: string;
  ancienStatut: StatutLivraison;
  nouveauStatut: StatutLivraison;
  acteurId: string;
  commentaire?: string;
}

/**
 * Livraison d'une commande (Module G).
 */
export interface Livraison {
  id: string;
  /** Référence lisible et unique, de la forme LIV-AAAAMMJJ-XXXX. */
  reference: string;
  commandeId: string;
  commandeReference: string;
  /** Livreur attribué, null tant qu'aucune attribution n'a eu lieu. */
  livreurId: string | null;
  adresseDestination: string;
  statut: StatutLivraison;
  /** Date ISO 8601 de création. */
  dateCreation: string;
  /** Date ISO 8601 d'affectation, null tant qu'aucun livreur n'est attribué. */
  dateAffectation: string | null;
  /** Date ISO 8601 de livraison effective, null tant que non livrée. */
  dateLivraison: string | null;
  commentaire: string;
  historique: EvenementLivraison[];
}
