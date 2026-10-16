import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EnvironnementTest, configurerTestBedAmorce } from '../../testing/environnement';
import { InscriptionComponent } from './inscription.component';

@Component({ selector: 'app-page-vide', template: '' })
class PageVideComponent {}

function configurer(): Promise<EnvironnementTest> {
  return configurerTestBedAmorce({
    imports: [InscriptionComponent],
    providers: [provideRouter([{ path: '**', component: PageVideComponent }])],
  });
}

function texte(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.textContent ?? '';
}

describe('InscriptionComponent (task 2.5)', () => {
  it('affiche la mention d’authentification simulée', async () => {
    await configurer();
    const fixture = TestBed.createComponent(InscriptionComponent);
    await fixture.whenStable();

    expect(texte(fixture)).toContain('non sécurisée');
  });

  it('ne propose pas le rôle ADMIN', async () => {
    await configurer();
    const fixture = TestBed.createComponent(InscriptionComponent);
    await fixture.whenStable();

    const options = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('select#role option'),
    ).map((option) => (option as HTMLOptionElement).value);

    expect(options).toEqual(['PRODUCTEUR', 'ACHETEUR', 'LIVREUR']);
    expect(options).not.toContain('ADMIN');
  });

  it('bloque une soumission invalide sans créer de compte', async () => {
    await configurer();
    const fixture = TestBed.createComponent(InscriptionComponent);
    const composant = fixture.componentInstance;
    const auth = TestBed.inject(AuthService);

    composant.formulaire.patchValue({ nom: 'X', email: 'pas-un-email', motDePasse: 'court' });
    await composant.soumettre();
    await fixture.whenStable();

    expect(auth.estConnecte()).toBe(false);
    expect(texte(fixture)).toContain('Saisissez une adresse e-mail valide');
  });

  it('crée le compte et ouvre la session pour une saisie valide', async () => {
    const env = await configurer();
    const fixture = TestBed.createComponent(InscriptionComponent);
    const composant = fixture.componentInstance;

    composant.formulaire.setValue({
      nom: 'Awa Test',
      email: 'awa.test@agrimarket.ci',
      motDePasse: 'MotDePasse1',
      role: 'PRODUCTEUR',
      localisation: 'Abidjan',
      telephone: '',
    });
    await composant.soumettre();
    await fixture.whenStable();

    const auth = TestBed.inject(AuthService);
    expect(auth.estConnecte()).toBe(true);
    expect(auth.roleCourant()).toBe('PRODUCTEUR');
    expect(env.persistence.etat().users).toHaveLength(8);
  });

  it('affiche l’erreur d’adresse déjà utilisée sous le champ', async () => {
    await configurer();
    const fixture = TestBed.createComponent(InscriptionComponent);
    const composant = fixture.componentInstance;

    composant.formulaire.setValue({
      nom: 'Doublon',
      email: 'admin@agrimarket.ci',
      motDePasse: 'MotDePasse1',
      role: 'ACHETEUR',
      localisation: 'Abidjan',
      telephone: '',
    });
    await composant.soumettre();
    await fixture.whenStable();

    expect(texte(fixture)).toContain('déjà utilisée');
    expect(TestBed.inject(AuthService).estConnecte()).toBe(false);
  });
});
