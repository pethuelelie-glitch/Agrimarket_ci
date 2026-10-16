import { Routes } from '@angular/router';

/**
 * Routes racine de l'application (task 4.5) : toutes les pages sont chargées
 * paresseusement, ce qui produit un découpage par fonctionnalité au build.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'AgriMarket CI — le marché agricole ivoirien',
    loadComponent: () => import('./features/accueil/accueil.component').then((m) => m.AccueilComponent),
  },
  {
    path: 'catalogue',
    title: 'Catalogue — AgriMarket CI',
    loadComponent: () =>
      import('./features/catalogue/catalogue.component').then((m) => m.CatalogueComponent),
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
    path: '**',
    title: 'Page introuvable — AgriMarket CI',
    loadComponent: () =>
      import('./features/pas-trouve/pas-trouve.component').then((m) => m.PasTrouveComponent),
  },
];
