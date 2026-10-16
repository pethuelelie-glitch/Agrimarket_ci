import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LIBELLES_ROLE } from './core/models';
import { CHEMINS, cheminTableauDeBord } from './core/navigation';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationsService } from './core/services/notifications.service';
import { DeconnexionBoutonComponent } from './shared/deconnexion-bouton.component';
import { PiedDePageComponent } from './shared/pied-de-page.component';

/** Un lien de la barre de navigation. */
export interface LienNavigation {
  readonly chemin: string;
  readonly libelle: string;
}

/**
 * Ossature applicative (tasks 4.1 et 4.2) : en-tête, navigation adaptée au rôle
 * avec menu repliable sous 768 px, zone de contenu et pied de page.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DeconnexionBoutonComponent,
    PiedDePageComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly chemins = CHEMINS;

  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);
  private readonly cart = inject(CartService);

  readonly utilisateurCourant = this.auth.utilisateurCourant;
  readonly message = this.notifications.message;
  readonly menuOuvert = signal(false);

  /** Nombre d'articles du panier affiché dans la navigation (task 6.7). */
  readonly nombreArticles = this.cart.nombreArticles;

  /** Liens accessibles à tous les rôles, visiteur compris. */
  readonly liensCommuns: LienNavigation[] = [
    { chemin: CHEMINS.catalogue, libelle: 'Catalogue' },
    { chemin: CHEMINS.aide, libelle: 'Aide' },
  ];

  /** Liens propres au rôle de la session. */
  readonly liensDuRole = computed<LienNavigation[]>(() => {
    const utilisateur = this.utilisateurCourant();
    if (!utilisateur) {
      return [];
    }
    switch (utilisateur.role) {
      case 'PRODUCTEUR':
        return [
          { chemin: CHEMINS.produitsProducteur, libelle: 'Mes produits' },
          { chemin: CHEMINS.commandesProducteur, libelle: 'Commandes reçues' },
        ];
      case 'ACHETEUR':
        return [
          { chemin: CHEMINS.panier, libelle: 'Mon panier' },
          { chemin: CHEMINS.commandes, libelle: 'Mes commandes' },
        ];
      case 'LIVREUR':
        return [{ chemin: CHEMINS.missionsLivreur, libelle: 'Mes missions' }];
      case 'ADMIN':
        return [
          { chemin: CHEMINS.adminUtilisateurs, libelle: 'Comptes' },
          { chemin: CHEMINS.adminProduits, libelle: 'Produits' },
          { chemin: CHEMINS.adminCommandes, libelle: 'Commandes' },
          { chemin: CHEMINS.adminLivraisons, libelle: 'Livraisons' },
        ];
    }
  });

  /** Libellé du rôle courant, affiché près de la déconnexion. */
  readonly libelleRole = computed(() => {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? LIBELLES_ROLE[utilisateur.role] : null;
  });

  get libelleEspace(): string {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? `Espace ${LIBELLES_ROLE[utilisateur.role].toLowerCase()}` : '';
  }

  get cheminTableauDeBordCourant(): string {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? cheminTableauDeBord(utilisateur.role) : CHEMINS.tableauDeBord;
  }

  basculerMenu(): void {
    this.menuOuvert.update((ouvert) => !ouvert);
  }

  fermerMenu(): void {
    this.menuOuvert.set(false);
  }

  effacerMessage(): void {
    this.notifications.effacer();
  }
}
