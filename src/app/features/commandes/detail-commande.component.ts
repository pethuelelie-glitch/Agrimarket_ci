import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Commande,
  EvenementCommande,
  LIBELLES_STATUT_COMMANDE,
  LIBELLES_UNITE,
  StatutCommande,
} from '../../core/models';
import { CHEMINS, cheminProduit } from '../../core/navigation';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { OrderService } from '../../core/services/order.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';
import { SuiviLivraisonComponent } from '../livraisons/suivi-livraison.component';

/**
 * Détail d'une commande (task 7.8) : informations complètes, historique horodaté
 * et **actions de transition autorisées** pour l'utilisateur courant. Les
 * actions interdites ne sont jamais affichées ; l'accès au détail est refusé aux
 * tiers (task 7.7).
 */
@Component({
  selector: 'app-detail-commande',
  imports: [RouterLink, EtatVideComponent, MontantFcfaPipe, SuiviLivraisonComponent],
  templateUrl: './detail-commande.component.html',
  styleUrl: './detail-commande.component.css',
})
export class DetailCommandeComponent {
  /** Paramètre de route `:id` (via `withComponentInputBinding`). */
  readonly id = input.required<string>();

  readonly libellesStatut = LIBELLES_STATUT_COMMANDE;
  readonly libellesUnite = LIBELLES_UNITE;
  readonly chemins = CHEMINS;
  readonly cheminProduit = cheminProduit;

  private readonly order = inject(OrderService);
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);

  readonly commande = computed<Commande | null>(() => this.order.trouver(this.id()));

  /** Le détail est-il accessible à l'utilisateur courant ? */
  readonly accessible = computed(() => {
    const commande = this.commande();
    return commande !== null && this.order.peutVoir(commande);
  });

  /** Transitions de progression ouvertes (hors annulation). */
  readonly progressions = computed<readonly StatutCommande[]>(() => {
    const commande = this.commande();
    if (!commande || !this.accessible()) {
      return [];
    }
    return this.order.actionsPossibles(commande).filter((cible) => cible !== 'ANNULEE');
  });

  /** L'utilisateur courant peut-il annuler cette commande ? */
  readonly peutAnnuler = computed(() => {
    const commande = this.commande();
    return !!commande && this.accessible() && this.order.actionsPossibles(commande).includes('ANNULEE');
  });

  /** L'acheteur propriétaire peut-il encore modifier l'adresse (task 7.6) ? */
  readonly peutModifierAdresse = computed(() => {
    const commande = this.commande();
    const utilisateur = this.auth.utilisateurCourant();
    return (
      !!commande &&
      !!utilisateur &&
      utilisateur.role === 'ACHETEUR' &&
      utilisateur.id === commande.acheteurId &&
      (commande.statut === 'EN_ATTENTE' || commande.statut === 'CONFIRMEE')
    );
  });

  nomUtilisateur(id: string): string {
    return this.persistence.etat().users.find((utilisateur) => utilisateur.id === id)?.nom ?? 'Inconnu';
  }

  dateHeure(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }

  libelleEvenement(evenement: EvenementCommande): string {
    return this.libellesStatut[evenement.statut];
  }

  avancer(cible: StatutCommande): void {
    const resultat = this.order.avancer(this.id(), cible);
    this.notifications.informer(resultat.message);
  }

  annuler(): void {
    const resultat = this.order.annuler(this.id());
    this.notifications.informer(resultat.message);
  }

  enregistrerAdresse(adresse: string): void {
    const resultat = this.order.modifierAdresse(this.id(), adresse);
    this.notifications.informer(resultat.message);
  }
}
