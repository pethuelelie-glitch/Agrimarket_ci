import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CHEMINS } from '../navigation';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { NotificationsService } from '../services/notifications.service';

/**
 * Point d'entrée unique de l'action « Ajouter au panier » (task 6.8).
 *
 * - Un **visiteur** non connecté est redirigé vers la connexion, sans aucune
 *   modification du panier.
 * - Un utilisateur connecté d'un **autre rôle** reçoit le message
 *   « réservé aux acheteurs » (le service de panier refuse l'opération).
 * - Un **acheteur** ajoute l'article ; le message de résultat est publié.
 */
@Injectable({ providedIn: 'root' })
export class AjoutPanierService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly notifications = inject(NotificationsService);

  /** Tente d'ajouter un produit au panier de l'acheteur connecté. */
  ajouter(produitId: string, quantite = 1): void {
    const utilisateur = this.auth.utilisateurCourant();
    if (!utilisateur) {
      this.notifications.informer(
        'Connectez-vous en tant qu’acheteur pour ajouter des produits à votre panier.',
      );
      void this.router.navigate([CHEMINS.connexion]);
      return;
    }

    const resultat = this.cart.ajouter(produitId, quantite);
    this.notifications.informer(resultat.message);
  }
}
