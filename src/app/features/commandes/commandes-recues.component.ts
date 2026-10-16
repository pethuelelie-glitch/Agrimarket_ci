import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Commande,
  LIBELLES_STATUT_COMMANDE,
  STATUTS_COMMANDE,
  StatutCommande,
} from '../../core/models';
import { cheminCommande } from '../../core/navigation';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { OrderService } from '../../core/services/order.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/**
 * Commandes reçues par le producteur (task 7.8) : liste filtrée par statut et
 * **actions de transition autorisées** (confirmation, refus, préparation,
 * prête). Les transitions interdites ne sont pas proposées.
 */
@Component({
  selector: 'app-commandes-recues',
  imports: [RouterLink, EtatVideComponent, MontantFcfaPipe],
  templateUrl: './commandes-recues.component.html',
  styleUrl: './commandes-recues.component.css',
})
export class CommandesRecuesComponent {
  readonly libellesStatut = LIBELLES_STATUT_COMMANDE;
  readonly statuts = STATUTS_COMMANDE;
  readonly cheminCommande = cheminCommande;

  private readonly order = inject(OrderService);
  private readonly persistence = inject(PersistenceService);
  private readonly notifications = inject(NotificationsService);

  readonly filtreStatut = signal<StatutCommande | 'TOUS'>('TOUS');

  /** Commandes reçues par le producteur connecté, les plus récentes d'abord. */
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

  nomAcheteur(commande: Commande): string {
    return (
      this.persistence.etat().users.find((u) => u.id === commande.acheteurId)?.nom ?? 'Acheteur inconnu'
    );
  }

  dateCourte(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }

  /** Transitions de progression proposées au producteur (hors annulation). */
  progressions(commande: Commande): readonly StatutCommande[] {
    return this.order.actionsPossibles(commande).filter((cible) => cible !== 'ANNULEE');
  }

  peutRefuser(commande: Commande): boolean {
    return this.order.actionsPossibles(commande).includes('ANNULEE');
  }

  avancer(commande: Commande, cible: StatutCommande): void {
    this.notifications.informer(this.order.avancer(commande.id, cible).message);
  }

  refuser(commande: Commande): void {
    this.notifications.informer(this.order.annuler(commande.id).message);
  }
}
