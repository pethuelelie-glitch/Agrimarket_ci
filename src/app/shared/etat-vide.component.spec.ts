import { TestBed } from '@angular/core/testing';
import { EtatVideComponent } from './etat-vide.component';

function rendre(message: string, libelleBouton: string | null = null) {
  const fixture = TestBed.createComponent(EtatVideComponent);
  fixture.componentRef.setInput('message', message);
  if (libelleBouton !== null) {
    fixture.componentRef.setInput('libelleBouton', libelleBouton);
  }
  fixture.detectChanges();
  return fixture;
}

describe('EtatVideComponent (task 4.4)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EtatVideComponent] });
  });

  it('affiche le message fourni', () => {
    const fixture = rendre('Aucun produit ne correspond à votre recherche.');

    const contenu = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(contenu).toContain('Aucun produit ne correspond à votre recherche.');
  });

  it('affiche un bouton d’action quand un libellé est fourni', () => {
    const fixture = rendre('Impossible de charger les produits.', 'Réessayer');

    const bouton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(bouton).not.toBeNull();
    expect(bouton?.textContent).toContain('Réessayer');
  });

  it('n’affiche aucun bouton sans libellé', () => {
    const fixture = rendre('Aucun résultat.');

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('émet l’action au clic sur le bouton', () => {
    const fixture = rendre('Erreur de chargement.', 'Réessayer');
    let declenche = 0;
    fixture.componentInstance.action.subscribe(() => (declenche += 1));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();

    expect(declenche).toBe(1);
  });
});
