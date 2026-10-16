import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Composant partagé d'état vide et d'erreur de chargement (task 4.4).
 *
 * Affiche un message en français et, si demandé, une action :
 * - `libelleBouton` + `action` → un bouton (réessai, réinitialisation…) ;
 * - `libelleBouton` + `lienBouton` → un lien de navigation.
 * Aucun écran ne doit rester blanc.
 */
@Component({
  selector: 'app-etat-vide',
  imports: [RouterLink],
  template: `
    <div class="etat-vide" role="status">
      <h3>{{ titre() }}</h3>
      <p>{{ message() }}</p>
      @if (libelleBouton(); as libelle) {
        @if (lienBouton(); as lien) {
          <a class="etat-vide__action" [routerLink]="lien">{{ libelle }}</a>
        } @else {
          <button type="button" class="etat-vide__action" (click)="action.emit()">
            {{ libelle }}
          </button>
        }
      }
    </div>
  `,
  styles: [
    `
      .etat-vide {
        border: 1px dashed var(--bord);
        border-radius: var(--rayon);
        background: var(--vert-pale);
        padding: 1.5rem;
        display: grid;
        gap: 0.5rem;
        justify-items: start;
      }
      .etat-vide h3 {
        margin: 0;
        font-size: 1.05rem;
        color: var(--vert-fonce);
      }
      .etat-vide p {
        margin: 0;
        color: var(--texte-doux);
        max-width: 55ch;
      }
      .etat-vide__action {
        display: inline-block;
        margin-top: 0.35rem;
        padding: 0.5rem 1rem;
        border: 0;
        border-radius: var(--rayon);
        background: var(--vert);
        color: var(--blanc);
        font: inherit;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
      }
      .etat-vide__action:hover {
        background: var(--vert-fonce);
      }
    `,
  ],
})
export class EtatVideComponent {
  readonly titre = input('Rien à afficher');
  readonly message = input.required<string>();
  /** Libellé de l'action ; `null` pour ne rien afficher. */
  readonly libelleBouton = input<string | null>(null);
  /** Chemin de navigation ; si renseigné, l'action devient un lien. */
  readonly lienBouton = input<string | null>(null);
  /** Émet lorsque l'utilisateur demande l'action (mode bouton uniquement). */
  readonly action = output<void>();
}
