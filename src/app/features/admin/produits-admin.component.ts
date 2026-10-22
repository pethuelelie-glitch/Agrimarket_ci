import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LIBELLES_UNITE, Produit, Utilisateur } from '../../core/models';
import { AdminService } from '../../core/services/admin.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/**
 * Modération des produits (tasks 10.5, 10.8).
 * L'administrateur consulte tous les produits, les désactive avec un motif ou
 * les supprime avec confirmation. Prix, unité et stock restent en lecture seule.
 */
@Component({
  selector: 'app-produits-admin',
  imports: [FormsModule, MontantFcfaPipe],
  template: `
    <section class="admin-page">
      <h1>Produits</h1>

      @if (message()) {
        <p class="message" role="status">{{ message() }}</p>
      }

      @if (produits().length === 0) {
        <p class="vide" role="status">Aucun produit sur la plateforme.</p>
      } @else {
        <div class="tableau-conteneur panneau">
          <table class="liste">
            <caption class="sr-only">
              Tous les produits
            </caption>
            <thead>
              <tr>
                <th scope="col">Produit</th>
                <th scope="col">Producteur</th>
                <th scope="col">Prix</th>
                <th scope="col">Unité</th>
                <th scope="col">Stock</th>
                <th scope="col">Statut</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (produit of produits(); track produit.id) {
                <tr [class.inactif]="!produit.actif">
                  <td>{{ produit.nom }}</td>
                  <td>{{ nomProducteur(produit.producteurId) }}</td>
                  <!-- Prix, unité et stock : lecture seule pour l'administrateur. -->
                  <td>{{ produit.prix | montantFcfa }}</td>
                  <td>{{ libelleUnite(produit) }}</td>
                  <td>{{ produit.quantiteDisponible }}</td>
                  <td>
                    <span
                      class="badge-statut"
                      [attr.data-statut]="produit.actif ? 'LIVREE' : 'ANNULEE'"
                    >
                      {{ produit.actif ? 'Actif' : 'Inactif' }}
                    </span>
                    @if (produit.moderation; as moderation) {
                      <span class="motif" [title]="moderation.motif"
                        >motif : {{ moderation.motif }}</span
                      >
                    }
                  </td>
                  <td class="actions-cellule">
                    @if (produit.actif) {
                      <button type="button" class="secondaire" (click)="ouvrirModeration(produit)">
                        Désactiver
                      </button>
                    }
                    <button type="button" class="danger" (click)="demanderSuppression(produit)">
                      Supprimer
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (produitAModerer(); as produit) {
        <section class="panneau confirmation" aria-label="Désactivation d’un produit">
          <h2>Désactiver « {{ produit.nom }} »</h2>
          <label for="motif">Motif de la modération (obligatoire)</label>
          <input
            id="motif"
            type="text"
            name="motif"
            [ngModel]="motif()"
            (ngModelChange)="motif.set($event)"
          />
          @if (erreurMotif()) {
            <p class="erreur-champ" role="alert">Indiquez le motif de la désactivation.</p>
          }
          <div class="actions">
            <button type="button" (click)="confirmerModeration(produit)">
              Confirmer la désactivation
            </button>
            <button type="button" class="secondaire" (click)="annuler()">Annuler</button>
          </div>
        </section>
      }

      @if (produitASupprimer(); as produit) {
        <section class="panneau confirmation" aria-label="Confirmation de suppression">
          <h2>Supprimer « {{ produit.nom }} » ?</h2>
          <p>Cette action est définitive.</p>
          <div class="actions">
            <button type="button" class="danger" (click)="confirmerSuppression(produit)">
              Oui, supprimer
            </button>
            <button type="button" class="secondaire" (click)="annuler()">Annuler</button>
          </div>
        </section>
      }
    </section>
  `,
  styles: [
    `
      .admin-page {
        display: grid;
        gap: 1rem;
      }
      .inactif {
        background: var(--rouge-fond);
      }
      .motif {
        display: block;
        color: var(--texte-doux);
        font-size: 0.8rem;
      }
      .actions-cellule {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .confirmation {
        display: grid;
        gap: 0.6rem;
        max-width: 32rem;
      }
      .confirmation h2 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--vert-fonce);
      }
      label {
        font-weight: 600;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .message {
        margin: 0;
        color: var(--vert-fonce);
        font-weight: 600;
      }
      .vide {
        margin: 0;
        color: var(--texte-doux);
      }
    `,
  ],
})
export class ProduitsAdminComponent {
  private readonly admin = inject(AdminService);
  private readonly catalogue = inject(CatalogueService);

  readonly produits = this.admin.produits;
  readonly message = signal<string | null>(null);
  readonly motif = signal('');
  readonly produitAModererId = signal<string | null>(null);
  readonly produitASupprimerId = signal<string | null>(null);
  readonly erreurMotif = signal(false);

  readonly produitAModerer = computed(() => this.trouver(this.produitAModererId()));
  readonly produitASupprimer = computed(() => this.trouver(this.produitASupprimerId()));

  private readonly producteursParId = computed<Map<string, Utilisateur>>(
    () => new Map(this.admin.producteurs().map((producteur) => [producteur.id, producteur])),
  );

  nomProducteur(producteurId: string): string {
    return this.producteursParId().get(producteurId)?.nom ?? '—';
  }

  libelleUnite(produit: Produit): string {
    return LIBELLES_UNITE[produit.unite];
  }

  private trouver(produitId: string | null): Produit | null {
    if (!produitId) {
      return null;
    }
    return this.produits().find((produit) => produit.id === produitId) ?? null;
  }

  ouvrirModeration(produit: Produit): void {
    this.produitASupprimerId.set(null);
    this.produitAModererId.set(produit.id);
    this.motif.set('');
    this.erreurMotif.set(false);
    this.message.set(null);
  }

  demanderSuppression(produit: Produit): void {
    this.produitAModererId.set(null);
    this.produitASupprimerId.set(produit.id);
    this.message.set(null);
  }

  annuler(): void {
    this.produitAModererId.set(null);
    this.produitASupprimerId.set(null);
    this.erreurMotif.set(false);
  }

  confirmerModeration(produit: Produit): void {
    const resultat = this.catalogue.moderer(produit.id, this.motif());
    this.erreurMotif.set(!resultat.succes && Boolean(resultat.erreursChamps['motif']));
    if (resultat.succes) {
      this.message.set(resultat.message);
      this.annuler();
    }
  }

  confirmerSuppression(produit: Produit): void {
    const resultat = this.catalogue.supprimer(produit.id);
    this.message.set(resultat.message);
    if (resultat.succes) {
      this.annuler();
    }
  }
}
