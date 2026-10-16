import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CHEMINS } from '../core/navigation';
import { AuthService } from '../core/services/auth.service';

/**
 * Bouton de déconnexion (task 2.6) : ferme la session puis renvoie à l'accueil.
 * Utilisé par l'en-tête de l'application.
 */
@Component({
  selector: 'app-deconnexion-bouton',
  template: `
    <button type="button" class="bouton-deconnexion" (click)="seDeconnecter()">
      Déconnexion
    </button>
  `,
  styles: [
    `
      .bouton-deconnexion {
        border: 1px solid currentColor;
        background: transparent;
        color: inherit;
        border-radius: 0.4rem;
        padding: 0.35rem 0.7rem;
        font: inherit;
        cursor: pointer;
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
