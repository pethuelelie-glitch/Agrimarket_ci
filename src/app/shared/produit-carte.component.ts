import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGE_SECOURS } from '../core/data/seed';
import { LIBELLES_CATEGORIE, LIBELLES_UNITE, Produit } from '../core/models';
import { MontantFcfaPipe } from './montant-fcfa.pipe';

/**
 * Carte produit partagée (accueil, catalogue) : image avec secours, nom,
 * prix, unité, localisation et lien vers la fiche détaillée.
 */
@Component({
  selector: 'app-produit-carte',
  imports: [RouterLink, MontantFcfaPipe],
  template: `
    <article class="carte">
      <a class="carte__lien" [routerLink]="cheminProduit">
        <img
          class="carte__image"
          [src]="imageAffichee()"
          [alt]="produit().nom"
          loading="lazy"
          (error)="basculerSurSecours()"
        />
        <div class="carte__corps">
          <span class="carte__categorie">{{ libelleCategorie }}</span>
          <h3 class="carte__nom">{{ produit().nom }}</h3>
          <p class="carte__prix">
            {{ produit().prix | montantFcfa }}<span class="carte__unite"> / {{ libelleUnite }}</span>
          </p>
          <p class="carte__meta">
            <span>{{ produit().localisation }}</span>
            <span aria-hidden="true">•</span>
            <span>{{ produit().quantiteDisponible }} {{ libelleUnite }} en stock</span>
          </p>
        </div>
      </a>
    </article>
  `,
  styles: [
    `
      .carte {
        border: 1px solid #d7ddcd;
        border-radius: 0.75rem;
        background: #ffffff;
        overflow: hidden;
        block-size: 100%;
      }
      .carte__lien {
        display: block;
        block-size: 100%;
        color: inherit;
        text-decoration: none;
      }
      .carte__image {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        background: #eef3ea;
      }
      .carte__corps {
        display: grid;
        gap: 0.2rem;
        padding: 0.75rem;
      }
      .carte__categorie {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #5c6b52;
      }
      .carte__nom {
        margin: 0;
        font-size: 1rem;
      }
      .carte__prix {
        margin: 0;
        font-weight: 700;
        color: #2e7d32;
      }
      .carte__unite {
        font-weight: 400;
        color: #4a5743;
      }
      .carte__meta {
        margin: 0.25rem 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        font-size: 0.8rem;
        color: #5c6b52;
      }
    `,
  ],
})
export class ProduitCarteComponent {
  readonly produit = input.required<Produit>();

  private readonly imageSecours = IMAGE_SECOURS;
  private secoursAffiche = false;

  get cheminProduit(): string {
    return `/catalogue/${this.produit().id}`;
  }

  get libelleCategorie(): string {
    return LIBELLES_CATEGORIE[this.produit().categorie];
  }

  get libelleUnite(): string {
    return LIBELLES_UNITE[this.produit().unite];
  }

  /** Image du produit, ou image de secours si l'URL est absente ou invalide. */
  imageAffichee(): string {
    if (this.secoursAffiche) {
      return this.imageSecours;
    }
    return this.produit().imageUrl || this.imageSecours;
  }

  /** Bascule sur l'image de secours après un chargement en échec. */
  basculerSurSecours(): void {
    this.secoursAffiche = true;
  }
}
