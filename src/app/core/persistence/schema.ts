import { EtatApplication } from '../models';

/**
 * Vérifie qu'une valeur inconnue a bien la structure du document racine.
 * Protège l'application contre des données locales corrompues ou d'un autre format.
 */
export function estEtatApplication(valeur: unknown): valeur is EtatApplication {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const etat = valeur as Partial<EtatApplication>;
  if (typeof etat.schemaVersion !== 'number') {
    return false;
  }
  if (typeof etat.meta !== 'object' || etat.meta === null) {
    return false;
  }
  if (typeof etat.meta.initialized !== 'boolean') {
    return false;
  }
  if (
    !Array.isArray(etat.users) ||
    !Array.isArray(etat.products) ||
    !Array.isArray(etat.orders) ||
    !Array.isArray(etat.deliveries)
  ) {
    return false;
  }
  if (typeof etat.carts !== 'object' || etat.carts === null || Array.isArray(etat.carts)) {
    return false;
  }
  if (etat.session !== null && typeof etat.session !== 'object') {
    return false;
  }
  return true;
}
