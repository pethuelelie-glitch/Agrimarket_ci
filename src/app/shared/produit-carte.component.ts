import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGE_SECOURS } from '../core/data/seed';
import { LIBELLES_CATEGORIE, LIBELLES_UNITE, Produit } from '../core/models';
import { cheminProduit } from '../core/navigation';
import { BoutonAjoutPanierComponent } from './bouton-ajout-panier.component';
import { MontantFcfaPipe } from './montant-fcfa.pipe';

/**
 * Carte produit partagée (accueil, catalogue) : image avec secours, nom, prix,
 * unité, localisation, lien vers la fiche détaillée et action d'ajout au panier
 * neutralisée lorsqu'un produit est inactif ou épuisé (task 5.9).
 */
@Component({
  selector: 'app-produit-carte',
  imports: [RouterLink, MontantFcfaPipe, BoutonAjoutPanierComponent],
  template: `
    <article class="carte">
      <a class="carte__lien" [routerLink]="chemin">
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
            {{ produit().prix | montantFcfa
            }}<span class="carte__unite"> / {{ libelleUnite }}</span>
          </p>
          <p class="carte__meta">
            <span>{{ produit().localisation }}</span>
            <span aria-hidden="true">•</span>
            <span>{{ produit().quantiteDisponible }} {{ libelleUnite }} en stock</span>
          </p>
        </div>
      </a>

      <div class="carte__pied">
        @if (!produit().actif) {
          <span class="badge badge--danger">Inactif</span>
        } @else if (produit().quantiteDisponible <= 0) {
          <span class="badge badge--alerte">Rupture de stock</span>
        }
        <app-bouton-ajout-panier [produit]="produit()" (ajouter)="ajouter.emit()" />
      </div>
    </article>
  `,
  styles: [
    `
      .carte {
        display: flex;
        flex-direction: column;
        block-size: 100%;
        border: 1px solid var(--bord);
        border-radius: var(--rayon);
        background: var(--blanc);
        overflow: hidden;
      }
      .carte__lien {
        display: block;
        flex: 1;
        color: inherit;
        text-decoration: none;
      }
      .carte__image {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        background: var(--vert-pale);
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
        color: var(--texte-doux);
      }
      .carte__nom {
        margin: 0;
        font-size: 1rem;
      }
      .carte__prix {
        margin: 0;
        font-weight: 700;
        color: var(--vert);
      }
      .carte__unite {
        font-weight: 400;
        color: var(--texte-doux);
      }
      .carte__meta {
        margin: 0.25rem 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        font-size: 0.8rem;
        color: var(--texte-doux);
      }
      .carte__pied {
        display: grid;
        gap: 0.4rem;
        padding: 0 0.75rem 0.75rem;
      }
    `,
  ],
})
export class ProduitCarteComponent {
  readonly produit = input.required<Produit>();
  /** Relaye la demande d'ajout au panier vers le parent. */
  readonly ajouter = output<void>();

  private readonly imageSecours = IMAGE_SECOURS;
  private secoursAffiche = false;

  get chemin(): string {
    return cheminProduit(this.produit().id);
  }

  get libelleCategorie(): string {
    return LIBELLES_CATEGORIE[this.produit().categorie];
  }

  get libelleUnite(): string {
    return LIBELLES_UNITE[this.produit().unite];
  }

  /** Image du produit, ou image générique de secours si l'URL est absente ou invalide. */
  imageAffichee(): string {
    if (this.secoursAffiche) {
      return this.imageSecours;
    }
    return this.produit().imageUrl || this.imageSecours;
  }

  basculerSurSecours(): void {
    this.secoursAffiche = true;
  }
}
