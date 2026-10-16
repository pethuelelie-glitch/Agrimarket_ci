import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LIBELLES_UNITE } from '../../core/models';
import { CHEMINS } from '../../core/navigation';
import { GroupeProducteur, LignePanier } from '../../core/panier/resume';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { OrderService } from '../../core/services/order.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/**
 * Page du panier (task 6.7).
 *
 * Le panier est regroupé par producteur : chaque groupe affiche ses lignes,
 * son sous-total de produits et **ses propres frais de livraison** (décision
 * D7). Le récapitulatif global sépare le montant des produits des frais et
 * affiche le total. Les articles non commandables (stock insuffisant, produit
 * désactivé ou supprimé) sont signalés et la validation est bloquée.
 */
@Component({
  selector: 'app-panier',
  imports: [RouterLink, EtatVideComponent, MontantFcfaPipe],
  templateUrl: './panier.component.html',
  styleUrl: './panier.component.css',
})
export class PanierComponent {
  readonly chemins = CHEMINS;
  readonly libellesUnite = LIBELLES_UNITE;

  private readonly cart = inject(CartService);
  private readonly order = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly resume = this.cart.resume;
  readonly problemes = this.cart.problemes;
  readonly validable = this.cart.validable;

  /** Adresse de livraison saisie, pré-remplie avec la localisation du profil. */
  readonly adresse = signal(this.auth.utilisateurCourant()?.localisation ?? '');

  constructor() {
    // Répare un éventuel panier local illisible (task 6.6).
    this.cart.assainirPanier();
  }

  /** Vrai si le panier ne contient aucun article. */
  estVide(): boolean {
    return this.resume().groupes.length === 0;
  }

  /** Le bouton de validation est-il actif ? */
  peutValider(): boolean {
    return !this.estVide() && this.validable() && this.adresse().trim() !== '';
  }

  majAdresse(evenement: Event): void {
    this.adresse.set((evenement.target as HTMLInputElement).value);
  }

  /** Valide le panier : une commande est créée par producteur (task 7.2). */
  valider(): void {
    const resultat = this.order.validerPanier(this.adresse());
    this.notifications.informer(resultat.message);
    if (resultat.succes) {
      void this.router.navigate([CHEMINS.commandes]);
    }
  }

  augmenter(ligne: LignePanier): void {
    this.cart.modifierQuantite(ligne.produitId, ligne.quantite + 1);
  }

  diminuer(ligne: LignePanier): void {
    this.cart.modifierQuantite(ligne.produitId, ligne.quantite - 1);
  }

  majQuantite(ligne: LignePanier, evenement: Event): void {
    const valeur = Number((evenement.target as HTMLInputElement).value);
    this.cart.modifierQuantite(ligne.produitId, valeur);
  }

  retirer(ligne: LignePanier): void {
    this.cart.supprimer(ligne.produitId);
  }

  viderPanier(): void {
    this.cart.vider();
  }

  /** Nombre de lignes non commandables dans un groupe (indicateur visuel). */
  nombreProblemesGroupe(groupe: GroupeProducteur): number {
    return groupe.lignes.filter((ligne) => ligne.etat !== 'DISPONIBLE').length;
  }
}
