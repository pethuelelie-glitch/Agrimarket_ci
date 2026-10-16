import { PersistenceService } from '../persistence/persistence.service';
import { creerEtatDemo } from './seed';

export interface OptionsAmorcage {
  /** Force la reconstruction des données même si elles sont déjà initialisées. */
  forcer?: boolean;
  /** Date de référence utilisée pour dater le jeu de démonstration. */
  maintenant?: Date;
}

/**
 * Amorce les données de démonstration une seule fois (task 1.7).
 *
 * Le marqueur `meta.initialized` garantit l'idempotence : un second appel ne
 * reconstruit ni ne duplique les données. `forcer: true` est utilisé par la
 * réinitialisation administrative (task 10.7).
 *
 * @returns `true` si les données ont été (re)créées, `false` sinon.
 */
export async function amorcerDonneesDemo(
  persistence: PersistenceService,
  options: OptionsAmorcage = {},
): Promise<boolean> {
  const { forcer = false, maintenant = new Date() } = options;

  if (!forcer && persistence.etat().meta.initialized) {
    return false;
  }

  const etat = await creerEtatDemo(maintenant);
  persistence.remplacer(etat);
  return true;
}
