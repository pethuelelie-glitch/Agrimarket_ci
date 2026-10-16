import { Component, computed, input, output } from '@angular/core';
import { estDisponible, messageIndisponibilite } from '../core/catalogue/disponibilite';
import { Produit } from '../core/models';

/**
 * Bouton « Ajouter au panier » partagé (task 5.9).
 *
 * Le bouton est neutralisé pour tout produit inactif ou épuisé, et le motif est
 * affiché en clair (« rupture de stock », « produit indisponible »). Le clic
 * n'est relayé au parent que lorsque le produit est réellement vendable.
 */
@Component({
  selector: 'app-bouton-ajout-panier',
  template: `
    <button
      type="button"
      class="bouton bouton--panier"
      [disabled]="!disponible()"
      (click)="ajouter.emit()"
    >
      Ajouter au panier
    </button>
    @if (message(); as texte) {
      <p class="rupture" role="status">{{ texte }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 0.35rem;
      }
      .bouton--panier {
        width: 100%;
      }
      .rupture {
        margin: 0;
        color: var(--rouge);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class BoutonAjoutPanierComponent {
  readonly produit = input.required<Produit>();
  /** Émis uniquement quand le produit est vendable. */
  readonly ajouter = output<void>();

  readonly disponible = computed(() => estDisponible(this.produit()));
  readonly message = computed(() => messageIndisponibilite(this.produit()));
}
