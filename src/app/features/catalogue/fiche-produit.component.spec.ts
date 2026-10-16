import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IMAGE_SECOURS } from '../../core/data/seed';
import { configurerTestBedAmorce } from '../../testing/environnement';
import { FicheProduitComponent } from './fiche-produit.component';

const ROUTES_TEST = [
  { path: '', component: FicheProduitComponent },
  { path: 'catalogue', component: FicheProduitComponent },
  { path: '**', component: FicheProduitComponent },
];

async function rendre(id: string): Promise<ComponentFixture<FicheProduitComponent>> {
  await configurerTestBedAmorce({
    imports: [FicheProduitComponent],
    providers: [provideRouter(ROUTES_TEST)],
  });
  const fixture = TestBed.createComponent(FicheProduitComponent);
  fixture.componentRef.setInput('id', id);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function racine(fixture: ComponentFixture<FicheProduitComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('FicheProduitComponent (task 5.7)', () => {
  it('affiche le détail complet du produit et son producteur', async () => {
    const fixture = await rendre('prd_riz');
    const contenu = racine(fixture).textContent ?? '';

    expect(contenu).toContain('Riz local de Gagnoa');
    expect(contenu).toContain('450');
    expect(contenu).toContain('Abidjan');
    expect(contenu).toContain('Awa Koné');
    expect(contenu).toContain('Céréales');
    expect(contenu).toContain('sac');
  });

  it('affiche « produit introuvable » pour un identifiant inconnu, avec retour au catalogue', async () => {
    const fixture = await rendre('prd_inexistant');
    const contenu = racine(fixture).textContent ?? '';

    expect(contenu).toContain('Produit introuvable');
    const lien = racine(fixture).querySelector<HTMLAnchorElement>('a');
    expect(lien?.getAttribute('href')).toBe('/catalogue');
  });

  it('neutralise l’ajout au panier pour un produit épuisé', async () => {
    const fixture = await rendre('prd_gombo');

    expect(racine(fixture).querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
    expect(racine(fixture).textContent).toContain('Rupture de stock');
  });

  it('permet l’ajout au panier pour un produit disponible', async () => {
    const fixture = await rendre('prd_riz');

    expect(racine(fixture).querySelector<HTMLButtonElement>('button')?.disabled).toBe(false);
  });

  it('bascule sur l’image de secours quand le chargement échoue', async () => {
    const fixture = await rendre('prd_riz');

    racine(fixture).querySelector('img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(racine(fixture).querySelector('img')?.getAttribute('src')).toBe(IMAGE_SECOURS);
  });
});
