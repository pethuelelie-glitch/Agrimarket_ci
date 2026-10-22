import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { amorcerDonneesDemo } from './core/data/initialisation';
import { PersistenceService } from './core/persistence/persistence.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding` relie les paramètres d'URL aux `input()` des
    // composants (utilisé par la fiche produit `/catalogue/:id`). Chaque
    // navigation remonte en haut de page, avec une transition de vue douce.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true }),
    ),
    // Amorçage unique : les données de démonstration ne sont créées qu'une fois,
    // uniquement si `meta.initialized` est faux.
    provideAppInitializer(async () => {
      await amorcerDonneesDemo(inject(PersistenceService));
    }),
  ],
};
