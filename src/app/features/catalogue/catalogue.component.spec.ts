import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { configurerTestBedAmorce } from '../../testing/environnement';
import { CatalogueComponent } from './catalogue.component';

const ROUTES_TEST = [
  { path: '', component: CatalogueComponent },
  { path: 'catalogue', component: CatalogueComponent },
  { path: '**', component: CatalogueComponent },
];

async function rendre(): Promise<ComponentFixture<CatalogueComponent>> {
  const fixture = TestBed.createComponent(CatalogueComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function racine(fixture: ComponentFixture<CatalogueComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function texte(fixture: ComponentFixture<CatalogueComponent>): string {
  return racine(fixture).textContent ?? '';
}

function cartes(fixture: ComponentFixture<CatalogueComponent>): number {
  return racine(fixture).querySelectorAll('app-produit-carte').length;
}

/** Simule une saisie ou un choix dans un champ, puis rafraîchit la vue. */
function saisir(
  fixture: ComponentFixture<CatalogueComponent>,
  selecteur: string,
  valeur: string,
  type: 'input' | 'change' = 'input',
): void {
  const champ = racine(fixture).querySelector<HTMLInputElement | HTMLSelectElement>(selecteur);
  if (!champ) {
    throw new Error(`Champ introuvable : ${selecteur}`);
  }
  champ.value = valeur;
  champ.dispatchEvent(new Event(type));
  fixture.detectChanges();
}

async function preparer(): Promise<ComponentFixture<CatalogueComponent>> {
  await configurerTestBedAmorce({
    imports: [CatalogueComponent],
    providers: [provideRouter(ROUTES_TEST)],
  });
  return rendre();
}

describe('CatalogueComponent (tasks 5.5 / 5.6)', () => {
  it('affiche tous les produits actifs et exclut les inactifs', async () => {
    const fixture = await preparer();

    expect(cartes(fixture)).toBe(7);
    expect(texte(fixture)).not.toContain('Haricot niébé');
    expect(texte(fixture)).toContain('Riz local de Gagnoa');
  });

  it('filtre les produits par recherche', async () => {
    const fixture = await preparer();

    saisir(fixture, '#catalogue-recherche', 'riz');

    expect(cartes(fixture)).toBe(1);
    expect(texte(fixture)).toContain('Riz local de Gagnoa');
  });

  it('filtre par catégorie', async () => {
    const fixture = await preparer();

    saisir(fixture, '#catalogue-categorie', 'LEGUMES', 'change');

    expect(cartes(fixture)).toBe(2);
    expect(texte(fixture)).toContain('Tomates fraîches');
    expect(texte(fixture)).toContain('Gombo frais');
  });

  it('filtre par disponibilité « épuisés uniquement »', async () => {
    const fixture = await preparer();

    saisir(fixture, '#catalogue-disponibilite', 'EPUISE', 'change');

    expect(cartes(fixture)).toBe(1);
    expect(texte(fixture)).toContain('Gombo frais');
  });

  it('trie par prix croissant', async () => {
    const fixture = await preparer();

    saisir(fixture, '#catalogue-tri', 'prix-asc', 'change');

    const premiere = racine(fixture).querySelector('app-produit-carte');
    expect(premiere?.textContent).toContain('Maïs jaune');
  });

  it('combine recherche et filtres (intersection)', async () => {
    const fixture = await preparer();

    saisir(fixture, '#catalogue-recherche', 'a');
    saisir(fixture, '#catalogue-prix-max', '500');
    saisir(fixture, '#catalogue-localisation', 'bouake');

    const contenu = texte(fixture);
    expect(contenu).toContain('Maïs jaune');
    expect(contenu).toContain('Mangues Kent');
    expect(contenu).not.toContain('Huile de palme');
  });

  it('affiche un état vide avec réinitialisation quand aucun produit ne correspond', async () => {
    const fixture = await preparer();

    saisir(fixture, '#catalogue-recherche', 'ananas inexistant');

    expect(cartes(fixture)).toBe(0);
    expect(texte(fixture)).toContain('Aucun produit ne correspond');
    const bouton = Array.from(racine(fixture).querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réinitialiser les filtres'),
    );
    expect(bouton).toBeTruthy();
  });

  it('réinitialise les filtres et retrouve tous les produits', async () => {
    const fixture = await preparer();
    saisir(fixture, '#catalogue-recherche', 'riz inexistant');
    expect(cartes(fixture)).toBe(0);

    const bouton = Array.from(racine(fixture).querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réinitialiser les filtres'),
    );
    bouton?.click();
    fixture.detectChanges();

    expect(cartes(fixture)).toBe(7);
  });

  describe('paramètres d’URL et rayons', () => {
    async function preparerAvec(parametres: Record<string, string>) {
      await configurerTestBedAmorce({
        imports: [CatalogueComponent],
        providers: [
          provideRouter(ROUTES_TEST),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { queryParamMap: convertToParamMap(parametres) } },
          },
        ],
      });
      return rendre();
    }

    it('pré-remplit la recherche depuis le paramètre q', async () => {
      const fixture = await preparerAvec({ q: 'riz' });

      expect(fixture.componentInstance.recherche()).toBe('riz');
      expect(cartes(fixture)).toBe(1);
    });

    it('pré-sélectionne une catégorie valide et ignore une valeur inconnue', async () => {
      const fixture = await preparerAvec({ categorie: 'LEGUMES' });
      expect(fixture.componentInstance.categorie()).toBe('LEGUMES');
      expect(cartes(fixture)).toBe(2);

      TestBed.resetTestingModule();
      const autre = await preparerAvec({ categorie: 'INCONNUE' });
      expect(autre.componentInstance.categorie()).toBe('TOUTES');
    });

    it('filtre par rayon depuis les puces', async () => {
      const fixture = await preparer();
      const puce = Array.from(racine(fixture).querySelectorAll<HTMLButtonElement>('.puce')).find(
        (bouton) => bouton.textContent?.includes('Fruits'),
      );

      puce?.click();
      fixture.detectChanges();

      expect(puce?.getAttribute('aria-pressed')).toBe('true');
      expect(cartes(fixture)).toBe(1);
      expect(texte(fixture)).toContain('Mangues Kent');
    });
  });
});
