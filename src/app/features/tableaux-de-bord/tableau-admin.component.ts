import { Component, computed, inject } from '@angular/core';
import { LIBELLES_STATUT_COMMANDE, STATUTS_COMMANDE } from '../../core/models';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { ElementBarre, RepartitionBarresComponent } from '../../shared/repartition-barres.component';

/** Tableau de bord administrateur (task 9.5). */
@Component({
  selector: 'app-tableau-admin',
  imports: [CarteIndicateurComponent, EtatVideComponent, RepartitionBarresComponent],
  template: `
    <section class="tableau">
      <h1>Tableau de bord — administrateur</h1>

      @if (estVide()) {
        <app-etat-vide
          titre="Aucune donnée"
          message="Aucun utilisateur, produit ou commande n’est enregistré pour le moment."
          libelleBouton="Voir le catalogue"
          [lienBouton]="chemins.catalogue"
        />
      }

      <div class="grille">
        <app-carte-indicateur libelle="Utilisateurs" [valeur]="indicateurs().utilisateurs" />
        <app-carte-indicateur libelle="Producteurs" [valeur]="indicateurs().producteurs" />
        <app-carte-indicateur libelle="Produits actifs" [valeur]="indicateurs().produitsActifs" />
        <app-carte-indicateur libelle="Commandes" [valeur]="indicateurs().commandesTotal" />
        <app-carte-indicateur
          libelle="Livraisons en cours"
          [valeur]="indicateurs().livraisonsEnCours"
        />
        <app-carte-indicateur
          libelle="Livraisons terminées"
          [valeur]="indicateurs().livraisonsTerminees"
        />
      </div>

      <section class="panneau">
        <app-repartition-barres
          titre="Commandes par statut"
          [elements]="repartitionStatuts()"
          messageVide="Aucune commande enregistrée."
        />
      </section>

      <section class="panneau">
        <app-repartition-barres
          titre="Évolution des commandes (14 derniers jours)"
          [elements]="evolution()"
          messageVide="Aucune commande sur la période."
        />
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
    `,
  ],
})
export class TableauAdminComponent {
  readonly chemins = CHEMINS;

  private readonly dashboard = inject(DashboardService);

  readonly indicateurs = this.dashboard.indicateursAdmin;

  readonly estVide = computed(
    () => this.indicateurs().utilisateurs === 0 && this.indicateurs().commandesTotal === 0,
  );

  readonly repartitionStatuts = computed<readonly ElementBarre[]>(() =>
    STATUTS_COMMANDE.map((statut) => ({
      libelle: LIBELLES_STATUT_COMMANDE[statut],
      valeur: this.indicateurs().commandesParStatut[statut],
    })),
  );

  readonly evolution = computed<readonly ElementBarre[]>(() =>
    this.indicateurs().evolution.map((point) => ({ libelle: point.libelle, valeur: point.nombre })),
  );
}
