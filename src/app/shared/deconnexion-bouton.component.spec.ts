import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { EnvironnementTest, configurerTestBedAmorce } from '../testing/environnement';
import { DeconnexionBoutonComponent } from './deconnexion-bouton.component';

@Component({ selector: 'app-page-vide', template: '' })
class PageVideComponent {}

describe('DeconnexionBoutonComponent (task 2.6)', () => {
  function configurer(): Promise<EnvironnementTest> {
    return configurerTestBedAmorce({
      imports: [DeconnexionBoutonComponent],
      providers: [provideRouter([{ path: '**', component: PageVideComponent }])],
    });
  }

  it('ferme la session et ramène à l’accueil', async () => {
    await configurer();
    const auth = TestBed.inject(AuthService);
    await auth.connecter('admin@agrimarket.ci', 'Admin1234');
    expect(auth.estConnecte()).toBe(true);

    const fixture = TestBed.createComponent(DeconnexionBoutonComponent);
    await fixture.componentInstance.seDeconnecter();
    await fixture.whenStable();

    expect(auth.estConnecte()).toBe(false);
    expect(auth.utilisateurCourant()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('conserve les données locales après déconnexion', async () => {
    const env = await configurer();
    const auth = TestBed.inject(AuthService);
    await auth.connecter('admin@agrimarket.ci', 'Admin1234');
    const fixture = TestBed.createComponent(DeconnexionBoutonComponent);

    await fixture.componentInstance.seDeconnecter();

    expect(env.persistence.etat().session).toBeNull();
    expect(env.persistence.etat().users).toHaveLength(7);
    expect(env.persistence.etat().products).toHaveLength(8);
  });
});
