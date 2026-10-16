import { Component, computed, inject, signal } from '@angular/core';
import {
  Commande,
  LIBELLES_STATUT_LIVRAISON,
  Livraison,
  STATUTS_LIVRAISON,
  StatutLivraison,
  Utilisateur,
} from '../../core/models';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { OrderService } from '../../core/services/order.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';

/**
 * Supervision et attribution des livraisons (tasks 8.2 et 8.7), réservée à
 * l'administrateur : création sur commande éligible, attribution d'un livreur
 * actif et liste filtrable par statut.
 */
@Component({
  selector: 'app-supervision-livraisons',
  imports: [EtatVideComponent],
  templateUrl: './supervision-livraisons.component.html',
  styleUrl: './supervision-livraisons.component.css',
})
export class SupervisionLivraisonsComponent {
  readonly libellesStatut = LIBELLES_STATUT_LIVRAISON;
  readonly statuts = STATUTS_LIVRAISON;

  private readonly delivery = inject(DeliveryService);
  private readonly order = inject(OrderService);
  private readonly persistence = inject(PersistenceService);
  private readonly notifications = inject(NotificationsService);

  readonly filtreStatut = signal<StatutLivraison | 'TOUS'>('TOUS');

  readonly eligibles = computed<readonly Commande[]>(() => this.delivery.commandesEligibles());
  readonly livreurs = computed<readonly Utilisateur[]>(() => this.delivery.livreursDisponibles());

  readonly livraisons = computed<readonly Livraison[]>(() =>
    this.delivery
      .livraisons()
      .slice()
      .sort((gauche, droite) => droite.dateCreation.localeCompare(gauche.dateCreation)),
  );

  readonly filtrees = computed(() => {
    const filtre = this.filtreStatut();
    return filtre === 'TOUS'
      ? this.livraisons()
      : this.livraisons().filter((livraison) => livraison.statut === filtre);
  });

  readonly enAttente = computed(() =>
    this.livraisons().filter((livraison) => livraison.statut === 'EN_ATTENTE'),
  );

  majFiltre(evenement: Event): void {
    this.filtreStatut.set(
      (evenement.target as HTMLSelectElement).value as StatutLivraison | 'TOUS',
    );
  }

  referenceCommande(commandeId: string): string {
    return this.order.trouver(commandeId)?.reference ?? '—';
  }

  nomLivreur(livreurId: string | null): string {
    if (!livreurId) {
      return 'Non attribué';
    }
    return this.persistence.etat().users.find((u) => u.id === livreurId)?.nom ?? 'Livreur inconnu';
  }

  dateHeure(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }

  creer(commande: Commande): void {
    this.notifications.informer(this.delivery.creer(commande.id).message);
  }

  attribuer(livraison: Livraison, livreurId: string): void {
    this.notifications.informer(this.delivery.affecter(livraison.id, livreurId).message);
  }
}
