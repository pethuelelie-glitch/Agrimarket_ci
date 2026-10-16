import { StorageAdapter } from './storage-adapter';

/**
 * Support de stockage en mémoire, utilisé par les tests unitaires et de parcours.
 * Permet aussi de simuler une écriture impossible (quota dépassé).
 */
export class InMemoryAdapter implements StorageAdapter {
  private contenu: string | null;

  /** Quand vrai, toute écriture échoue (simulation d'un quota dépassé). */
  echecEcriture = false;

  /** Nombre d'écritures réalisées (utile pour vérifier l'atomicité). */
  ecritures = 0;

  constructor(initial: string | null = null) {
    this.contenu = initial;
  }

  read(): string | null {
    return this.contenu;
  }

  write(snapshot: string): void {
    if (this.echecEcriture) {
      throw new Error('QuotaExceededError (simulation)');
    }
    this.ecritures += 1;
    this.contenu = snapshot;
  }

  clear(): void {
    this.contenu = null;
  }

  /** Contenu brut courant, pour les assertions de test. */
  get brut(): string | null {
    return this.contenu;
  }
}
