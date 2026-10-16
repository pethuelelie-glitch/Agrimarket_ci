import { Role, StatutCommande } from '../models';

/**
 * Table unique des transitions de statut de commande (décision D5, task 7.4).
 *
 * Chaque entrée décrit une transition autorisée : le statut cible et les rôles
 * qui peuvent la déclencher **manuellement**. Les transitions `automatique` sont
 * déclenchées par le module de livraison (décision D6) et ne sont jamais
 * proposées comme action directe à un utilisateur.
 */
export interface TransitionCommande {
  readonly cible: StatutCommande;
  /** Rôles autorisés à déclencher la transition à la main (vide = système). */
  readonly roles: readonly Role[];
  /** Transition pilotée par le module de livraison, jamais par une action directe. */
  readonly automatique?: boolean;
}

export const TRANSITIONS_COMMANDE: Readonly<Record<StatutCommande, readonly TransitionCommande[]>> = {
  EN_ATTENTE: [
    { cible: 'CONFIRMEE', roles: ['PRODUCTEUR'] },
    { cible: 'ANNULEE', roles: ['ACHETEUR', 'PRODUCTEUR', 'ADMIN'] },
  ],
  CONFIRMEE: [
    { cible: 'EN_PREPARATION', roles: ['PRODUCTEUR'] },
    { cible: 'ANNULEE', roles: ['ACHETEUR', 'PRODUCTEUR', 'ADMIN'] },
  ],
  EN_PREPARATION: [
    { cible: 'PRETE', roles: ['PRODUCTEUR'] },
    { cible: 'ANNULEE', roles: ['ADMIN'] },
  ],
  PRETE: [
    { cible: 'EN_LIVRAISON', roles: [], automatique: true },
    { cible: 'ANNULEE', roles: ['ADMIN'] },
  ],
  EN_LIVRAISON: [
    { cible: 'LIVREE', roles: [], automatique: true },
    { cible: 'PRETE', roles: [], automatique: true },
    { cible: 'ANNULEE', roles: ['ADMIN'] },
  ],
  LIVREE: [],
  ANNULEE: [],
};

/** Toutes les transitions prévues depuis un statut, dans l'ordre du cycle de vie. */
export function transitionsPossibles(statut: StatutCommande): readonly StatutCommande[] {
  return TRANSITIONS_COMMANDE[statut].map((transition) => transition.cible);
}

/** Libellé lisible d'une liste de statuts, pour les messages d'erreur. */
export function listerStatuts(statuts: readonly StatutCommande[]): string {
  return statuts.join(', ');
}

/**
 * La transition `statut → cible` est-elle autorisée **pour ce rôle**, à la main ?
 * Les transitions automatiques (livraison) renvoient `false` : elles ne sont
 * pas déclenchables par une action utilisateur.
 */
export function transitionAutorisee(
  statut: StatutCommande,
  cible: StatutCommande,
  role: Role,
): boolean {
  const transition = TRANSITIONS_COMMANDE[statut].find((candidat) => candidat.cible === cible);
  if (!transition) {
    return false;
  }
  return transition.roles.includes(role);
}

/** Statut cible existant-il dans la table depuis `statut` (automatique compris) ? */
export function statutCibleExiste(statut: StatutCommande, cible: StatutCommande): boolean {
  return TRANSITIONS_COMMANDE[statut].some((transition) => transition.cible === cible);
}

/** Transitions manuelles ouvertes à ce rôle depuis ce statut. */
export function ciblesManuelles(statut: StatutCommande, role: Role): StatutCommande[] {
  return TRANSITIONS_COMMANDE[statut]
    .filter((transition) => !transition.automatique && transition.roles.includes(role))
    .map((transition) => transition.cible);
}
