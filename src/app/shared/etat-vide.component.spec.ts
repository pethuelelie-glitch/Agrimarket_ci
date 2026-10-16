import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EtatVideComponent } from './etat-vide.component';

interface Options {
  message: string;
  libelleBouton?: string | null;
  lienBouton?: string | null;
}

function rendre(options: Options) {
  const fixture = TestBed.createComponent(EtatVideComponent);
  fixture.componentRef.setInput('message', options.message);
  if (options.libelleBouton !== undefined) {
    fixture.componentRef.setInput('libelleBouton', options.libelleBouton);
  }
  if (options.lienBouton !== undefined) {
    fixture.componentRef.setInput('lienBouton', options.lienBouton);
  }
  fixture.detectChanges();
  return fixture;
}

describe('EtatVideComponent (tasks 4.4 / 5.6 / 5.7)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EtatVideComponent],
      providers: [provideRouter([])],
    });
  });

  it('affiche le message fourni', () => {
    const fixture = rendre({ message: 'Aucun produit ne correspond à votre recherche.' });

    const contenu = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(contenu).toContain('Aucun produit ne correspond à votre recherche.');
  });

  it('affiche un bouton d’action quand un libellé est fourni', () => {
    const fixture = rendre({ message: 'Impossible de charger.', libelleBouton: 'Réessayer' });

    const bouton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(bouton).not.toBeNull();
    expect(bouton?.textContent).toContain('Réessayer');
  });

  it('n’affiche aucune action sans libellé', () => {
    const fixture = rendre({ message: 'Aucun résultat.' });

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('button')).toBeNull();
    expect(racine.querySelector('a')).toBeNull();
  });

  it('émet l’action au clic sur le bouton', () => {
    const fixture = rendre({ message: 'Erreur.', libelleBouton: 'Réessayer' });
    let declenche = 0;
    fixture.componentInstance.action.subscribe(() => (declenche += 1));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();

    expect(declenche).toBe(1);
  });

  it('rend un lien de navigation quand un chemin est fourni (fiche introuvable)', () => {
    const fixture = rendre({
      message: "Ce produit n'existe pas.",
      libelleBouton: 'Revenir au catalogue',
      lienBouton: '/catalogue',
    });

    const lien = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a');
    expect(lien?.textContent).toContain('Revenir au catalogue');
    expect(lien?.getAttribute('href')).toBe('/catalogue');
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
