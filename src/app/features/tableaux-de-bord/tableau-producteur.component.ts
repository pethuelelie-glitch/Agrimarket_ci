import { Component, computed, inject } from '@angular/core';
import { CHEMINS } from '../../core/navigation';
import { DashboardService } from '../../core/services/dashboard.service';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';
import { CarteIndicateurComponent } from '../../shared/carte-indicateur.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';

/** Tableau de bord producteur (task 9.5), limité à son propre périmètre. */
@Component({
  selector: 'app-tableau-producteur',
  imports: [CarteIndicateurComponent, EtatVideComponent, MontantFcfaPipe],
  template: `
    <section class="tableau">
      <h1>Tableau de bord — producteur</h1>

      @if (estVide()) {
        <app-etat-vide
          titre="Aucune activité"
          message="Vous n’avez encore aucun produit actif ni commande reçue. Créez un premier produit pour commencer."
          libelleBouton="Créer un produit"
          [lienBouton]="chemins.produitsProducteur"
        />
      }

      <div class="grille">
        <app-carte-indicateur libelle="Produits actifs" [valeur]="indicateurs().produitsActifs" />
        <app-carte-indicateur
          libelle="Stock disponible"
          [valeur]="indicateurs().stockDisponible"
        />
        <app-carte-indicateur libelle="Commandes reçues" [valeur]="indicateurs().commandesRecues" />
        <app-carte-indicateur libelle="Quantités vendues" [valeur]="indicateurs().quantitesVendues" />
        <app-carte-indicateur
          libelle="Montant des ventes (hors annulées)"
          [valeur]="indicateurs().montantVentes | montantFcfa"
        />
      </div>
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
export class TableauProducteurComponent {
  readonly chemins = CHEMINS;

  private readonly dashboard = inject(DashboardService);

  readonly indicateurs = this.dashboard.indicateursProducteur;

  readonly estVide = computed(
    () => this.indicateurs().produitsActifs === 0 && this.indicateurs().commandesRecues === 0,
  );
}
