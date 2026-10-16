import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';

/** Tableau de bord livreur (task 9.5), limité à ses livraisons attribuées. */
@Component({
  selector: 'app-tableau-livreur',
  imports: [RouterLink, CarteIndicateurComponent, EtatVideComponent],
  template: `
    <section class="tableau">
      <h1>Tableau de bord — livreur</h1>

      @if (estVide()) {
        <app-etat-vide
          titre="Aucune mission"
          message="Aucune livraison ne vous est encore attribuée. Vos missions apparaîtront ici dès qu’un administrateur vous en confiera une."
        />
      }

      <div class="grille">
        <app-carte-indicateur
          libelle="Missions attribuées"
          [valeur]="indicateurs().missionsAttribuees"
        />
        <app-carte-indicateur libelle="En cours" [valeur]="indicateurs().enCours" />
        <app-carte-indicateur libelle="Terminées" [valeur]="indicateurs().terminees" />
        <app-carte-indicateur libelle="En échec" [valeur]="indicateurs().enEchec" />
      </div>

      <section class="panneau tableau__acces">
        <h2>Mes missions</h2>
        <p>Consultez et faites évoluer vos livraisons attribuées.</p>
        <a class="bouton" [routerLink]="chemins.missionsLivreur">Voir mes missions</a>
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
export class TableauLivreurComponent {
  readonly chemins = CHEMINS;

  private readonly dashboard = inject(DashboardService);

  readonly indicateurs = this.dashboard.indicateursLivreur;

  readonly estVide = computed(() => this.indicateurs().missionsAttribuees === 0);
}
