import { Component } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../core/services/auth.service';
import { configurerTestBedAmorce } from '../testing/environnement';
import { DesactiveSiNonAutoriseDirective, SiAutoriseComponent } from './si-autorise';

@Component({
  imports: [SiAutoriseComponent, DesactiveSiNonAutoriseDirective],
  template: `
    <app-si-autorise action="admin:users">
      <button id="gerer-comptes">Gérer les comptes</button>
    </app-si-autorise>

    <app-si-autorise action="cart:manage">
      <button id="gerer-panier">Gérer le panier</button>
    </app-si-autorise>

    <button id="action-desactivee" appDesactiveSiNonAutorise="admin:reset">Réinitialiser</button>
  `,
})
class HoteComponent {}

async function rendre(email: string | null, motDePasse = ''): Promise<ComponentFixture<HoteComponent>> {
  await configurerTestBedAmorce({ imports: [HoteComponent] });
  if (email) {
    await TestBed.inject(AuthService).connecter(email, motDePasse);
  }
  const fixture = TestBed.createComponent(HoteComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function racine(fixture: ComponentFixture<HoteComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('règle partagée « action masquée si non autorisée » (task 3.5)', () => {
  it('ne rend pas une action réservée à un autre rôle', async () => {
    const fixture = await rendre('koffi.yao@agrimarket.ci', 'Achete1234');

    expect(racine(fixture).querySelector('#gerer-comptes')).toBeNull();
    expect(racine(fixture).querySelector('#gerer-panier')).not.toBeNull();
  });

  it('rend l’action pour un rôle autorisé', async () => {
    const fixture = await rendre('admin@agrimarket.ci', 'Admin1234');

    expect(racine(fixture).querySelector('#gerer-comptes')).not.toBeNull();
  });

  it('ne rend rien pour un visiteur non connecté', async () => {
    const fixture = await rendre(null);

    expect(racine(fixture).querySelector('#gerer-comptes')).toBeNull();
    expect(racine(fixture).querySelector('#gerer-panier')).toBeNull();
  });

  it('désactive une action non autorisée avec une infobulle explicative', async () => {
    const fixture = await rendre('awa.kone@agrimarket.ci', 'Produ1234');

    const bouton = racine(fixture).querySelector<HTMLButtonElement>('#action-desactivee');
    expect(bouton).not.toBeNull();
    expect(bouton?.hasAttribute('disabled')).toBe(true);
    expect(bouton?.getAttribute('title')).toContain('action non accessible');
  });

  it('active l’action pour l’administrateur sans infobulle', async () => {
    const fixture = await rendre('admin@agrimarket.ci', 'Admin1234');

    const bouton = racine(fixture).querySelector<HTMLButtonElement>('#action-desactivee');
    expect(bouton?.hasAttribute('disabled')).toBe(false);
    expect(bouton?.getAttribute('title')).toBeNull();
  });
});
