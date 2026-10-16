import { Injectable, Signal, computed, inject } from '@angular/core';
import {
  CATEGORIES,
  DonneesFormulaireProduit,
  Produit,
  estCategorie,
  estCommandeEnCours,
  estUnite,
} from '../models';
import { echec, Resultat, succes } from '../resultat';
import { AuthService } from './auth.service';
import { genererIdentifiant } from './identifiants';
import { PersistenceService } from '../persistence/persistence.service';
import {
  peutAvecUtilisateur,
  peutModifierProduit,
  peutModerer,
  peutSupprimerProduit,
} from '../permissions/permissions';

/**
 * Cycle de vie des produits agricoles (tasks 5.1 à 5.4).
 *
 * Toutes les mutations passent par `PersistenceService.transaction`, ce qui
 * garantit qu'un écriture produit/stock et une commande qui la référence ne
 * peuvent jamais diverger (décision D2).
 *
 * Les vérifications de rôle sont des protections d'interface :
 * voir `docs/limites-v1.md`.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);

  /** Catalogue courant, en lecture seule. */
  readonly produits: Signal<readonly Produit[]> = computed(() => this.persistence.etat().products);

  /** Les six catégories autorisées, exposées pour les listes déroulantes. */
  readonly categories = CATEGORIES;

  trouver(produitId: string): Produit | null {
    return this.persistence.etat().products.find((p) => p.id === produitId) ?? null;
  }

  /**
   * Valide les champs d'un produit (task 5.1) et renvoie les erreurs indexées
   * par nom de champ : chaque champ fautif possède son propre message.
   */
  valider(donnees: DonneesFormulaireProduit): Readonly<Record<string, string>> {
    const erreurs: Record<string, string> = {};

    if ((donnees.nom ?? '').trim().length === 0) {
      erreurs['nom'] = 'Le nom est obligatoire.';
    }
    if ((donnees.description ?? '').trim().length === 0) {
      erreurs['description'] = 'La description est obligatoire.';
    }
    if (!estCategorie(donnees.categorie)) {
      erreurs['categorie'] = 'Choisissez une catégorie parmi les six proposées.';
    }
    if (!estUnite(donnees.unite)) {
      erreurs['unite'] = 'Choisissez une unité de vente.';
    }
    if (typeof donnees.prix !== 'number' || !Number.isFinite(donnees.prix)) {
      erreurs['prix'] = 'Le prix doit être un nombre.';
    } else if (donnees.prix <= 0) {
      erreurs['prix'] = 'Le prix doit être strictement positif.';
    }
    if (
      typeof donnees.quantiteDisponible !== 'number' ||
      Number.isNaN(donnees.quantiteDisponible)
    ) {
      erreurs['quantiteDisponible'] = 'La quantité doit être un nombre.';
    } else if (donnees.quantiteDisponible < 0) {
      erreurs['quantiteDisponible'] = 'La quantité ne peut pas être négative (0 minimum).';
    }
    if ((donnees.localisation ?? '').trim().length === 0) {
      erreurs['localisation'] = 'La localisation est obligatoire.';
    }
    if ((donnees.imageUrl ?? '').trim().length === 0) {
      erreurs['imageUrl'] =
        "L'image est obligatoire : renseignez une URL ou choisissez une image fournie.";
    }

    return erreurs;
  }

  /**
   * Publie un produit au nom du producteur connecté (task 5.1).
   * Le statut est actif par défaut et la date du jour est enregistrée.
   */
  creer(donnees: DonneesFormulaireProduit): Resultat {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur || !peutAvecUtilisateur(utilisateur, 'product:create')) {
      return echec('Seul un producteur connecté peut publier un produit.');
    }

    const erreurs = this.valider(donnees);
    if (Object.keys(erreurs).length > 0) {
      return echec('Certains champs doivent être corrigés.', erreurs);
    }

    const produit: Produit = {
      id: genererIdentifiant('prd'),
      producteurId: utilisateur.id,
      nom: donnees.nom.trim(),
      description: donnees.description.trim(),
      categorie: donnees.categorie as Produit['categorie'],
      prix: donnees.prix,
      unite: donnees.unite as Produit['unite'],
      quantiteDisponible: donnees.quantiteDisponible,
      localisation: donnees.localisation.trim(),
      imageUrl: donnees.imageUrl.trim(),
      actif: true,
      dateCreation: new Date().toISOString(),
    };

    this.persistence.transaction((brouillon) => {
      brouillon.products.push(produit);
    });

    return succes('Produit publié avec succès.');
  }

  /**
   * Modifie les informations d'un produit (task 5.1) — réservé au producteur
   * propriétaire (spéc. « Modification réservée au producteur propriétaire »).
   */
  modifier(produitId: string, donnees: DonneesFormulaireProduit): Resultat {
    const produit = this.trouver(produitId);
    if (!produit) {
      return echec('Produit introuvable.');
    }
    if (!peutModifierProduit(this.auth.utilisateurCourant(), produit)) {
      return echec("Modification refusée : vous n'êtes pas le producteur de ce produit.");
    }

    const erreurs = this.valider(donnees);
    if (Object.keys(erreurs).length > 0) {
      return echec('Certains champs doivent être corrigés.', erreurs);
    }

    this.persistence.transaction((brouillon) => {
      const cible = brouillon.products.find((p) => p.id === produitId);
      if (!cible) {
        return;
      }
      cible.nom = donnees.nom.trim();
      cible.description = donnees.description.trim();
      cible.categorie = donnees.categorie as Produit['categorie'];
      cible.prix = donnees.prix;
      cible.unite = donnees.unite as Produit['unite'];
      cible.quantiteDisponible = donnees.quantiteDisponible;
      cible.localisation = donnees.localisation.trim();
      cible.imageUrl = donnees.imageUrl.trim();
    });

    return succes('Produit mis à jour.');
  }

  /**
   * Supprime un produit (task 5.2) : confirmation gérée côté interface, refus
   * automatique si une commande non `LIVREE` ni `ANNULEE` le référence.
   */
  supprimer(produitId: string): Resultat {
    const produit = this.trouver(produitId);
    if (!produit) {
      return echec('Produit introuvable.');
    }
    if (!peutSupprimerProduit(this.auth.utilisateurCourant(), produit)) {
      return echec("Suppression refusée : vous n'êtes pas autorisé à supprimer ce produit.");
    }
    if (this.estReferenceParCommandeEnCours(produitId)) {
      return echec(
        'Suppression refusée : ce produit figure dans une commande en cours. ' +
          'Passez-le plutôt au statut inactif pour le masquer du catalogue public.',
      );
    }

    this.persistence.transaction((brouillon) => {
      brouillon.products = brouillon.products.filter((p) => p.id !== produitId);
    });

    return succes('Produit supprimé du catalogue.');
  }

  /** Bascule le statut actif/inactif (task 5.3), pour le producteur ou l'admin. */
  basculerActivation(produitId: string): Resultat {
    const produit = this.trouver(produitId);
    if (!produit) {
      return echec('Produit introuvable.');
    }

    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur || !(peutModifierProduit(utilisateur, produit) || peutModerer(utilisateur))) {
      return echec("Activation refusée : vous n'êtes pas autorisé à gérer ce produit.");
    }

    const nouveauStatut = !produit.actif;
    this.persistence.transaction((brouillon) => {
      const cible = brouillon.products.find((p) => p.id === produitId);
      if (cible) {
        cible.actif = nouveauStatut;
      }
    });

    return succes(
      nouveauStatut
        ? 'Produit activé : il est de nouveau visible au catalogue.'
        : 'Produit désactivé : il disparaît du catalogue public.',
    );
  }

  /**
   * Modère un produit (task 10.5) : désactivation par un administrateur avec
   * motif obligatoire, tracée dans `moderation`. Le produit disparaît alors du
   * catalogue public. L'administrateur ne peut pas modifier prix, unité ni stock.
   */
  moderer(produitId: string, motif: string): Resultat {
    const produit = this.trouver(produitId);
    if (!produit) {
      return echec('Produit introuvable.');
    }
    if (!peutModerer(this.auth.utilisateurCourant())) {
      return echec('Modération refusée : cette action est réservée à un administrateur.');
    }
    if ((motif ?? '').trim().length === 0) {
      return echec('Un motif de modération est obligatoire.', {
        motif: 'Indiquez le motif de la désactivation.',
      });
    }

    const administrateur = this.auth.utilisateurCourant();
    const trace = {
      motif: motif.trim(),
      parAdminId: administrateur?.id ?? '',
      le: new Date().toISOString(),
    };

    this.persistence.transaction((brouillon) => {
      const cible = brouillon.products.find((p) => p.id === produitId);
      if (cible) {
        cible.actif = false;
        cible.moderation = trace;
      }
    });

    return succes('Produit désactivé et modération enregistrée.');
  }

  /**
   * Ajuste le stock (task 5.4) : jamais négatif et jamais en dessous des
   * quantités déjà engagées dans des commandes en cours. Le message d'erreur
   * annonce toujours la quantité minimale autorisée.
   */
  ajusterStock(produitId: string, quantite: number): Resultat {
    const produit = this.trouver(produitId);
    if (!produit) {
      return echec('Produit introuvable.');
    }
    if (!peutModifierProduit(this.auth.utilisateurCourant(), produit)) {
      return echec("Gestion refusée : vous n'êtes pas le producteur de ce produit.");
    }
    if (typeof quantite !== 'number' || Number.isNaN(quantite)) {
      return echec('La quantité doit être un nombre.', {
        quantiteDisponible: 'La quantité doit être un nombre.',
      });
    }
    if (quantite < 0) {
      return echec('La quantité ne peut pas être négative.', {
        quantiteDisponible: 'La quantité ne peut pas être négative (0 minimum).',
      });
    }

    const minimum = this.quantiteEngagee(produitId);
    if (quantite < minimum) {
      return echec(
        `Quantité minimale : ${minimum}. Le stock ne peut pas descendre en dessous des quantités déjà commandées.`,
        { quantiteDisponible: `Minimum autorisé : ${minimum}.` },
      );
    }

    this.persistence.transaction((brouillon) => {
      const cible = brouillon.products.find((p) => p.id === produitId);
      if (cible) {
        cible.quantiteDisponible = quantite;
      }
    });

    return succes(`Stock mis à jour : ${quantite}.`);
  }

  /** Somme des quantités de ce produit engagées dans des commandes non terminées. */
  quantiteEngagee(produitId: string): number {
    return this.persistence.etat().orders.reduce((total, commande) => {
      if (!estCommandeEnCours(commande.statut)) {
        return total;
      }
      return (
        total +
        commande.lignes
          .filter((ligne) => ligne.produitId === produitId)
          .reduce((somme, ligne) => somme + ligne.quantite, 0)
      );
    }, 0);
  }

  /** Ce produit est-il référencé par une commande non livrée ni annulée ? */
  estReferenceParCommandeEnCours(produitId: string): boolean {
    return this.persistence
      .etat()
      .orders.some(
        (commande) =>
          estCommandeEnCours(commande.statut) &&
          commande.lignes.some((ligne) => ligne.produitId === produitId),
      );
  }
}
