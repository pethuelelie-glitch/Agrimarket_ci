import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';

/** Tableau de bord acheteur (task 9.5), limité à ses propres commandes. */
@Component({
  selector: 'app-tableau-acheteur',
  imports: [RouterLink, CarteIndicateurComponent, EtatVideComponent],
  template: `
    <section class="tableau">
      <h1>Tableau de bord — acheteur</h1>

      @if (estVide()) {
        <app-etat-vide
          titre="Aucun achat"
          message="Vous n’avez pas encore de commande. Parcourez le catalogue pour commencer vos achats."
          libelleBouton="Parcourir le catalogue"
          [lienBouton]="chemins.catalogue"
        />
      }

      <div class="grille">
        <app-carte-indicateur libelle="Commandes en cours" [valeur]="indicateurs().commandesEnCours" />
        <app-carte-indicateur libelle="Commandes livrées" [valeur]="indicateurs().commandesLivrees" />
        <app-carte-indicateur libelle="Commandes au total" [valeur]="indicateurs().commandesTotal" />
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
      .tableau {
        display: grid;
        gap: 1.5rem;
      }
      .tableau h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--vert-fonce);
      }
      .tableau__acces {
        display: grid;
        gap: 0.5rem;
        justify-items: start;
      }
      .tableau__acces h2 {
        margin: 0;
        font-size: 1.05rem;
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
