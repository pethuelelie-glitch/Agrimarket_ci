import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LIBELLES_ROLE } from './core/models';
import { CHEMINS, cheminTableauDeBord } from './core/navigation';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationsService } from './core/services/notifications.service';
import { ThemeService } from './core/services/theme.service';
import { DeconnexionBoutonComponent } from './shared/deconnexion-bouton.component';
import { IconeComponent, NomIcone } from './shared/icone.component';
import { LogoComponent } from './shared/logo.component';
import { PiedDePageComponent } from './shared/pied-de-page.component';

/** Un lien de la barre de navigation. */
export interface LienNavigation {
  readonly chemin: string;
  readonly libelle: string;
  readonly icone: NomIcone;
}

/** Durée d'affichage d'une notification avant fermeture automatique. */
const DUREE_NOTIFICATION_MS = 6000;

/**
 * Ossature applicative (tasks 4.1 et 4.2) : en-tête, navigation adaptée au rôle
 * avec menu repliable sur petits écrans, zone de contenu, pied de page et
 * notifications éphémères.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DeconnexionBoutonComponent,
    IconeComponent,
    LogoComponent,
    PiedDePageComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(document:keydown.escape)': 'fermerMenu()',
  },
})
export class App {
  readonly chemins = CHEMINS;

  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);
  private readonly cart = inject(CartService);
  private readonly theme = inject(ThemeService);

  readonly utilisateurCourant = this.auth.utilisateurCourant;
  readonly message = this.notifications.message;
  readonly menuOuvert = signal(false);
  readonly sombre = this.theme.sombre;

  /** Nombre d'articles du panier affiché dans la navigation (task 6.7). */
  readonly nombreArticles = this.cart.nombreArticles;

  /** Liens accessibles à tous les rôles, visiteur compris. */
  readonly liensCommuns: LienNavigation[] = [
    { chemin: CHEMINS.catalogue, libelle: 'Catalogue', icone: 'boutique' },
    { chemin: CHEMINS.aide, libelle: 'Aide', icone: 'aide' },
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
          { chemin: CHEMINS.produitsProducteur, libelle: 'Mes produits', icone: 'pousse' },
          { chemin: CHEMINS.commandesProducteur, libelle: 'Commandes reçues', icone: 'colis' },
        ];
      case 'ACHETEUR':
        return [
          { chemin: CHEMINS.panier, libelle: 'Mon panier', icone: 'panier' },
          { chemin: CHEMINS.commandes, libelle: 'Mes commandes', icone: 'colis' },
        ];
      case 'LIVREUR':
        return [{ chemin: CHEMINS.missionsLivreur, libelle: 'Mes missions', icone: 'camion' }];
      case 'ADMIN':
        return [
          { chemin: CHEMINS.adminUtilisateurs, libelle: 'Comptes', icone: 'utilisateurs' },
          { chemin: CHEMINS.adminProduits, libelle: 'Produits', icone: 'pousse' },
          { chemin: CHEMINS.adminCommandes, libelle: 'Commandes', icone: 'colis' },
          { chemin: CHEMINS.adminLivraisons, libelle: 'Livraisons', icone: 'camion' },
        ];
    }
  });

  /** Libellé du rôle courant, affiché près de la déconnexion. */
  readonly libelleRole = computed(() => {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? LIBELLES_ROLE[utilisateur.role] : null;
  });

  /** Initiales affichées dans l'avatar (ex. « Koffi Yao » → « KY »). */
  readonly initiales = computed(() => {
    const nom = this.utilisateurCourant()?.nom ?? '';
    return nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot.charAt(0).toUpperCase())
      .join('');
  });

  get cheminTableauDeBordCourant(): string {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? cheminTableauDeBord(utilisateur.role) : CHEMINS.tableauDeBord;
  }

  constructor() {
    // Fermeture automatique des notifications, relancée à chaque nouveau message.
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      const texte = this.message();
      clearTimeout(minuterie);
      if (texte) {
        minuterie = setTimeout(() => this.notifications.effacer(), DUREE_NOTIFICATION_MS);
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(minuterie));

    // Le menu mobile se referme à chaque changement de page.
    inject(Router)
      .events.pipe(
        filter((evenement) => evenement instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.fermerMenu());
  }

  basculerMenu(): void {
    this.menuOuvert.update((ouvert) => !ouvert);
  }

  fermerMenu(): void {
    this.menuOuvert.set(false);
  }

  basculerTheme(): void {
    this.theme.basculer();
  }

  effacerMessage(): void {
    this.notifications.effacer();
  }
}
