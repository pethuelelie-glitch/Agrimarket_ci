import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../core/navigation';

/**
 * Pied de page de l'application (task 3.4).
 * Rappelle que la démonstration est sans backend et que le contrôle d'accès est
 * une protection d'interface, non une sécurité de production.
 */
@Component({
  selector: 'app-pied-de-page',
  imports: [RouterLink],
  template: `
    <footer class="pied-de-page">
      <p>
        <strong>AgriMarket CI</strong> — démonstration sans backend. Les données, le panier et la
        session sont conservés uniquement dans ce navigateur (stockage local) : aucune
        synchronisation entre appareils.
      </p>
      <p>
        Le contrôle d'accès est une protection d'interface côté client : un stockage local modifié
        manuellement peut tromper les gardes, et il ne remplace pas une vérification côté serveur.
        <a [routerLink]="chemins.aide">En savoir plus sur les limites</a>.
      </p>
      <p>Authentification locale simulée — n'utilisez pas de mot de passe réel.</p>
    </footer>
  `,
  styles: [
    `
      .pied-de-page {
        border-top: 1px solid #d7ddcd;
        margin-top: 2rem;
        padding: 1rem 1.25rem 2rem;
        font-size: 0.85rem;
        color: #44513c;
        display: grid;
        gap: 0.35rem;
      }
      .pied-de-page p {
        margin: 0;
        max-width: 70ch;
      }
    `,
  ],
})
export class PiedDePageComponent {
  readonly chemins = CHEMINS;
}
