import { Injectable, Signal, signal } from '@angular/core';

/**
 * Messages d'information transverses (accès refusé, compte désactivé…),
 * affichés par les écrans de destination après une redirection de guard.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly messageInterne = signal<string | null>(null);

  /** Message courant, ou null. */
  readonly message: Signal<string | null> = this.messageInterne.asReadonly();

  /** Publie un message à afficher. */
  informer(texte: string): void {
    this.messageInterne.set(texte);
  }

  /** Efface le message courant. */
  effacer(): void {
    this.messageInterne.set(null);
  }
}
