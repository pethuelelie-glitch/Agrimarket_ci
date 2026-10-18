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
        border: 1px dashed color-mix(in srgb, var(--vert) 25%, var(--bord));
        border-radius: var(--rayon-xl);
        background: linear-gradient(180deg, color-mix(in srgb, var(--blanc) 60%, var(--vert-pale)) 0%, var(--blanc) 100%);
        padding: clamp(1.25rem, 2vw, 1.75rem);
        display: grid;
        gap: 0.6rem;
        justify-items: start;
        box-shadow: var(--ombre);
      }
      .etat-vide h3 {
        margin: 0;
        font-size: 1.15rem;
        color: var(--vert-fonce);
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
        margin-top: 0.4rem;
        padding: 0.65rem 1.15rem;
        border: 1px solid transparent;
        border-radius: var(--rayon);
        background: linear-gradient(180deg, var(--vert-clair) 0%, var(--vert) 100%);
        color: var(--blanc);
        font: inherit;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        box-shadow: var(--ombre);
        transition: transform var(--transition), box-shadow var(--transition), background var(--transition);
      }
      .etat-vide__action:hover {
        background: linear-gradient(180deg, var(--vert) 0%, var(--vert-fonce) 100%);
        box-shadow: var(--ombre-md);
        transform: translateY(-1px);
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
