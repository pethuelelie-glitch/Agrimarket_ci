import { Injectable, Signal, computed, inject } from '@angular/core';
import { Panier } from '../models/panier';
import { Utilisateur } from '../models';
import { estDisponible, messageIndisponibilite } from '../catalogue/disponibilite';
import { PersistenceService } from '../persistence/persistence.service';
import { echec, Resultat, succes } from '../resultat';
import { AuthService } from './auth.service';
import { CatalogueService } from './catalogue.service';
import { NotificationsService } from './notifications.service';
import { normaliserPanier, panierCorrompu, avecQuantite, sansProduit } from '../panier/normalisation';
import { construireResume, LignePanier, ResumePanier } from '../panier/resume';

/**
 * Panier de l'acheteur connecté (tasks 6.1 à 6.6).
 *
 * - Un seul panier par acheteur, conservé dans `carts[acheteurId]` : deux comptes
 *   n'ont jamais accès au même panier.
 * - Les mutations passent par `PersistenceService.transaction` (décision D2).
 * - Aucun montant n'est stocké : le résumé (sous-totaux, frais, total) est
 *   toujours recalculé à partir des produits et des quantités courantes.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);
  private readonly catalogue = inject(CatalogueService);
  private readonly notifications = inject(NotificationsService);

  /** Identifiant de l'acheteur connecté, ou `null` (visiteur ou autre rôle). */
  private readonly acheteurId: Signal<string | null> = computed(() => {
    const utilisateur = this.auth.utilisateurCourant();
    return utilisateur && utilisateur.role === 'ACHETEUR' ? utilisateur.id : null;
  });

  /** Panier de l'acheteur connecté, ou `null` (absent, vide ou illisible). */
  readonly panier: Signal<Panier | null> = computed(() => {
    const id = this.acheteurId();
    if (!id) {
      return null;
    }
    return normaliserPanier(this.persistence.etat().carts[id]);
  });

  /** Articles du panier courant. */
  readonly items = computed(() => this.panier()?.items ?? []);

  /** Résumé complet (groupes par producteur, montants, frais, total). */
  readonly resume: Signal<ResumePanier> = computed(() => {
    const etat = this.persistence.etat();
    return construireResume(this.items(), etat.products, etat.users);
  });

  /** Indicateur du nombre d'articles affiché dans la navigation. */
  readonly nombreArticles = computed(() => this.resume().nombreArticles);

  /** Lignes non commandables en l'état (task 6.5). */
  readonly problemes: Signal<readonly LignePanier[]> = computed(() =>
    this.resume()
      .groupes.flatMap((groupe) => groupe.lignes)
      .filter((ligne) => ligne.etat !== 'DISPONIBLE'),
  );

  /** Vrai si le panier peut être transformé en commandes. */
  readonly validable = computed(() => this.resume().validable);

  /* ------------------------------------------------------------------ lecture */

  /** L'utilisateur connecté peut-il gérer un panier ? */
  estAcheteur(): boolean {
    return this.acheteurId() !== null;
  }

  /* ------------------------------------------------------------------ écriture */

  /**
   * Ajoute un produit au panier (task 6.1).
   * Refuse un produit inactif/épuisé, une quantité au-delà du stock, et
   * plafonne le cumul sur un produit déjà présent.
   */
  ajouter(produitId: string, quantite = 1): Resultat {
    const utilisateur = this.utilisateurAcheteur();
    if (typeof utilisateur === 'string') {
      return echec(utilisateur);
    }
    if (!Number.isInteger(quantite) || quantite < 1) {
      return echec('La quantité doit être un entier supérieur ou égal à 1.');
    }

    const produit = this.catalogue.trouver(produitId);
    if (!produit) {
      return echec('Produit indisponible : ce produit n’existe plus.');
    }
    if (!estDisponible(produit)) {
      return echec(messageIndisponibilite(produit) ?? 'Produit indisponible.');
    }

    const stock = produit.quantiteDisponible;
    if (quantite > stock) {
      return echec(`Quantité maximale disponible pour ce produit : ${stock}.`);
    }

    const existant = this.items().find((item) => item.produitId === produitId);
    const cumul = (existant?.quantite ?? 0) + quantite;
    const quantiteCible = Math.min(cumul, stock);
    const plafonne = cumul > stock;

    this.ecrireItems(utilisateur.id, avecQuantite(this.items(), produitId, quantiteCible));

    return plafonne
      ? succes(`Quantité ajustée au stock disponible (${stock} maximum).`)
      : succes('Produit ajouté au panier.');
  }

  /**
   * Modifie la quantité d'une ligne (task 6.2) : minimum 1, plafond au stock.
   */
  modifierQuantite(produitId: string, quantite: number): Resultat {
    const utilisateur = this.utilisateurAcheteur();
    if (typeof utilisateur === 'string') {
      return echec(utilisateur);
    }
    if (!this.items().some((item) => item.produitId === produitId)) {
      return echec('Cet article n’est pas dans votre panier.');
    }

    const produit = this.catalogue.trouver(produitId);
    if (!produit) {
      return echec('Ce produit n’est plus disponible : retirez-le de votre panier.');
    }

    if (!Number.isInteger(quantite) || quantite < 1) {
      this.ecrireItems(utilisateur.id, avecQuantite(this.items(), produitId, 1));
      return succes('La quantité minimale est 1. Supprimez l’article pour le retirer du panier.');
    }

    const stock = produit.quantiteDisponible;
    if (quantite > stock) {
      this.ecrireItems(utilisateur.id, avecQuantite(this.items(), produitId, stock));
      return succes(`Stock maximum atteint : ${stock}.`);
    }

    this.ecrireItems(utilisateur.id, avecQuantite(this.items(), produitId, quantite));
    return succes('Quantité mise à jour.');
  }

  /** Retire une ligne du panier (task 6.2). */
  supprimer(produitId: string): Resultat {
    const utilisateur = this.utilisateurAcheteur();
    if (typeof utilisateur === 'string') {
      return echec(utilisateur);
    }
    if (!this.items().some((item) => item.produitId === produitId)) {
      return echec('Cet article n’est pas dans votre panier.');
    }

    const restants = sansProduit(this.items(), produitId);
    if (restants.length === 0) {
      this.vider();
    } else {
      this.ecrireItems(utilisateur.id, restants);
    }
    return succes('Article retiré du panier.');
  }

  /** Vide le panier de l'acheteur connecté. */
  vider(): void {
    const id = this.acheteurId();
    if (!id) {
      return;
    }
    this.persistence.transaction((brouillon) => {
      delete brouillon.carts[id];
    });
  }

  /**
   * Répare un panier illisible : le réinitialise à vide et en informe
   * l'acheteur (task 6.6). Sans effet si le panier est absent ou valide.
   */
  assainirPanier(): void {
    const id = this.acheteurId();
    if (!id) {
      return;
    }
    if (!panierCorrompu(this.persistence.etat().carts[id])) {
      return;
    }
    this.persistence.transaction((brouillon) => {
      delete brouillon.carts[id];
    });
    this.notifications.informer(
      'Votre panier a été réinitialisé : les données locales du panier étaient illisibles.',
    );
  }

  /* ------------------------------------------------------------------ interne */

  /**
   * Renvoie l'acheteur connecté, ou un message d'erreur si l'utilisateur n'a
   * pas le droit de gérer un panier.
   */
  private utilisateurAcheteur(): Utilisateur | string {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur) {
      return 'Connectez-vous pour gérer votre panier.';
    }
    if (utilisateur.role !== 'ACHETEUR') {
      return 'Le panier est réservé aux acheteurs.';
    }
    return utilisateur;
  }

  private ecrireItems(acheteurId: string, items: readonly { produitId: string; quantite: number }[]): void {
    this.persistence.transaction((brouillon) => {
      brouillon.carts[acheteurId] = {
        acheteurId,
        items: items.map((item) => ({ produitId: item.produitId, quantite: item.quantite })),
        majLe: new Date().toISOString(),
      };
    });
  }
}
