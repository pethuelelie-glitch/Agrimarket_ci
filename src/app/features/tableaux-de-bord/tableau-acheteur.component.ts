import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EnteteTableauComponent } from '../../shared/entete-tableau.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';

/** Tableau de bord acheteur (task 9.5), limité à ses propres commandes. */
@Component({
  selector: 'app-tableau-acheteur',
  imports: [RouterLink, CarteIndicateurComponent, EnteteTableauComponent, EtatVideComponent],
  template: `
    <section class="tdb apparition">
      <app-entete-tableau titre="Mes achats" />

      @if (estVide()) {
        <app-etat-vide
          titre="Aucun achat"
          message="Vous n’avez pas encore de commande. Parcourez le catalogue pour commencer vos achats."
          libelleBouton="Parcourir le catalogue"
          [lienBouton]="chemins.catalogue"
        />
      }

      <div class="grille">
        <app-carte-indicateur
          libelle="Commandes en cours"
          icone="horloge"
          ton="orange"
          [valeur]="indicateurs().commandesEnCours"
        />
        <app-carte-indicateur
          libelle="Commandes livrées"
          icone="coche"
          ton="vert"
          [valeur]="indicateurs().commandesLivrees"
        />
        <app-carte-indicateur
          libelle="Commandes au total"
          icone="colis"
          ton="bleu"
          [valeur]="indicateurs().commandesTotal"
        />
      </div>

      <section class="panneau tableau__acces">
        <h2>Historique des achats</h2>
        <p>Retrouvez le détail et le suivi de chacune de vos commandes.</p>
        <a class="bouton" [routerLink]="chemins.commandes">Historique des achats</a>
      </section>
    </section>
  `,
  styles: [
    `
      .tdb {
        display: grid;
        gap: clamp(1.25rem, 2.5vw, 1.75rem);
      }
      .grille {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 10.5rem), 1fr));
      }
      .tableau__acces {
        display: grid;
        gap: 0.6rem;
        justify-items: start;
      }
      .tableau__acces h2 {
        margin: 0;
        font-size: 1.15rem;
        color: var(--vert-fonce);
      }
      .tableau__acces p {
        margin: 0;
        color: var(--texte-doux);
      }
    `,
  ],
})
export class TableauAcheteurComponent {
  readonly chemins = CHEMINS;

  private readonly dashboard = inject(DashboardService);

  readonly indicateurs = this.dashboard.indicateursAcheteur;

  readonly estVide = computed(() => this.indicateurs().commandesTotal === 0);
}
