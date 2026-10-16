import { Injectable, Signal, computed, inject } from '@angular/core';
import { Role, ROLES_INSCRIPTION, Utilisateur, estRole } from '../models';
import { echec, succes, Resultat } from '../resultat';
import { PersistenceService } from '../persistence/persistence.service';
import { LONGUEUR_MIN_MOT_DE_PASSE, genererSel, hacherMotDePasse, verifierMotDePasse } from './hachage';
import { genererIdentifiant } from './identifiants';

export interface DonneesInscription {
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
  localisation: string;
  telephone?: string;
}

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Authentification locale (Module B), simulée : aucune requête réseau.
 *
 * - Les mots de passe ne sont jamais conservés en clair (empreinte salée).
 * - La session ouverte est le seul état global : une session invalide (compte
 *   inexistant, rôle inconnu, compte désactivé) est traitée comme une déconnexion.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly persistence = inject(PersistenceService);

  /** Utilisateur connecté, ou null (visiteur ou session invalide). */
  readonly utilisateurCourant: Signal<Utilisateur | null> = computed(() => {
    const etat = this.persistence.etat();
    const session = etat.session;
    if (!session || typeof session.userId !== 'string' || !estRole(session.role)) {
      return null;
    }
    const utilisateur = etat.users.find((candidat) => candidat.id === session.userId);
    if (!utilisateur || !utilisateur.actif) {
      return null;
    }
    return utilisateur;
  });

  /** Vrai si une session valide est ouverte. */
  readonly estConnecte: Signal<boolean> = computed(() => this.utilisateurCourant() !== null);

  /** Rôle de l'utilisateur connecté, ou null. */
  readonly roleCourant: Signal<Role | null> = computed(() => this.utilisateurCourant()?.role ?? null);

  constructor() {
    this.purgerSessionInvalide();
  }

  /**
   * Crée un compte (rôles PRODUCTEUR/ACHETEUR/LIVREUR uniquement), ouvre la
   * session et renvoie le détail des erreurs de formulaire le cas échéant.
   */
  async inscrire(donnees: DonneesInscription): Promise<Resultat> {
    const erreurs: Record<string, string> = {};

    const nom = (donnees.nom ?? '').trim();
    if (nom.length < 2) {
      erreurs['nom'] = 'Le nom est obligatoire (2 caractères minimum).';
    }

    const email = (donnees.email ?? '').trim().toLowerCase();
    if (!EMAIL_VALIDE.test(email)) {
      erreurs['email'] = 'Adresse e-mail invalide.';
    } else if (this.trouverParEmail(email)) {
      erreurs['email'] = 'Cette adresse e-mail est déjà utilisée.';
    }

    const motDePasse = donnees.motDePasse ?? '';
    if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      erreurs['motDePasse'] = `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`;
    }

    const role = donnees.role;
    if (!estRole(role) || !(ROLES_INSCRIPTION as readonly string[]).includes(role)) {
      erreurs['role'] = "Ce rôle ne peut pas être créé depuis l'inscription.";
    }

    const localisation = (donnees.localisation ?? '').trim();
    if (localisation.length === 0) {
      erreurs['localisation'] = 'La localisation est obligatoire.';
    }

    if (Object.keys(erreurs).length > 0) {
      return echec('Certains champs doivent être corrigés.', erreurs);
    }

    const sel = genererSel();
    const utilisateur: Utilisateur = {
      id: genererIdentifiant('usr'),
      nom,
      email,
      empreinteMotDePasse: await hacherMotDePasse(motDePasse, sel),
      sel,
      role,
      localisation,
      actif: true,
      dateCreation: new Date().toISOString(),
      ...(donnees.telephone?.trim() ? { telephone: donnees.telephone.trim() } : {}),
    };

    this.persistence.transaction((brouillon) => {
      brouillon.users.push(utilisateur);
      brouillon.session = {
        userId: utilisateur.id,
        role: utilisateur.role,
        ouvertLe: new Date().toISOString(),
      };
    });

    return succes('Compte créé. Vous êtes connecté.');
  }

  /**
   * Ouvre une session si les identifiants correspondent à un compte actif.
   * Le message d'erreur est identique pour une adresse inconnue et un mot de
   * passe erroné : l'existence d'une adresse n'est jamais révélée.
   */
  async connecter(emailSaisi: string, motDePasseSaisi: string): Promise<Resultat> {
    const email = (emailSaisi ?? '').trim().toLowerCase();
    const motDePasse = motDePasseSaisi ?? '';

    const utilisateur = this.trouverParEmail(email);
    const correspond = utilisateur
      ? await verifierMotDePasse(motDePasse, utilisateur.sel, utilisateur.empreinteMotDePasse)
      : false;

    if (!utilisateur || !correspond) {
      return echec('Adresse e-mail ou mot de passe incorrect.');
    }

    if (!utilisateur.actif) {
      return echec('Ce compte est désactivé. Contactez un administrateur.');
    }

    this.persistence.transaction((brouillon) => {
      brouillon.session = {
        userId: utilisateur.id,
        role: utilisateur.role,
        ouvertLe: new Date().toISOString(),
      };
    });

    return succes('Connexion réussie.');
  }

  /** Ferme la session sans toucher aux autres données locales. */
  deconnecter(): void {
    this.persistence.transaction((brouillon) => {
      brouillon.session = null;
    });
  }

  /** Indique si une adresse correspond déjà à un compte (comparaison insensible à la casse). */
  adresseUtilisee(email: string): boolean {
    return this.trouverParEmail((email ?? '').trim().toLowerCase()) !== null;
  }

  private trouverParEmail(email: string): Utilisateur | null {
    return (
      this.persistence
        .etat()
        .users.find((utilisateur) => utilisateur.email.toLowerCase() === email) ?? null
    );
  }

  /**
   * Supprime une session structurellement invalide (rôle inconnu ou compte
   * inexistant) pour que l'utilisateur soit proprement traité comme déconnecté
   * au chargement.
   *
   * Une session dont le compte existe encore mais a été **désactivé** est
   * volontairement conservée : c'est `compteActifGuard` qui la ferme, au moment
   * de la navigation, afin de pouvoir expliquer la désactivation à l'utilisateur.
   */
  private purgerSessionInvalide(): void {
    const etat = this.persistence.etat();
    const session = etat.session;
    if (!session) {
      return;
    }
    const compteExiste =
      typeof session.userId === 'string' &&
      etat.users.some((utilisateur) => utilisateur.id === session.userId);
    const valide = estRole(session.role) && compteExiste;

    if (!valide) {
      this.persistence.transaction((brouillon) => {
        brouillon.session = null;
      });
    }
  }
}
