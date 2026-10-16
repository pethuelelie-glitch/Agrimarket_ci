/**
 * Rôles de la plateforme AgriMarket CI (Module C — gestion des rôles).
 */
export type Role = 'ADMIN' | 'PRODUCTEUR' | 'ACHETEUR' | 'LIVREUR';

/** Les quatre rôles reconnus par le système. */
export const ROLES: readonly Role[] = ['ADMIN', 'PRODUCTEUR', 'ACHETEUR', 'LIVREUR'];

/** Rôles proposés à l'inscription. ADMIN n'est jamais auto-attribuable. */
export const ROLES_INSCRIPTION: readonly Role[] = ['PRODUCTEUR', 'ACHETEUR', 'LIVREUR'];

/** Libellés affichables en français. */
export const LIBELLES_ROLE: Readonly<Record<Role, string>> = {
  ADMIN: 'Administrateur',
  PRODUCTEUR: 'Producteur',
  ACHETEUR: 'Acheteur',
  LIVREUR: 'Livreur',
};

/** Garde de type : la valeur est-elle un rôle reconnu ? */
export function estRole(valeur: unknown): valeur is Role {
  return typeof valeur === 'string' && (ROLES as readonly string[]).includes(valeur);
}
