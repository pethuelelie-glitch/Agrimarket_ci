import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGE_SECOURS } from '../core/data/seed';
import { LIBELLES_CATEGORIE, LIBELLES_UNITE, Produit } from '../core/models';
import { cheminProduit } from '../core/navigation';
import { BoutonAjoutPanierComponent } from './bouton-ajout-panier.component';
import { IconeComponent } from './icone.component';
import { MontantFcfaPipe } from './montant-fcfa.pipe';

/**
 * Carte produit partagée (accueil, catalogue) : image avec secours, nom, prix,
 * unité, localisation, lien vers la fiche détaillée et action d'ajout au panier
 * neutralisée lorsqu'un produit est inactif ou épuisé (task 5.9).
 */
@Component({
  selector: 'app-produit-carte',
  imports: [RouterLink, MontantFcfaPipe, BoutonAjoutPanierComponent, IconeComponent],
  template: `
    <article class="carte" [class.carte--indisponible]="!produit().actif || epuise">
      <a class="carte__lien" [routerLink]="chemin">
        <div class="carte__media">
          <img
            class="carte__image"
            [src]="imageAffichee()"
            [alt]="produit().nom"
            loading="lazy"
            decoding="async"
            (error)="basculerSurSecours()"
          />
          <span class="carte__categorie">{{ libelleCategorie }}</span>
          @if (!produit().actif) {
            <span class="carte__etat badge badge--danger">Inactif</span>
          } @else if (epuise) {
            <span class="carte__etat badge badge--alerte">Rupture de stock</span>
          }
        </div>
        <div class="carte__corps">
          <h3 class="carte__nom">{{ produit().nom }}</h3>
          <p class="carte__meta">
            <span class="carte__lieu">
              <app-icone nom="epingle" [taille]="15" />{{ produit().localisation }}
            </span>
            <span class="carte__stock" [class.carte__stock--vide]="epuise">
              {{ produit().quantiteDisponible }} {{ libelleUnite }} en stock
            </span>
          </p>
          <p class="carte__prix">
            {{ produit().prix | montantFcfa
            }}<span class="carte__unite"> / {{ libelleUnite }}</span>
          </p>
        </div>
      </a>

      <div class="carte__pied">
        <app-bouton-ajout-panier [produit]="produit()" (ajouter)="ajouter.emit()" />
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        block-size: 100%;
      }
      .carte {
        position: relative;
        display: flex;
        flex-direction: column;
        block-size: 100%;
        border: 1px solid var(--bord-doux);
        border-radius: var(--rayon-2xl);
        background: var(--surface);
        overflow: hidden;
        box-shadow: var(--ombre);
        transition:
          transform var(--transition-lente),
          box-shadow var(--transition-lente),
          border-color var(--transition);
      }
      .carte:hover {
        transform: translateY(-4px);
        box-shadow: var(--ombre-lift);
        border-color: color-mix(in srgb, var(--vert) 22%, var(--bord-doux));
      }
      .carte__lien {
        display: flex;
        flex-direction: column;
        flex: 1;
        color: inherit;
        text-decoration: none;
        outline: none;
      }
      .carte__lien:focus-visible {
        box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--vert-clair) 60%, transparent);
        border-radius: var(--rayon-2xl) var(--rayon-2xl) 0 0;
      }
      .carte__media {
        position: relative;
        overflow: hidden;
        background: var(--vert-pale);
      }
      .carte__image {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        transition: transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .carte:hover .carte__image {
        transform: scale(1.06);
      }
      .carte--indisponible .carte__image {
        filter: grayscale(0.55) brightness(0.96);
      }
      .carte__categorie {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        background: rgb(255 255 255 / 0.88);
        backdrop-filter: blur(6px);
        color: #0e3b29;
        font-size: 0.72rem;
        font-weight: 750;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .carte__etat {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        box-shadow: var(--ombre-xs);
      }
      .carte__corps {
        display: grid;
        gap: 0.35rem;
        padding: 1rem 1.1rem 0.6rem;
        flex: 1;
        align-content: start;
      }
      .carte__nom {
        margin: 0;
        font-size: 1.06rem;
        font-weight: 750;
        color: var(--titre);
        letter-spacing: -0.01em;
      }
      .carte__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem 0.75rem;
        margin: 0;
        font-size: 0.84rem;
        color: var(--texte-doux);
      }
      .carte__lieu {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
      }
      .carte__lieu app-icone {
        color: var(--orange);
      }
      .carte__stock {
        font-variant-numeric: tabular-nums;
      }
      .carte__stock--vide {
        color: var(--rouge);
        font-weight: 600;
      }
      .carte__prix {
        margin: 0.35rem 0 0;
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--vert);
        letter-spacing: -0.01em;
        font-variant-numeric: tabular-nums;
      }
      .carte__unite {
        font-size: 0.86rem;
        font-weight: 550;
        color: var(--texte-tres-doux);
      }
      .carte__pied {
        padding: 0.4rem 1.1rem 1.1rem;
      }
    `,
  ],
})
export class ProduitCarteComponent {
  readonly produit = input.required<Produit>();
  /** Relaye la demande d'ajout au panier vers le parent. */
  readonly ajouter = output<void>();

  private readonly imageSecours = IMAGE_SECOURS;
  private readonly secoursAffiche = signal(false);

  get chemin(): string {
    return cheminProduit(this.produit().id);
  }

  get libelleCategorie(): string {
    return LIBELLES_CATEGORIE[this.produit().categorie];
  }

  get libelleUnite(): string {
    return LIBELLES_UNITE[this.produit().unite];
  }

  get epuise(): boolean {
    return this.produit().quantiteDisponible <= 0;
  }

  /** Image du produit, ou image générique de secours si l'URL est absente ou invalide. */
  imageAffichee(): string {
    if (this.secoursAffiche()) {
      return this.imageSecours;
    }
    return this.produit().imageUrl || this.imageSecours;
  }

  basculerSurSecours(): void {
    this.secoursAffiche.set(true);
  }
}
