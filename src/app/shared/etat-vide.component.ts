import { Component, input, output } from '@angular/core';

/**
 * Composant partagé d'état vide et d'erreur de chargement (task 4.4).
 *
 * Affiche un message en français et, si demandé, un bouton d'action
 * (réessai, retour au catalogue…) : aucun écran ne doit rester blanc.
 */
@Component({
  selector: 'app-etat-vide',
  template: `
    <div class="etat-vide" role="status">
      <h3>{{ titre() }}</h3>
      <p>{{ message() }}</p>
      @if (libelleBouton()) {
        <button type="button" class="etat-vide__action" (click)="action.emit()">
          {{ libelleBouton() }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .etat-vide {
        border: 1px dashed #b6c2ac;
        border-radius: 0.75rem;
        background: #f6f9f4;
        padding: 1.5rem;
        display: grid;
        gap: 0.5rem;
        justify-items: start;
      }
      .etat-vide h3 {
        margin: 0;
        font-size: 1.05rem;
        color: #2c3a26;
      }
      .etat-vide p {
        margin: 0;
        color: #4a5743;
        max-width: 55ch;
      }
      .etat-vide__action {
        margin-top: 0.35rem;
        padding: 0.5rem 1rem;
        border: 0;
        border-radius: 0.5rem;
        background: #2e7d32;
        color: #ffffff;
        font: inherit;
        cursor: pointer;
      }
      .etat-vide__action:focus-visible {
        outline: 3px solid #a5d6a7;
        outline-offset: 2px;
      }
    `,
  ],
})
export class EtatVideComponent {
  readonly titre = input('Rien à afficher');
  readonly message = input.required<string>();
  /** Libellé du bouton d'action ; null/undefined pour ne pas afficher de bouton. */
  readonly libelleBouton = input<string | null>(null);
  /** Émet lorsque l'utilisateur demande l'action (réessai, navigation…). */
  readonly action = output<void>();
}
