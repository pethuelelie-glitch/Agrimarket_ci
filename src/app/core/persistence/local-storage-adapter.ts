import { CLE_STOCKAGE } from '../config';
import { StorageAdapter } from './storage-adapter';

/**
 * Support de stockage réel : le `localStorage` du navigateur.
 * Aucun composant n'accède directement au stockage : tout passe par cet adaptateur.
 */
export class LocalStorageAdapter implements StorageAdapter {
  read(): string | null {
    return globalThis.localStorage.getItem(CLE_STOCKAGE);
  }

  write(snapshot: string): void {
    globalThis.localStorage.setItem(CLE_STOCKAGE, snapshot);
  }

  clear(): void {
    globalThis.localStorage.removeItem(CLE_STOCKAGE);
  }
}
