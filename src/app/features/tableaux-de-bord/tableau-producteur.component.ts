import { Component, computed, inject } from '@angular/core';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EnteteTableauComponent } from '../../shared/entete-tableau.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';

/** Tableau de bord producteur (task 9.5), limité à son propre périmètre. */
@Component({
  selector: 'app-tableau-producteur',
  imports: [CarteIndicateurComponent, EnteteTableauComponent, EtatVideComponent, MontantFcfaPipe],
  template: `
    <section class="tdb apparition">
      <app-entete-tableau titre="Mon exploitation" />

      @if (estVide()) {
        <app-etat-vide
          titre="Aucune activité"
          message="Vous n’avez encore aucun produit actif ni commande reçue. Créez un premier produit pour commencer."
          libelleBouton="Créer un produit"
          [lienBouton]="chemins.produitsProducteur"
        />
      }

      <div class="grille">
        <app-carte-indicateur
          libelle="Produits actifs"
          icone="pousse"
          ton="vert"
          [valeur]="indicateurs().produitsActifs"
        />
        <app-carte-indicateur
          libelle="Stock disponible"
          icone="stock"
          ton="sarcelle"
          [valeur]="indicateurs().stockDisponible"
        />
        <app-carte-indicateur
          libelle="Commandes reçues"
          icone="colis"
          ton="bleu"
          [valeur]="indicateurs().commandesRecues"
        />
        <app-carte-indicateur
          libelle="Quantités vendues"
          icone="graphique"
          ton="violet"
          [valeur]="indicateurs().quantitesVendues"
        />
        <app-carte-indicateur
          libelle="Montant des ventes (hors annulées)"
          icone="porteMonnaie"
          ton="orange"
          [valeur]="indicateurs().montantVentes | montantFcfa"
        />
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
    `,
  ],
})
export class TableauProducteurComponent {
  readonly chemins = CHEMINS;

  private readonly dashboard = inject(DashboardService);

  readonly indicateurs = this.dashboard.indicateursProducteur;

  readonly estVide = computed(
    () => this.indicateurs().produitsActifs === 0 && this.indicateurs().commandesRecues === 0,
  );
}
