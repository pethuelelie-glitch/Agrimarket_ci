import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Produit } from '../core/models';
import { IMAGE_SECOURS } from '../core/data/seed';
import { ProduitCarteComponent } from './produit-carte.component';

const PRODUIT: Produit = {
  id: 'prd_1',
  producteurId: 'usr_producteur_1',
  nom: 'Riz local parfumé',
  description: 'Riz de Yamoussoukro',
  categorie: 'CEREALES',
  prix: 450,
  unite: 'KG',
  quantiteDisponible: 120,
  localisation: 'Yamoussoukro',
  imageUrl: 'https://exemple.test/riz.jpg',
  actif: true,
  dateCreation: '2026-06-01T09:00:00.000Z',
};

function rendre(produit: Produit = PRODUIT) {
  TestBed.configureTestingModule({
    imports: [ProduitCarteComponent],
    providers: [provideRouter([{ path: '**', children: [] }])],
  });
  const fixture = TestBed.createComponent(ProduitCarteComponent);
  fixture.componentRef.setInput('produit', produit);
  fixture.detectChanges();
  return fixture;
}

describe('ProduitCarteComponent', () => {
  it('affiche nom, prix, unité, localisation et catégorie', () => {
    const fixture = rendre();
    const contenu = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(contenu).toContain('Riz local parfumé');
    expect(contenu).toContain('450');
    expect(contenu).toContain('kg');
    expect(contenu).toContain('Yamoussoukro');
    expect(contenu).toContain('Céréales');
  });

  it('pointe vers la fiche produit', () => {
    const fixture = rendre();
    const lien = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a');

    expect(lien?.getAttribute('href')).toBe('/catalogue/prd_1');
  });

  it('affiche l’image du produit', () => {
    const fixture = rendre();
    const image = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img');

    expect(image?.getAttribute('src')).toBe('https://exemple.test/riz.jpg');
  });

  it('bascule sur l’image de secours quand le chargement échoue', () => {
    const fixture = rendre();
    const image = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img');

    image?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('img')?.getAttribute('src')).toBe(
      IMAGE_SECOURS,
    );
  });

  it('utilise l’image de secours quand l’URL est vide', () => {
    const fixture = rendre({ ...PRODUIT, imageUrl: '' });
    const image = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img');

    expect(image?.getAttribute('src')).toBe(IMAGE_SECOURS);
  });

  it('neutralise l’ajout au panier pour un produit épuisé (task 5.9)', () => {
    const fixture = rendre({ ...PRODUIT, quantiteDisponible: 0 });
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
    expect(racine.textContent).toContain('Rupture de stock');
  });

  it('affiche un badge « Inactif » et neutralise l’ajout (task 5.9)', () => {
    const fixture = rendre({ ...PRODUIT, actif: false });
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.textContent).toContain('Inactif');
    expect(racine.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
  });
});
