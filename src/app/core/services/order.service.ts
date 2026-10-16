import { Injectable, Signal, computed, inject } from '@angular/core';
import { Commande, StatutCommande, Utilisateur } from '../models';
import { Acteur, ResultatCommandes, annulerCommande, avancerCommande, creerCommandesDepuisPanier, modifierAdresseCommande } from '../commandes/operations';
import { ciblesManuelles, transitionsPossibles } from '../commandes/transitions';
import { peutVoirCommande } from '../permissions/permissions';
import { PersistenceService } from '../persistence/persistence.service';
import { Resultat } from '../resultat';
import { AuthService } from './auth.service';

/**
 * Commandes (Module F, tasks 7.2 à 7.7).
 *
 * Toutes les écritures passent par `PersistenceService.transaction` : la
 * création d'une commande (ou plusieurs, une par producteur), le décrément du
 * stock et le vidage du panier sont **atomiques** (décision D2/D8).
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);

  /** Toutes les commandes enregistrées localement. */
  readonly commandes: Signal<readonly Commande[]> = computed(() => this.persistence.etat().orders);

  /** Commandes visibles par l'utilisateur courant, de la plus récente à la plus ancienne. */
  readonly mesCommandes: Signal<readonly Commande[]> = computed(() => {
    const utilisateur = this.auth.utilisateurCourant();
    return this.commandes()
      .filter((commande) => peutVoirCommande(utilisateur, commande))
      .slice()
      .sort((gauche, droite) => droite.dateCreation.localeCompare(gauche.dateCreation));
  });

  trouver(commandeId: string): Commande | null {
    return this.commandes().find((commande) => commande.id === commandeId) ?? null;
  }

  trouverParReference(reference: string): Commande | null {
    return this.commandes().find((commande) => commande.reference === reference) ?? null;
  }

  /** L'utilisateur courant peut-il consulter cette commande (task 7.7) ? */
  peutVoir(commande: Commande): boolean {
    return peutVoirCommande(this.auth.utilisateurCourant(), commande);
  }

  /** Transitions ouvertes à l'utilisateur courant depuis le statut courant (task 7.4). */
  actionsPossibles(commande: Commande): readonly StatutCommande[] {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur || !this.peutVoir(commande)) {
      return [];
    }
    return ciblesManuelles(commande.statut, utilisateur.role);
  }

  /** Toutes les transitions prévues depuis le statut courant (message d'erreur). */
  transitionsDepuis(statut: StatutCommande): readonly StatutCommande[] {
    return transitionsPossibles(statut);
  }

  /* ------------------------------------------------------------------ écritures */

  /**
   * Valide le panier de l'acheteur connecté (task 7.2) : une commande par
   * producteur, prix figés, statut EN_ATTENTE, stock décrémenté, panier vidé.
   */
  validerPanier(adresseLivraison: string, maintenant: Date = new Date()): ResultatCommandes {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur || utilisateur.role !== 'ACHETEUR') {
      return {
        succes: false,
        message: 'Seul un acheteur connecté peut valider un panier.',
        erreursChamps: {},
        commandes: [],
      };
    }

    // `creerCommandesDepuisPanier` valide avant de muter : en cas d'échec, le
    // brouillon n'a pas été modifié (seule la révision est incrémentée).
    let resultat: ResultatCommandes = {
      succes: false,
      message: 'La commande n’a pas pu être créée.',
      erreursChamps: {},
      commandes: [],
    };
    this.persistence.transaction((brouillon) => {
      resultat = creerCommandesDepuisPanier(brouillon, utilisateur.id, adresseLivraison, maintenant);
    });
    return resultat;
  }

  avancer(commandeId: string, cible: StatutCommande, maintenant: Date = new Date()): Resultat {
    const acteur = this.acteurCourant();
    if (!acteur) {
      return this.refus('Vous devez être connecté pour agir sur une commande.');
    }
    let resultat: Resultat = this.refus('Action impossible.');
    this.persistence.transaction((brouillon) => {
      resultat = avancerCommande(brouillon, commandeId, cible, acteur, maintenant);
    });
    return resultat;
  }

  annuler(commandeId: string, maintenant: Date = new Date()): Resultat {
    const acteur = this.acteurCourant();
    if (!acteur) {
      return this.refus('Vous devez être connecté pour agir sur une commande.');
    }
    let resultat: Resultat = this.refus('Action impossible.');
    this.persistence.transaction((brouillon) => {
      resultat = annulerCommande(brouillon, commandeId, acteur, maintenant);
    });
    return resultat;
  }

  modifierAdresse(commandeId: string, adresse: string): Resultat {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur) {
      return this.refus('Vous devez être connecté pour modifier une commande.');
    }
    let resultat: Resultat = this.refus('Modification impossible.');
    this.persistence.transaction((brouillon) => {
      resultat = modifierAdresseCommande(brouillon, commandeId, utilisateur.id, adresse);
    });
    return resultat;
  }

  /* ------------------------------------------------------------------ interne */

  private acteurCourant(): Acteur | null {
    const utilisateur: Utilisateur | null = this.auth.utilisateurCourant();
    return utilisateur ? { id: utilisateur.id, role: utilisateur.role } : null;
  }

  private refus(message: string): Resultat {
    return { succes: false, message, erreursChamps: {} };
  }
}
