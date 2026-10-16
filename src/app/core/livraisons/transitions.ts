import { Role, StatutLivraison } from '../models';

/**
 * Table unique des transitions de statut de livraison (Module G).
 * Les transitions sont pilotées par l'administrateur (affectation) ou par le
 * livreur attribué (prise en charge, livraison, échec).
 */
export interface TransitionLivraison {
  readonly cible: StatutLivraison;
  readonly roles: readonly Role[];
}

export const TRANSITIONS_LIVRAISON: Readonly<Record<StatutLivraison, readonly TransitionLivraison[]>> = {
  EN_ATTENTE: [{ cible: 'ASSIGNEE', roles: ['ADMIN'] }],
  ASSIGNEE: [
    { cible: 'EN_COURS', roles: ['LIVREUR'] },
    { cible: 'ECHEC', roles: ['LIVREUR'] },
  ],
  EN_COURS: [
    { cible: 'LIVREE', roles: ['LIVREUR'] },
    { cible: 'ECHEC', roles: ['LIVREUR'] },
  ],
  LIVREE: [],
  ECHEC: [],
};

/** Transitions prévues depuis un statut (message d'erreur). */
export function transitionsLivraisonPossibles(statut: StatutLivraison): readonly StatutLivraison[] {
  return TRANSITIONS_LIVRAISON[statut].map((transition) => transition.cible);
}

/** Libellé lisible d'une liste de statuts de livraison. */
export function listerStatutsLivraison(statuts: readonly StatutLivraison[]): string {
  return statuts.join(', ');
}

/** La transition `statut → cible` est-elle ouverte à ce rôle ? */
export function transitionLivraisonAutorisee(
  statut: StatutLivraison,
  cible: StatutLivraison,
  role: Role,
): boolean {
  const transition = TRANSITIONS_LIVRAISON[statut].find((candidat) => candidat.cible === cible);
  return !!transition && transition.roles.includes(role);
}
