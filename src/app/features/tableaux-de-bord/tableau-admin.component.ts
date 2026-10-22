import { Component, computed, inject } from '@angular/core';
import { LIBELLES_STATUT_COMMANDE, STATUTS_COMMANDE } from '../../core/models';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EnteteTableauComponent } from '../../shared/entete-tableau.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import {
  ElementBarre,
  RepartitionBarresComponent,
} from '../../shared/repartition-barres.component';

/** Tableau de bord administrateur (task 9.5). */
@Component({
  selector: 'app-tableau-admin',
  imports: [
    CarteIndicateurComponent,
    EnteteTableauComponent,
    EtatVideComponent,
    RepartitionBarresComponent,
  ],
  template: `
    <section class="tdb apparition">
      <app-entete-tableau titre="Administration du marché" />

      @if (estVide()) {
        <app-etat-vide
          titre="Aucune donnée"
          message="Aucun utilisateur, produit ou commande n’est enregistré pour le moment."
          libelleBouton="Voir le catalogue"
          [lienBouton]="chemins.catalogue"
        />
      }

      <div class="grille">
        <app-carte-indicateur
          libelle="Utilisateurs"
          icone="utilisateurs"
          ton="vert"
          [valeur]="indicateurs().utilisateurs"
        />
        <app-carte-indicateur
          libelle="Producteurs"
          icone="pousse"
          ton="orange"
          [valeur]="indicateurs().producteurs"
        />
        <app-carte-indicateur
          libelle="Produits actifs"
          icone="boutique"
          ton="sarcelle"
          [valeur]="indicateurs().produitsActifs"
        />
        <app-carte-indicateur
          libelle="Commandes"
          icone="colis"
          ton="bleu"
          [valeur]="indicateurs().commandesTotal"
        />
        <app-carte-indicateur
          libelle="Livraisons en cours"
          icone="camion"
          ton="violet"
          [valeur]="indicateurs().livraisonsEnCours"
        />
        <app-carte-indicateur
          libelle="Livraisons terminées"
          icone="coche"
          ton="vert"
          [valeur]="indicateurs().livraisonsTerminees"
        />
      </div>

      <div class="graphiques">
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
            mode="colonnes"
            messageVide="Aucune commande sur la période."
          />
        </section>
      </div>
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
      .graphiques {
        display: grid;
        gap: clamp(1.25rem, 2.5vw, 1.75rem);
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
        align-items: start;
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
      statut,
    })),
  );

  readonly evolution = computed<readonly ElementBarre[]>(() =>
    this.indicateurs().evolution.map((point) => ({ libelle: point.libelle, valeur: point.nombre })),
  );
}
