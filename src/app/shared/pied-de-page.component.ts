import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES, LIBELLES_CATEGORIE } from '../core/models';
import { CHEMINS } from '../core/navigation';
import { IconeComponent } from './icone.component';
import { LogoComponent } from './logo.component';

/**
 * Pied de page de l'application (task 3.4).
 * Rappelle que la démonstration est sans backend et que le contrôle d'accès est
 * une protection d'interface, non une sécurité de production.
 */
@Component({
  selector: 'app-pied-de-page',
  imports: [RouterLink, IconeComponent, LogoComponent],
  template: `
    <footer class="pied">
      <div class="pied__haut">
        <div class="pied__marque">
          <a class="pied__logo" [routerLink]="chemins.accueil">
            <app-logo [taille]="40" />
            <span>AgriMarket CI</span>
          </a>
          <p>
            Le marché agricole ivoirien en ligne : des producteurs locaux, des acheteurs, des
            livreurs — et des récoltes qui voyagent du champ à la table.
          </p>
        </div>

        <nav class="pied__colonne" aria-label="Explorer">
          <h2>Explorer</h2>
          <ul>
            <li><a [routerLink]="chemins.catalogue">Tout le catalogue</a></li>
            @for (categorie of categories; track categorie) {
              <li>
                <a [routerLink]="chemins.catalogue" [queryParams]="{ categorie }">{{
                  libelles[categorie]
                }}</a>
              </li>
            }
          </ul>
        </nav>

        <nav class="pied__colonne" aria-label="Votre espace">
          <h2>Votre espace</h2>
          <ul>
            <li><a [routerLink]="chemins.connexion">Connexion</a></li>
            <li><a [routerLink]="chemins.inscription">Créer un compte</a></li>
            <li><a [routerLink]="chemins.tableauDeBord">Mon tableau de bord</a></li>
            <li><a [routerLink]="chemins.aide">Aide et limites</a></li>
          </ul>
        </nav>

        <div class="pied__colonne pied__avertissement">
          <h2><app-icone nom="info" [taille]="16" /> Démonstration</h2>
          <p>
            <strong>AgriMarket CI</strong> — démonstration sans backend. Les données, le panier et
            la session sont conservés uniquement dans ce navigateur (stockage local) : aucune
            synchronisation entre appareils.
          </p>
          <p>
            Le contrôle d'accès est une protection d'interface côté client : un stockage local
            modifié manuellement peut tromper les gardes, et il ne remplace pas une vérification
            côté serveur. <a [routerLink]="chemins.aide">En savoir plus sur les limites</a>.
          </p>
          <p>Authentification locale simulée — n'utilisez pas de mot de passe réel.</p>
        </div>
      </div>

      <div class="pied__bas">
        <p>Projet pédagogique — L3 Génie Logiciel · Montants en francs CFA</p>
        <p class="pied__drapeau" aria-label="Côte d'Ivoire">
          <span></span><span></span><span></span>
          Fait en Côte d'Ivoire
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .pied {
        margin-top: auto;
        background: #0b2419;
        color: #b9cbbf;
        font-size: 0.9rem;
      }
      .pied__haut {
        display: grid;
        gap: 2rem 2.5rem;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
        max-width: var(--max);
        margin-inline: auto;
        padding: clamp(2.5rem, 5vw, 3.75rem) var(--gutter) 2rem;
      }
      .pied__marque {
        grid-column: span 1;
      }
      .pied__logo {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        color: #fff;
        font-family: var(--police-titre);
        font-size: 1.3rem;
        font-weight: 700;
        text-decoration: none;
        margin-bottom: 0.9rem;
      }
      .pied p {
        margin: 0 0 0.6rem;
        line-height: 1.6;
      }
      .pied h2 {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0 0 0.85rem;
        font-family: var(--police);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #f2a65a;
      }
      .pied ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.45rem;
      }
      .pied a {
        color: #e3eee6;
        text-decoration: none;
        transition: color var(--transition);
      }
      .pied a:hover {
        color: #f2a65a;
        text-decoration: underline;
      }
      .pied__avertissement p {
        font-size: 0.84rem;
      }
      .pied__avertissement strong {
        color: #fff;
      }
      .pied__bas {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.5rem;
        justify-content: space-between;
        align-items: center;
        max-width: var(--max);
        margin-inline: auto;
        padding: 1.1rem var(--gutter) 1.5rem;
        border-top: 1px solid rgb(255 255 255 / 0.08);
        font-size: 0.8rem;
        color: #8ea596;
      }
      .pied__bas p {
        margin: 0;
      }
      .pied__drapeau {
        display: inline-flex;
        align-items: center;
        gap: 0;
      }
      .pied__drapeau span {
        width: 0.5rem;
        height: 0.8rem;
      }
      .pied__drapeau span:nth-child(1) {
        background: #f77f00;
        border-radius: 2px 0 0 2px;
      }
      .pied__drapeau span:nth-child(2) {
        background: #fff;
      }
      .pied__drapeau span:nth-child(3) {
        background: #009e60;
        border-radius: 0 2px 2px 0;
        margin-inline-end: 0.5rem;
      }
    `,
  ],
})
export class PiedDePageComponent {
  readonly chemins = CHEMINS;
  readonly categories = CATEGORIES;
  readonly libelles = LIBELLES_CATEGORIE;
}
