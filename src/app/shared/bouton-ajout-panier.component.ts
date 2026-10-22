import { Component, computed, input, output } from '@angular/core';
import { estDisponible, messageIndisponibilite } from '../core/catalogue/disponibilite';
import { Produit } from '../core/models';
import { IconeComponent } from './icone.component';

/**
 * Bouton « Ajouter au panier » partagé (task 5.9).
 *
 * Le bouton est neutralisé pour tout produit inactif ou épuisé, et le motif est
 * affiché en clair (« rupture de stock », « produit indisponible »). Le clic
 * n'est relayé au parent que lorsque le produit est réellement vendable.
 */
@Component({
  selector: 'app-bouton-ajout-panier',
  imports: [IconeComponent],
  template: `
    <button
      type="button"
      class="bouton bouton--panier"
      [disabled]="!disponible()"
      (click)="ajouter.emit()"
    >
      <app-icone nom="panier" [taille]="18" />
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
      .bouton--panier:disabled {
        background: var(--surface-3);
        color: var(--texte-tres-doux);
        opacity: 1;
      }
      .rupture {
        margin: 0;
        color: var(--rouge);
        font-size: 0.82rem;
        font-weight: 550;
        text-align: center;
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
