import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard, compteActifGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { NotificationsService } from '../services/notifications.service';
import { DATE_TEST, EnvironnementTest, configurerTestBedAmorce } from '../../testing/environnement';

@Component({ selector: 'app-page-accueil', template: '<p>Page d’accueil publique</p>' })
class PageAccueilComponent {}

@Component({ selector: 'app-page-connexion', template: '<p>Connexion requise</p>' })
class PageConnexionComponent {}

@Component({
  selector: 'app-page-producteur',
  template: '<p>Espace producteur</p>',
})
class PageProducteurComponent {}

@Component({ selector: 'app-page-admin', template: '<p>Espace administrateur</p>' })
class PageAdminComponent {}

const ROUTES: Routes = [
  { path: '', component: PageAccueilComponent },
  { path: 'connexion', component: PageConnexionComponent },
  {
    path: 'tableau-de-bord/producteur',
    component: PageProducteurComponent,
    canActivate: [compteActifGuard, authGuard, roleGuard(['PRODUCTEUR'])],
  },
  {
    path: 'admin',
    component: PageAdminComponent,
    canActivate: [compteActifGuard, authGuard, roleGuard(['ADMIN'])],
  },
  { path: '**', component: PageAccueilComponent },
];

function configurer(): Promise<EnvironnementTest> {
  return configurerTestBedAmorce({ providers: [provideRouter(ROUTES)] });
}

function texte(harness: RouterTestingHarness): string {
  return (harness.routeNativeElement as HTMLElement | null)?.textContent ?? '';
}

describe('guards de navigation (tasks 3.2 / 3.3)', () => {
  it('laisse passer un visiteur vers une page publique', async () => {
    await configurer();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');

    expect(texte(harness)).toContain('Page d’accueil publique');
  });

  it('redirige un visiteur vers la connexion pour un écran protégé', async () => {
    await configurer();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    expect(texte(harness)).toContain('Connexion requise');
    expect(texte(harness)).not.toContain('Espace administrateur');
  });

  it('redirige un rôle non autorisé vers son propre espace (task 3.2)', async () => {
    await configurer();
    const auth = TestBed.inject(AuthService);
    await auth.connecter('awa.kone@agrimarket.ci', 'Produ1234');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    expect(texte(harness)).not.toContain('Espace administrateur');
    expect(texte(harness)).toContain('Espace producteur');
    expect(TestBed.inject(NotificationsService).message()).toContain('Accès refusé');
  });

  it('autorise l’administrateur sur son écran', async () => {
    await configurer();
    const auth = TestBed.inject(AuthService);
    await auth.connecter('admin@agrimarket.ci', 'Admin1234');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    expect(texte(harness)).toContain('Espace administrateur');
  });

  it('autorise le producteur sur son propre écran', async () => {
    await configurer();
    const auth = TestBed.inject(AuthService);
    await auth.connecter('awa.kone@agrimarket.ci', 'Produ1234');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tableau-de-bord/producteur');

    expect(texte(harness)).toContain('Espace producteur');
  });

  it('traite un rôle hors des quatre rôles comme une session invalide (task 3.3)', async () => {
    const env = await configurer();
    env.persistence.transaction((brouillon) => {
      brouillon.session = {
        userId: 'usr_admin',
        role: 'SUPER_ADMIN' as never,
        ouvertLe: DATE_TEST.toISOString(),
      };
    });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    expect(texte(harness)).toContain('Connexion requise');
    expect(texte(harness)).not.toContain('Espace administrateur');
    expect(env.persistence.etat().session).toBeNull();
  });

  it('déconnecte et explique la désactivation d’un compte (task 3.3)', async () => {
    const env = await configurer();
    env.persistence.transaction((brouillon) => {
      brouillon.session = {
        userId: 'usr_acheteur_1',
        role: 'ACHETEUR',
        ouvertLe: DATE_TEST.toISOString(),
      };
      const compte = brouillon.users.find((u) => u.id === 'usr_acheteur_1');
      if (compte) {
        compte.actif = false;
      }
    });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tableau-de-bord/producteur');

    expect(texte(harness)).toContain('Connexion requise');
    expect(TestBed.inject(NotificationsService).message()).toContain('désactivé');
    expect(env.persistence.etat().session).toBeNull();
  });
});
