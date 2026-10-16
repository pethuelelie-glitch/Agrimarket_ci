import { Routes } from '@angular/router';
import { compteActifGuard, redirectionTableauDeBord, roleGuard } from './core/guards/auth.guard';

/**
 * Routes racine de l'application (tasks 4.5, 5.7, 5.8).
 * Toutes les pages sont chargées paresseusement, ce qui produit un découpage
 * par fonctionnalité au build.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'AgriMarket CI — le marché agricole ivoirien',
    loadComponent: () =>
      import('./features/accueil/accueil.component').then((m) => m.AccueilComponent),
  },
  {
    path: 'catalogue',
    title: 'Catalogue — AgriMarket CI',
    loadComponent: () =>
      import('./features/catalogue/catalogue.component').then((m) => m.CatalogueComponent),
  },
  {
    path: 'catalogue/:id',
    title: 'Fiche produit — AgriMarket CI',
    loadComponent: () =>
      import('./features/catalogue/fiche-produit.component').then((m) => m.FicheProduitComponent),
  },
  {
    path: 'aide',
    title: 'Aide et limites — AgriMarket CI',
    loadComponent: () => import('./features/aide/aide.component').then((m) => m.AideComponent),
  },
  {
    path: 'connexion',
    title: 'Connexion — AgriMarket CI',
    loadComponent: () =>
      import('./features/auth/connexion.component').then((m) => m.ConnexionComponent),
  },
  {
    path: 'inscription',
    title: 'Inscription — AgriMarket CI',
    loadComponent: () =>
      import('./features/auth/inscription.component').then((m) => m.InscriptionComponent),
  },
  {
    path: 'producteur/produits',
    title: 'Mes produits — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['PRODUCTEUR'])],
    loadComponent: () =>
      import('./features/produits/produits-producteur.component').then(
        (m) => m.ProduitsProducteurComponent,
      ),
  },
  {
    path: 'panier',
    title: 'Mon panier — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ACHETEUR'])],
    loadComponent: () =>
      import('./features/panier/panier.component').then((m) => m.PanierComponent),
  },
  {
    path: 'commandes',
    title: 'Mes commandes — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ACHETEUR'])],
    loadComponent: () =>
      import('./features/commandes/mes-commandes.component').then((m) => m.MesCommandesComponent),
  },
  {
    path: 'commandes/:id',
    title: 'Détail de la commande — AgriMarket CI',
    canActivate: [compteActifGuard],
    loadComponent: () =>
      import('./features/commandes/detail-commande.component').then(
        (m) => m.DetailCommandeComponent,
      ),
  },
  {
    path: 'producteur/commandes',
    title: 'Commandes reçues — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['PRODUCTEUR'])],
    loadComponent: () =>
      import('./features/commandes/commandes-recues.component').then(
        (m) => m.CommandesRecuesComponent,
      ),
  },
  {
    path: 'livreur',
    title: 'Mes missions — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['LIVREUR'])],
    loadComponent: () =>
      import('./features/livraisons/missions-livreur.component').then(
        (m) => m.MissionsLivreurComponent,
      ),
  },
  {
    path: 'admin',
    title: 'Administration — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/administration.component').then((m) => m.AdministrationComponent),
  },
  {
    path: 'admin/utilisateurs',
    title: 'Comptes — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/utilisateurs-admin.component').then(
        (m) => m.UtilisateursAdminComponent,
      ),
  },
  {
    path: 'admin/produits',
    title: 'Produits — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/produits-admin.component').then((m) => m.ProduitsAdminComponent),
  },
  {
    path: 'admin/commandes',
    title: 'Commandes — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/commandes-admin.component').then((m) => m.CommandesAdminComponent),
  },
  {
    path: 'admin/livraisons',
    title: 'Livraisons — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/livraisons/supervision-livraisons.component').then(
        (m) => m.SupervisionLivraisonsComponent,
      ),
  },
  {
    path: 'tableau-de-bord',
    title: 'Tableau de bord — AgriMarket CI',
    canActivate: [compteActifGuard, redirectionTableauDeBord],
    loadComponent: () =>
      import('./features/tableaux-de-bord/redirection-tableau-de-bord.component').then(
        (m) => m.RedirectionTableauDeBordComponent,
      ),
  },
  {
    path: 'tableau-de-bord/administrateur',
    title: 'Tableau de bord administrateur — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/tableaux-de-bord/tableau-admin.component').then(
        (m) => m.TableauAdminComponent,
      ),
  },
  {
    path: 'tableau-de-bord/producteur',
    title: 'Tableau de bord producteur — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['PRODUCTEUR'])],
    loadComponent: () =>
      import('./features/tableaux-de-bord/tableau-producteur.component').then(
        (m) => m.TableauProducteurComponent,
      ),
  },
  {
    path: 'tableau-de-bord/acheteur',
    title: 'Tableau de bord acheteur — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['ACHETEUR'])],
    loadComponent: () =>
      import('./features/tableaux-de-bord/tableau-acheteur.component').then(
        (m) => m.TableauAcheteurComponent,
      ),
  },
  {
    path: 'tableau-de-bord/livreur',
    title: 'Tableau de bord livreur — AgriMarket CI',
    canActivate: [compteActifGuard, roleGuard(['LIVREUR'])],
    loadComponent: () =>
      import('./features/tableaux-de-bord/tableau-livreur.component').then(
        (m) => m.TableauLivreurComponent,
      ),
  },
  {
    path: '**',
    title: 'Page introuvable — AgriMarket CI',
    loadComponent: () =>
      import('./features/pas-trouve/pas-trouve.component').then((m) => m.PasTrouveComponent),
  },
];
