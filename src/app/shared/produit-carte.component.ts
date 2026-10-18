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
        border: 1px solid var(--bord-doux);
        border-radius: var(--rayon-xl);
        background: linear-gradient(180deg, var(--blanc) 0%, color-mix(in srgb, var(--blanc) 98%, var(--vert-pale)) 100%);
        overflow: hidden;
        box-shadow: var(--ombre);
        transition: transform var(--transition-lente), box-shadow var(--transition-lente), border-color var(--transition);
      }
      .carte:hover {
        transform: translateY(-2px);
        box-shadow: var(--ombre-lift);
        border-color: color-mix(in srgb, var(--vert) 20%, var(--bord-doux));
      }
      .carte__lien {
        display: block;
        flex: 1;
        color: inherit;
        text-decoration: none;
        outline: none;
      }
      .carte__lien:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--vert-clair) 40%, transparent);
        outline-offset: 2px;
        border-radius: var(--rayon-xl) var(--rayon-xl) 0 0;
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
        gap: 0.3rem;
        padding: 0.9rem 1rem 0.7rem;
      }
      .carte__categorie {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--texte-tres-doux);
        font-weight: 600;
      }
      .carte__nom {
        margin: 0;
        font-size: 1.05rem;
      }
      .carte__prix {
        margin: 0.15rem 0 0;
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--vert);
      }
      .carte__unite {
        font-weight: 500;
        color: var(--texte-doux);
        font-size: 0.9rem;
      }
      .carte__meta {
        margin: 0.25rem 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        font-size: 0.875rem;
        color: var(--texte-doux);
      }
      .carte__pied {
        display: grid;
        gap: 0.5rem;
        padding: 0 1rem 1rem;
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
