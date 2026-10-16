import { Injectable, Signal, computed, inject } from '@angular/core';
import { Commande, Livraison, StatutLivraison, Utilisateur } from '../models';
import {
  ActeurLivraison,
  ResultatLivraison,
  affecterLivreur,
  changerStatutLivraison,
  creerLivraison,
  livraisonActive,
} from '../livraisons/operations';
import { peutVoirCommande } from '../permissions/permissions';
import { PersistenceService } from '../persistence/persistence.service';
import { Resultat } from '../resultat';
import { AuthService } from './auth.service';

/**
 * Livraisons (Module G, tasks 8.1 à 8.6).
 *
 * Chaque écriture passe par `PersistenceService.transaction` : le changement de
 * statut d'une livraison et celui de sa commande sont **atomiques** (décision D6).
 */
@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);

  /** Toutes les livraisons enregistrées localement. */
  readonly livraisons: Signal<readonly Livraison[]> = computed(
    () => this.persistence.etat().deliveries,
  );

  /** Missions du livreur connecté (task 8.3). */
  readonly mesMissions: Signal<readonly Livraison[]> = computed(() => {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur || utilisateur.role !== 'LIVREUR') {
      return [];
    }
    return this.livraisons().filter((livraison) => livraison.livreurId === utilisateur.id);
  });

  /** Livreurs actifs pouvant recevoir une attribution (task 8.2). */
  readonly livreursDisponibles: Signal<readonly Utilisateur[]> = computed(() =>
    this.persistence
      .etat()
      .users.filter((utilisateur) => utilisateur.role === 'LIVREUR' && utilisateur.actif),
  );

  /** Commandes éligibles à la création d'une livraison sans livraison active. */
  readonly commandesEligibles: Signal<readonly Commande[]> = computed(() =>
    this.persistence
      .etat()
      .orders.filter(
        (commande) =>
          ['CONFIRMEE', 'EN_PREPARATION', 'PRETE'].includes(commande.statut) &&
          !livraisonActive(this.persistence.etat(), commande.id),
      ),
  );

  trouver(livraisonId: string): Livraison | null {
    return this.livraisons().find((livraison) => livraison.id === livraisonId) ?? null;
  }

  /** Livraisons d'une commande, de la plus récente à la plus ancienne. */
  pourCommande(commandeId: string): readonly Livraison[] {
    return this.livraisons()
      .filter((livraison) => livraison.commandeId === commandeId)
      .slice()
      .sort((gauche, droite) => droite.dateCreation.localeCompare(gauche.dateCreation));
  }

  /** Livraison active d'une commande (ni LIVREE ni ECHEC), ou null. */
  activePourCommande(commandeId: string): Livraison | null {
    return (
      this.livraisons().find(
        (livraison) =>
          livraison.commandeId === commandeId &&
          livraison.statut !== 'LIVREE' &&
          livraison.statut !== 'ECHEC',
      ) ?? null
    );
  }

  /** L'utilisateur courant peut-il suivre cette livraison (task 8.7) ? */
  peutVoir(livraison: Livraison): boolean {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur || !utilisateur.actif) {
      return false;
    }
    if (utilisateur.role === 'ADMIN') {
      return true;
    }
    if (utilisateur.role === 'LIVREUR') {
      return livraison.livreurId === utilisateur.id;
    }
    const commande = this.persistence
      .etat()
      .orders.find((candidat) => candidat.id === livraison.commandeId);
    return !!commande && peutVoirCommande(utilisateur, commande);
  }

  /* ------------------------------------------------------------------ écritures */

  creer(commandeId: string, maintenant: Date = new Date()): ResultatLivraison {
    const acteur = this.acteurCourant();
    if (!acteur) {
      return {
        succes: false,
        message: 'Vous devez être connecté.',
        erreursChamps: {},
        livraison: null,
      };
    }
    let resultat: ResultatLivraison = {
      succes: false,
      message: 'Création impossible.',
      erreursChamps: {},
      livraison: null,
    };
    this.persistence.transaction((brouillon) => {
      resultat = creerLivraison(brouillon, commandeId, acteur, maintenant);
    });
    return resultat;
  }

  affecter(livraisonId: string, livreurId: string, maintenant: Date = new Date()): Resultat {
    const acteur = this.acteurCourant();
    if (!acteur) {
      return this.refus('Vous devez être connecté.');
    }
    let resultat: Resultat = this.refus('Attribution impossible.');
    this.persistence.transaction((brouillon) => {
      resultat = affecterLivreur(brouillon, livraisonId, livreurId, acteur, maintenant);
    });
    return resultat;
  }

  changerStatut(
    livraisonId: string,
    cible: StatutLivraison,
    commentaire = '',
    maintenant: Date = new Date(),
  ): Resultat {
    const acteur = this.acteurCourant();
    if (!acteur) {
      return this.refus('Vous devez être connecté.');
    }
    let resultat: Resultat = this.refus('Mise à jour impossible.');
    this.persistence.transaction((brouillon) => {
      resultat = changerStatutLivraison(
        brouillon,
        livraisonId,
        cible,
        acteur,
        commentaire,
        maintenant,
      );
    });
    return resultat;
  }

  /* ------------------------------------------------------------------ interne */

  private acteurCourant(): ActeurLivraison | null {
    const utilisateur = this.auth.utilisateurCourant();
    return utilisateur ? { id: utilisateur.id, role: utilisateur.role } : null;
  }

  private refus(message: string): Resultat {
    return { succes: false, message, erreursChamps: {} };
  }
}
