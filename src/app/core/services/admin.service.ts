import { Injectable, Signal, computed, inject } from '@angular/core';
import { amorcerDonneesDemo } from '../data/initialisation';
import { Commande, ROLES, Role, StatutCommande, Utilisateur, estRole } from '../models';
import { PersistenceService } from '../persistence/persistence.service';
import { peutAvecUtilisateur } from '../permissions/permissions';
import { echec, Resultat, succes } from '../resultat';
import { AuthService } from './auth.service';
import { LONGUEUR_MIN_MOT_DE_PASSE, genererSel, hacherMotDePasse } from './hachage';

/** Champs d'un compte modifiables par l'administrateur (jamais l'e-mail). */
export interface DonneesModificationUtilisateur {
  nom: string;
  localisation: string;
  telephone?: string;
}

/** Filtres de la supervision des commandes (task 10.6). */
export interface FiltresCommandes {
  statut?: StatutCommande | '';
  producteurId?: string | '';
}

/**
 * Administration de la plateforme (Module I, tasks 10.1 à 10.7).
 *
 * - Les rôles reconnus restent les quatre de `ROLES` ; l'e-mail est un
 *   identifiant non modifiable.
 * - Un compte désactivé ne peut plus ouvrir de session (voir `AuthService`).
 * - Les protections (propre compte, dernier administrateur) sont des garde-fous
 *   d'interface : voir `docs/limites-v1.md`.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);

  /** Les quatre rôles attribuables par l'administrateur. */
  readonly roles = ROLES;

  /** Tous les comptes, triés par nom. */
  readonly utilisateurs: Signal<readonly Utilisateur[]> = computed(() =>
    [...this.persistence.etat().users].sort((a, b) => a.nom.localeCompare(b.nom)),
  );

  /** Les producteurs, pour les filtres de supervision. */
  readonly producteurs: Signal<readonly Utilisateur[]> = computed(() =>
    this.utilisateurs().filter((utilisateur) => utilisateur.role === 'PRODUCTEUR'),
  );

  /** Tous les produits, y compris inactifs et modérés. */
  readonly produits = computed(() => this.persistence.etat().products);

  /** Toutes les commandes. */
  readonly commandes: Signal<readonly Commande[]> = computed(() => this.persistence.etat().orders);

  /* ------------------------------------------------------------------ comptes */

  trouverUtilisateur(utilisateurId: string): Utilisateur | null {
    return (
      this.persistence.etat().users.find((utilisateur) => utilisateur.id === utilisateurId) ?? null
    );
  }

  /**
   * Recherche un compte par nom ou adresse e-mail (task 10.1).
   * La recherche est insensible à la casse et aux accents.
   */
  rechercher(texte: string): Utilisateur[] {
    const requete = normaliser(texte);
    if (requete.length === 0) {
      return [...this.utilisateurs()];
    }
    return this.utilisateurs().filter(
      (utilisateur) =>
        normaliser(utilisateur.nom).includes(requete) ||
        normaliser(utilisateur.email).includes(requete),
    );
  }

  /**
   * Modifie les informations autorisées d'un compte (task 10.2). L'adresse
   * e-mail n'est jamais modifiable : elle n'est même pas acceptée en entrée.
   */
  modifierUtilisateur(utilisateurId: string, donnees: DonneesModificationUtilisateur): Resultat {
    if (!this.estAdministrateur()) {
      return echec('Action refusée : réservée à un administrateur.');
    }
    if (!this.trouverUtilisateur(utilisateurId)) {
      return echec('Compte introuvable.');
    }

    const erreurs = this.validerModification(donnees);
    if (Object.keys(erreurs).length > 0) {
      return echec('Certains champs doivent être corrigés.', erreurs);
    }

    const nom = donnees.nom.trim();
    const localisation = donnees.localisation.trim();
    const telephone = (donnees.telephone ?? '').trim();

    this.persistence.transaction((brouillon) => {
      const cible = brouillon.users.find((utilisateur) => utilisateur.id === utilisateurId);
      if (!cible) {
        return;
      }
      cible.nom = nom;
      cible.localisation = localisation;
      if (telephone.length > 0) {
        cible.telephone = telephone;
      } else {
        delete cible.telephone;
      }
    });

    return succes('Compte mis à jour.');
  }

  /** Valide les champs modifiables. L'e-mail n'apparaît jamais ici. */
  validerModification(donnees: DonneesModificationUtilisateur): Readonly<Record<string, string>> {
    const erreurs: Record<string, string> = {};

    if ((donnees.nom ?? '').trim().length === 0) {
      erreurs['nom'] = 'Le nom est obligatoire.';
    }
    if ((donnees.localisation ?? '').trim().length === 0) {
      erreurs['localisation'] = 'La localisation est obligatoire.';
    }
    const telephone = (donnees.telephone ?? '').trim();
    if (telephone.length > 0 && !/^[+0-9 ().-]{6,20}$/.test(telephone)) {
      erreurs['telephone'] = 'Numéro de téléphone invalide.';
    }

    return erreurs;
  }

  /**
   * Réinitialise le mot de passe d'un compte (task 10.2) : seule une empreinte
   * salée est enregistrée, jamais le mot de passe en clair.
   */
  async reinitialiserMotDePasse(utilisateurId: string, motDePasse: string): Promise<Resultat> {
    if (!this.estAdministrateur()) {
      return echec('Action refusée : réservée à un administrateur.');
    }
    if (!this.trouverUtilisateur(utilisateurId)) {
      return echec('Compte introuvable.');
    }
    if (typeof motDePasse !== 'string' || motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      return echec(
        `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`,
        {
          motDePasse: `Au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`,
        },
      );
    }

    const sel = genererSel();
    const empreinte = await hacherMotDePasse(motDePasse, sel);

    this.persistence.transaction((brouillon) => {
      const cible = brouillon.users.find((utilisateur) => utilisateur.id === utilisateurId);
      if (cible) {
        cible.sel = sel;
        cible.empreinteMotDePasse = empreinte;
      }
    });

    return succes('Mot de passe réinitialisé.');
  }

  /** Change le rôle d'un compte vers l'un des quatre rôles reconnus (task 10.3). */
  changerRole(utilisateurId: string, role: Role | string): Resultat {
    if (!this.estAdministrateur()) {
      return echec('Action refusée : réservée à un administrateur.');
    }
    if (!estRole(role)) {
      return echec('Rôle inconnu : choisissez l’un des quatre rôles reconnus.');
    }
    if (!this.trouverUtilisateur(utilisateurId)) {
      return echec('Compte introuvable.');
    }

    this.persistence.transaction((brouillon) => {
      const cible = brouillon.users.find((utilisateur) => utilisateur.id === utilisateurId);
      if (cible) {
        cible.role = role;
      }
    });

    return succes('Rôle mis à jour.');
  }

  /** Nombre d'administrateurs actifs (task 10.4). */
  compterAdminsActifs(): number {
    return this.persistence
      .etat()
      .users.filter((utilisateur) => utilisateur.role === 'ADMIN' && utilisateur.actif).length;
  }

  /**
   * Active ou désactive un compte (task 10.4).
   * Protections : désactivation de son propre compte et du dernier
   * administrateur actif toutes deux refusées avec un message explicatif.
   */
  basculerActivation(utilisateurId: string): Resultat {
    if (!this.estAdministrateur()) {
      return echec('Action refusée : réservée à un administrateur.');
    }

    const cible = this.trouverUtilisateur(utilisateurId);
    if (!cible) {
      return echec('Compte introuvable.');
    }

    if (!cible.actif) {
      this.persistence.transaction((brouillon) => {
        const utilisateur = brouillon.users.find((u) => u.id === utilisateurId);
        if (utilisateur) {
          utilisateur.actif = true;
        }
      });
      return succes('Compte réactivé : il peut de nouveau ouvrir une session.');
    }

    // Protection 1 : la plateforme doit conserver au moins un administrateur actif.
    if (cible.role === 'ADMIN' && this.compterAdminsActifs() <= 1) {
      return echec(
        'Désactivation refusée : la plateforme doit conserver au moins un administrateur actif.',
      );
    }

    // Protection 2 : un administrateur ne désactive jamais son propre compte.
    const courant = this.auth.utilisateurCourant();
    if (courant && courant.id === utilisateurId) {
      return echec('Vous ne pouvez pas désactiver le compte avec lequel vous êtes connecté.');
    }

    this.persistence.transaction((brouillon) => {
      const utilisateur = brouillon.users.find((u) => u.id === utilisateurId);
      if (utilisateur) {
        utilisateur.actif = false;
      }
    });
    return succes('Compte désactivé : il ne peut plus ouvrir de session.');
  }

  /* ------------------------------------------------------------------ supervision */

  /** Filtre les commandes par statut et par producteur (task 10.6). */
  filtrerCommandes(filtres: FiltresCommandes): Commande[] {
    const statut = filtres.statut ?? '';
    const producteurId = filtres.producteurId ?? '';
    return this.commandes().filter(
      (commande) =>
        (statut === '' || commande.statut === statut) &&
        (producteurId === '' || commande.producteurId === producteurId),
    );
  }

  /* ------------------------------------------------------------------ réinitialisation */

  /**
   * Réinitialise les données de démonstration (task 10.7), réservée à
   * l'administrateur. La session de l'administrateur est restaurée s'il
   * figure toujours dans le jeu rechargé, afin de ne pas le déconnecter.
   */
  async reinitialiserDonnees(): Promise<Resultat> {
    const courant = this.auth.utilisateurCourant();
    if (!courant || !peutAvecUtilisateur(courant, 'admin:reset')) {
      return echec('Réinitialisation refusée : action réservée à un administrateur.');
    }

    await amorcerDonneesDemo(this.persistence, { forcer: true });

    this.persistence.transaction((brouillon) => {
      const administrateur = brouillon.users.find((u) => u.id === courant.id && u.actif);
      if (administrateur) {
        brouillon.session = {
          userId: administrateur.id,
          role: administrateur.role,
          ouvertLe: new Date().toISOString(),
        };
      }
    });

    return succes('Données de démonstration réinitialisées.');
  }

  /* ------------------------------------------------------------------ interne */

  /** L'utilisateur courant peut-il administrer la plateforme ? (task 10.1) */
  peutAdministrer(): boolean {
    return this.estAdministrateur();
  }

  private estAdministrateur(): boolean {
    return peutAvecUtilisateur(this.auth.utilisateurCourant(), 'admin:users');
  }
}

/** Normalise une chaîne pour la recherche : minuscules, sans accents. */
function normaliser(valeur: string): string {
  return (valeur ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
