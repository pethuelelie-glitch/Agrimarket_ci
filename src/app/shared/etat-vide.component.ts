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
        border: 1.5px dashed color-mix(in srgb, var(--vert) 30%, var(--bord));
        border-radius: var(--rayon-2xl);
        background: var(--surface);
        padding: clamp(1.5rem, 3vw, 2.25rem);
        display: grid;
        gap: 0.6rem;
        justify-items: start;
      }
      .etat-vide h3 {
        margin: 0;
        font-size: 1.2rem;
        color: var(--titre);
      }
      .etat-vide p {
        margin: 0;
        color: var(--texte-doux);
        max-width: 58ch;
        line-height: 1.6;
      }
      .etat-vide__action {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        min-height: 2.75rem;
        padding: 0.6rem 1.2rem;
        border: 1px solid transparent;
        border-radius: 999px;
        background: var(--primaire);
        color: var(--sur-primaire);
        font: inherit;
        font-weight: 650;
        text-decoration: none;
        cursor: pointer;
        box-shadow: var(--ombre-xs);
        transition:
          transform var(--transition),
          box-shadow var(--transition),
          background var(--transition);
      }
      .etat-vide__action:hover {
        background: var(--primaire-survol);
        color: var(--sur-primaire);
        box-shadow: var(--ombre-md);
        transform: translateY(-1px);
      }
      .etat-vide__action:focus-visible {
        outline: none;
        box-shadow: var(--anneau);
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
