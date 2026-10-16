import { InjectionToken } from '@angular/core';
import { LocalStorageAdapter } from './local-storage-adapter';

/**
 * Abstraction du support de stockage (décision D3).
 * Permet de remplacer le stockage local par une API sans modifier les écrans
 * ni les règles métier.
 */
export interface StorageAdapter {
  /** Lit le document racine sérialisé, ou null si rien n'est enregistré. */
  read(): string | null;
  /** Écrit le document racine sérialisé. Peut lever une erreur (quota, indisponible). */
  write(snapshot: string): void;
  /** Supprime le document racine. */
  clear(): void;
}

/**
 * Jeton d'injection du support de stockage.
 * Par défaut : le stockage du navigateur ; les tests injectent un adaptateur en mémoire.
 */
export const STORAGE_ADAPTER = new InjectionToken<StorageAdapter>('agrimarket.storage-adapter', {
  providedIn: 'root',
  factory: () => new LocalStorageAdapter(),
});
