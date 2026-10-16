import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EnvironnementTest, configurerTestBedAmorce } from '../../testing/environnement';
import { ConnexionComponent } from './connexion.component';

@Component({ selector: 'app-page-vide', template: '' })
class PageVideComponent {}

function configurer(): Promise<EnvironnementTest> {
  return configurerTestBedAmorce({
    imports: [ConnexionComponent],
    providers: [provideRouter([{ path: '**', component: PageVideComponent }])],
  });
}

function texte(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.textContent ?? '';
}

describe('ConnexionComponent (task 2.5 / 2.6)', () => {
  it('affiche la mention d’authentification simulée', async () => {
    await configurer();
    const fixture = TestBed.createComponent(ConnexionComponent);
    await fixture.whenStable();

    const contenu = texte(fixture);
    expect(contenu).toContain('simulée');
    expect(contenu).toContain('non sécurisée');
  });

  it('affiche les identifiants des comptes de démonstration', async () => {
    await configurer();
    const fixture = TestBed.createComponent(ConnexionComponent);
    await fixture.whenStable();

    const contenu = texte(fixture);
    expect(contenu).toContain('admin@agrimarket.ci');
    expect(contenu).toContain('koffi.yao@agrimarket.ci');
    expect(contenu).toContain('ibrahim.diallo@agrimarket.ci');
  });

  it('bloque une soumission invalide et n’ouvre aucune session', async () => {
    await configurer();
    const fixture = TestBed.createComponent(ConnexionComponent);
    const composant = fixture.componentInstance;
    const auth = TestBed.inject(AuthService);

    composant.formulaire.setValue({ email: 'pas-un-email', motDePasse: '' });
    await composant.soumettre();
    await fixture.whenStable();

    expect(auth.estConnecte()).toBe(false);
    expect(texte(fixture)).toContain('Saisissez une adresse e-mail valide');
  });

  it('affiche le message du service pour des identifiants erronés', async () => {
    await configurer();
    const fixture = TestBed.createComponent(ConnexionComponent);
    const composant = fixture.componentInstance;

    composant.formulaire.setValue({ email: 'koffi.yao@agrimarket.ci', motDePasse: 'Mauvais1234' });
    await composant.soumettre();
    await fixture.whenStable();

    expect(texte(fixture)).toContain('Adresse e-mail ou mot de passe incorrect.');
    expect(TestBed.inject(AuthService).estConnecte()).toBe(false);
  });

  it('ouvre la session pour des identifiants valides', async () => {
    await configurer();
    const fixture = TestBed.createComponent(ConnexionComponent);
    const composant = fixture.componentInstance;
    const auth = TestBed.inject(AuthService);

    composant.formulaire.setValue({ email: 'koffi.yao@agrimarket.ci', motDePasse: 'Achete1234' });
    await composant.soumettre();
    await fixture.whenStable();

    expect(auth.estConnecte()).toBe(true);
    expect(auth.roleCourant()).toBe('ACHETEUR');
  });

  it('pré-remplit le formulaire depuis un compte de démonstration', async () => {
    await configurer();
    const fixture = TestBed.createComponent(ConnexionComponent);
    const composant = fixture.componentInstance;

    composant.remplir(composant.comptesDemo[1]);

    expect(composant.formulaire.controls.email.value).toBe('awa.kone@agrimarket.ci');
    expect(composant.formulaire.controls.motDePasse.value).toBe('Produ1234');
  });
});
