import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CHEMINS } from '../core/navigation';
import { AuthService } from '../core/services/auth.service';
import { IconeComponent } from './icone.component';

/**
 * Bouton de déconnexion (task 2.6) : ferme la session puis renvoie à l'accueil.
 * Utilisé par l'en-tête de l'application.
 */
@Component({
  selector: 'app-deconnexion-bouton',
  imports: [IconeComponent],
  template: `
    <button type="button" class="bouton-deconnexion" title="Déconnexion" (click)="seDeconnecter()">
      <app-icone nom="sortie" [taille]="17" />
      <span class="bouton-deconnexion__texte">Déconnexion</span>
    </button>
  `,
  styles: [
    `
      .bouton-deconnexion {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        min-height: 2.5rem;
        padding: 0.45rem 0.95rem;
        border: 1px solid var(--bord);
        border-radius: 999px;
        background: transparent;
        color: var(--texte-doux);
        font: inherit;
        font-size: 0.88rem;
        font-weight: 650;
        cursor: pointer;
        transition:
          background var(--transition),
          color var(--transition),
          border-color var(--transition);
      }
      .bouton-deconnexion:hover {
        background: var(--rouge-fond);
        border-color: color-mix(in srgb, var(--rouge) 30%, transparent);
        color: var(--rouge);
      }
      /* Écrans moyens : icône seule, le libellé reste lu par les lecteurs d'écran. */
      @media (min-width: 1100px) and (max-width: 1439px) {
        .bouton-deconnexion {
          padding-inline: 0.7rem;
        }
        .bouton-deconnexion__texte {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
      }
      .bouton-deconnexion:focus-visible {
        outline: none;
        box-shadow: var(--anneau);
      }
    `,
  ],
})
export class DeconnexionBoutonComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async seDeconnecter(): Promise<void> {
    this.auth.deconnecter();
    await this.router.navigate([CHEMINS.accueil]);
  }
}
