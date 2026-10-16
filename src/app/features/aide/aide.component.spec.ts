import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { configurerTestBedAmorce } from '../../testing/environnement';
import { AideComponent } from './aide.component';

function configurer(): Promise<unknown> {
  return configurerTestBedAmorce({
    imports: [AideComponent],
    providers: [provideRouter([{ path: 'aide', component: AideComponent }])],
  });
}

function texte(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.textContent ?? '';
}

describe('AideComponent (task 3.4)', () => {
  it('explique la limite du contrôle d’accès côté client', async () => {
    await configurer();
    const fixture = TestBed.createComponent(AideComponent);
    await fixture.whenStable();

    const contenu = texte(fixture);
    expect(contenu).toContain('côté client');
    expect(contenu).toContain('stockage local');
    expect(contenu).toContain('côté serveur');
    expect(contenu).toMatch(/modifier ce\s+stockage|modifier ce stockage/);
  });

  it('présente la matrice des quatre rôles', async () => {
    await configurer();
    const fixture = TestBed.createComponent(AideComponent);
    await fixture.whenStable();

    const contenu = texte(fixture);
    for (const libelle of ['Administrateur', 'Producteur', 'Acheteur', 'Livreur']) {
      expect(contenu).toContain(libelle);
    }
  });

  it('précise l’absence de backend et de paiement réel', async () => {
    await configurer();
    const fixture = TestBed.createComponent(AideComponent);
    await fixture.whenStable();

    const contenu = texte(fixture);
    expect(contenu).toContain('Aucun backend');
    expect(contenu).toContain('paiement réel');
  });
});
