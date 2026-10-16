import { Component, computed, inject, signal } from '@angular/core';
import { LIBELLES_STATUT_LIVRAISON, Livraison, StatutLivraison } from '../../core/models';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';

interface GroupeMissions {
  readonly cle: string;
  readonly libelle: string;
  readonly missions: readonly Livraison[];
}

/**
 * Missions du livreur (task 8.7) : livraisons attribuées au livreur connecté,
 * groupées par statut, avec actions de progression autorisées et état vide.
 */
@Component({
  selector: 'app-missions-livreur',
  imports: [EtatVideComponent],
  templateUrl: './missions-livreur.component.html',
  styleUrl: './missions-livreur.component.css',
})
export class MissionsLivreurComponent {
  readonly libellesStatut = LIBELLES_STATUT_LIVRAISON;

  private readonly delivery = inject(DeliveryService);
  private readonly persistence = inject(PersistenceService);
  private readonly notifications = inject(NotificationsService);

  /** Mission pour laquelle le formulaire d'échec est ouvert. */
  readonly echecPour = signal<string | null>(null);

  readonly missions = computed<readonly Livraison[]>(() => this.delivery.mesMissions());

  readonly estVide = computed(() => this.missions().length === 0);

  readonly groupes = computed<readonly GroupeMissions[]>(() => {
    const missions = this.missions();
    return [
      {
        cle: 'A_PRENDRE',
        libelle: 'À prendre en charge',
        missions: missions.filter((m) => m.statut === 'ASSIGNEE'),
      },
      {
        cle: 'EN_COURS',
        libelle: 'En cours',
        missions: missions.filter((m) => m.statut === 'EN_COURS'),
      },
      {
        cle: 'TERMINEES',
        libelle: 'Terminées',
        missions: missions.filter((m) => m.statut === 'LIVREE'),
      },
      {
        cle: 'ECHECS',
        libelle: 'En échec',
        missions: missions.filter((m) => m.statut === 'ECHEC'),
      },
    ];
  });

  nomLivreur(): string {
    return (
      this.persistence.etat().users.find((u) => u.id === this.missions()[0]?.livreurId)?.nom ?? ''
    );
  }

  dateHeure(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }

  peutPrendreEnCharge(mission: Livraison): boolean {
    return mission.statut === 'ASSIGNEE';
  }

  peutLivrer(mission: Livraison): boolean {
    return mission.statut === 'EN_COURS';
  }

  peutEchouer(mission: Livraison): boolean {
    return mission.statut === 'ASSIGNEE' || mission.statut === 'EN_COURS';
  }

  prendreEnCharge(mission: Livraison): void {
    this.notifications.informer(this.delivery.changerStatut(mission.id, 'EN_COURS').message);
  }

  marquerLivree(mission: Livraison): void {
    this.notifications.informer(this.delivery.changerStatut(mission.id, 'LIVREE').message);
  }

  ouvrirEchec(mission: Livraison): void {
    this.echecPour.set(mission.id);
  }

  annulerEchec(): void {
    this.echecPour.set(null);
  }

  confirmerEchec(mission: Livraison, commentaire: string): void {
    const resultat = this.delivery.changerStatut(mission.id, 'ECHEC', commentaire);
    this.notifications.informer(resultat.message);
    if (resultat.succes) {
      this.echecPour.set(null);
    }
  }

  /** Statuts finaux, sans action possible. */
  estFinale(statut: StatutLivraison): boolean {
    return statut === 'LIVREE' || statut === 'ECHEC';
  }
}
