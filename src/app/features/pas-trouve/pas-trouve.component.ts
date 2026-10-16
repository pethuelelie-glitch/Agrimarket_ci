import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../../core/navigation';

/** Page de repli 404 (task 4.5) : aucun écran blanc sur une URL inconnue. */
@Component({
  selector: 'app-pas-trouve',
  imports: [RouterLink],
  template: `
    <section class="pas-trouve">
      <p class="pas-trouve__code" aria-hidden="true">404</p>
      <h1>Page introuvable</h1>
      <p>
        L'adresse demandée n'existe pas ou a été déplacée. Revenez à l'accueil ou consultez le
        catalogue.
      </p>
      <div class="pas-trouve__actions">
        <a class="bouton" [routerLink]="chemins.accueil">Retour à l'accueil</a>
        <a class="bouton bouton--discret" [routerLink]="chemins.catalogue">Voir le catalogue</a>
      </div>
    </section>
  `,
  styles: [
    `
      .pas-trouve {
        display: grid;
        gap: 0.75rem;
        justify-items: start;
        padding: 2rem;
        background: var(--blanc);
        border: 1px solid var(--bord);
        border-radius: var(--rayon);
      }
      .pas-trouve__code {
        margin: 0;
        font-size: 3rem;
        font-weight: 800;
        color: var(--vert-clair);
        line-height: 1;
      }
      .pas-trouve p {
        max-width: 55ch;
        color: var(--texte-doux);
      }
      .pas-trouve__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }
    `,
  ],
})
export class PasTrouveComponent {
  readonly chemins = CHEMINS;
}
