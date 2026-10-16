import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Commande, LIBELLES_STATUT_COMMANDE, STATUTS_COMMANDE, StatutCommande } from '../../core/models';
import { cheminCommande } from '../../core/navigation';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { OrderService } from '../../core/services/order.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/**
 * Historique des commandes de l'acheteur (task 7.8) : tri antéchronologique,
 * filtre par statut et état vide « aucune commande ».
 */
@Component({
  selector: 'app-mes-commandes',
  imports: [RouterLink, EtatVideComponent, MontantFcfaPipe],
  templateUrl: './mes-commandes.component.html',
  styleUrl: './mes-commandes.component.css',
})
export class MesCommandesComponent {
  readonly libellesStatut = LIBELLES_STATUT_COMMANDE;
  readonly statuts = STATUTS_COMMANDE;
  readonly cheminCommande = cheminCommande;

  private readonly order = inject(OrderService);
  private readonly persistence = inject(PersistenceService);

  readonly filtreStatut = signal<StatutCommande | 'TOUS'>('TOUS');

  /** Toutes les commandes visibles par l'acheteur, de la plus récente à la plus ancienne. */
  readonly commandes = computed<readonly Commande[]>(() => this.order.mesCommandes());

  readonly filtrees = computed(() => {
    const filtre = this.filtreStatut();
    return filtre === 'TOUS'
      ? this.commandes()
      : this.commandes().filter((commande) => commande.statut === filtre);
  });

  readonly estVide = computed(() => this.commandes().length === 0);

  majFiltre(evenement: Event): void {
    this.filtreStatut.set((evenement.target as HTMLSelectElement).value as StatutCommande | 'TOUS');
  }

  /** Nom du producteur concerné, ou identifiant de repli. */
  nomProducteur(commande: Commande): string {
    const producteur = this.persistence.etat().users.find((u) => u.id === commande.producteurId);
    return producteur?.nom ?? 'Producteur inconnu';
  }

  dateCourte(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }
}
