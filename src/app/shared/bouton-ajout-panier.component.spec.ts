import { TestBed } from '@angular/core/testing';
import { Produit } from '../core/models';
import { BoutonAjoutPanierComponent } from './bouton-ajout-panier.component';

function produit(partiel: Partial<Produit> = {}): Produit {
  return {
    id: 'prd_1',
    producteurId: 'usr_producteur_1',
    nom: 'Riz local',
    description: 'Riz parfumé',
    categorie: 'CEREALES',
    prix: 450,
    unite: 'KG',
    quantiteDisponible: 20,
    localisation: 'Abidjan',
    imageUrl: 'https://exemple.test/riz.jpg',
    actif: true,
    dateCreation: '2026-06-01T09:00:00.000Z',
    ...partiel,
  };
}

function rendre(article: Produit) {
  TestBed.configureTestingModule({ imports: [BoutonAjoutPanierComponent] });
  const fixture = TestBed.createComponent(BoutonAjoutPanierComponent);
  fixture.componentRef.setInput('produit', article);
  fixture.detectChanges();
  return fixture;
}

function bouton(fixture: ReturnType<typeof rendre>): HTMLButtonElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button');
}

describe('BoutonAjoutPanierComponent (task 5.9)', () => {
  it('active le bouton pour un produit disponible', () => {
    const fixture = rendre(produit());

    expect(bouton(fixture)?.disabled).toBe(false);
    expect(bouton(fixture)?.textContent).toContain('Ajouter au panier');
    expect((fixture.nativeElement as HTMLElement).querySelector('.rupture')).toBeNull();
  });

  it('désactive le bouton et affiche « rupture de stock » pour un produit épuisé', () => {
    const fixture = rendre(produit({ quantiteDisponible: 0 }));

    expect(bouton(fixture)?.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Rupture de stock');
  });

  it('désactive le bouton et signale un produit inactif', () => {
    const fixture = rendre(produit({ actif: false, quantiteDisponible: 50 }));

    expect(bouton(fixture)?.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('indisponible');
  });

  it('émet la demande d’ajout quand le produit est vendable', () => {
    const fixture = rendre(produit());
    let ajouts = 0;
    fixture.componentInstance.ajouter.subscribe(() => (ajouts += 1));

    bouton(fixture)?.click();
    fixture.detectChanges();

    expect(ajouts).toBe(1);
  });

  it('n’émet rien quand le bouton est neutralisé', () => {
    const fixture = rendre(produit({ quantiteDisponible: 0 }));
    let ajouts = 0;
    fixture.componentInstance.ajouter.subscribe(() => (ajouts += 1));

    bouton(fixture)?.click();

    expect(ajouts).toBe(0);
  });
});
