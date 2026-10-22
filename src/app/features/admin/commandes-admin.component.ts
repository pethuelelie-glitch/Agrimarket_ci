import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Commande,
  LIBELLES_STATUT_COMMANDE,
  STATUTS_COMMANDE,
  StatutCommande,
  Utilisateur,
} from '../../core/models';
import { cheminCommande } from '../../core/navigation';
import { AdminService } from '../../core/services/admin.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { OrderService } from '../../core/services/order.service';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/**
 * Supervision des commandes (tasks 10.6, 10.8).
 * Filtres par statut et producteur, détail en lecture seule (les articles et
 * montants ne sont pas modifiables) et annulation selon les règles d'annulation.
 */
@Component({
  selector: 'app-commandes-admin',
  imports: [FormsModule, RouterLink, MontantFcfaPipe],
  template: `
    <section class="admin-page">
      <h1>Commandes</h1>

      <div class="filtres">
        <div class="champ">
          <label for="filtre-statut">Statut</label>
          <select
            id="filtre-statut"
            [ngModel]="filtreStatut()"
            (ngModelChange)="filtreStatut.set($event)"
            name="filtreStatut"
          >
            <option value="">Tous les statuts</option>
            @for (statut of statuts; track statut) {
              <option [value]="statut">{{ libelleStatut(statut) }}</option>
            }
          </select>
        </div>
        <div class="champ">
          <label for="filtre-producteur">Producteur</label>
          <select
            id="filtre-producteur"
            [ngModel]="filtreProducteur()"
            (ngModelChange)="filtreProducteur.set($event)"
            name="filtreProducteur"
          >
            <option value="">Tous les producteurs</option>
            @for (producteur of producteurs(); track producteur.id) {
              <option [value]="producteur.id">{{ producteur.nom }}</option>
            }
          </select>
        </div>
      </div>

      @if (message()) {
        <p class="message" role="status">{{ message() }}</p>
      }

      @if (commandesFiltrees().length === 0) {
        <p class="vide" role="status">Aucune commande ne correspond à ces filtres.</p>
      } @else {
        <div class="tableau-conteneur panneau">
          <table class="liste">
            <caption class="sr-only">
              Toutes les commandes
            </caption>
            <thead>
              <tr>
                <th scope="col">Référence</th>
                <th scope="col">Acheteur</th>
                <th scope="col">Producteur</th>
                <th scope="col">Total</th>
                <th scope="col">Statut</th>
                <th scope="col">Livraison</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (commande of commandesFiltrees(); track commande.id) {
                <tr>
                  <td>
                    <a [routerLink]="chemin(commande)">{{ commande.reference }}</a>
                  </td>
                  <td>{{ nomUtilisateur(commande.acheteurId) }}</td>
                  <td>{{ nomUtilisateur(commande.producteurId) }}</td>
                  <td>{{ commande.montantTotal | montantFcfa }}</td>
                  <td>
                    <span class="badge-statut" [attr.data-statut]="commande.statut">
                      {{ libelleStatut(commande.statut) }}
                    </span>
                  </td>
                  <td>{{ statutLivraison(commande) }}</td>
                  <td>
                    @if (annulable(commande)) {
                      <button type="button" class="danger" (click)="annuler(commande)">
                        Annuler
                      </button>
                    } @else {
                      <span class="texte-doux">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .admin-page {
        display: grid;
        gap: 1rem;
      }
      .filtres {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .champ {
        display: grid;
        gap: 0.25rem;
      }
      label {
        font-weight: 600;
      }
      .message {
        margin: 0;
        color: var(--vert-fonce);
        font-weight: 600;
      }
      .vide,
      .texte-doux {
        margin: 0;
        color: var(--texte-doux);
      }
    `,
  ],
})
export class CommandesAdminComponent {
  private readonly admin = inject(AdminService);
  private readonly orders = inject(OrderService);
  private readonly delivery = inject(DeliveryService);

  readonly statuts = STATUTS_COMMANDE;
  readonly producteurs = this.admin.producteurs;
  readonly filtreStatut = signal<StatutCommande | ''>('');
  readonly filtreProducteur = signal<string>('');
  readonly message = signal<string | null>(null);

  private readonly utilisateursParId = computed<Map<string, Utilisateur>>(
    () => new Map(this.admin.utilisateurs().map((utilisateur) => [utilisateur.id, utilisateur])),
  );

  /** Commandes filtrées puis triées de la plus récente à la plus ancienne. */
  readonly commandesFiltrees = computed<readonly Commande[]>(() =>
    this.admin
      .filtrerCommandes({
        statut: this.filtreStatut(),
        producteurId: this.filtreProducteur(),
      })
      .slice()
      .sort((gauche, droite) => droite.dateCreation.localeCompare(gauche.dateCreation)),
  );

  libelleStatut(statut: StatutCommande): string {
    return LIBELLES_STATUT_COMMANDE[statut];
  }

  nomUtilisateur(utilisateurId: string): string {
    return this.utilisateursParId().get(utilisateurId)?.nom ?? '—';
  }

  chemin(commande: Commande): string {
    return cheminCommande(commande.id);
  }

  /** Statut de la livraison active (ou la plus récente) de la commande. */
  statutLivraison(commande: Commande): string {
    const livraisons = this.delivery.pourCommande(commande.id);
    if (livraisons.length === 0) {
      return 'Aucune';
    }
    const derniere = livraisons[livraisons.length - 1];
    return derniere.statut;
  }

  /** L'administrateur peut-il annuler cette commande ? */
  annulable(commande: Commande): boolean {
    return this.orders.actionsPossibles(commande).includes('ANNULEE');
  }

  annuler(commande: Commande): void {
    const resultat = this.orders.annuler(commande.id);
    this.message.set(resultat.message);
  }
}
