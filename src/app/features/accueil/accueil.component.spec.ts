import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EtatApplication } from '../../core/models';
import { etatVide } from '../../core/config';
import { AuthService } from '../../core/services/auth.service';
import { InMemoryAdapter } from '../../core/persistence/in-memory-adapter';
import { configurerTestBed, configurerTestBedAmorce } from '../../testing/environnement';
import { AccueilComponent } from './accueil.component';

const ROUTES_TEST = [
  { path: '', component: AccueilComponent },
  { path: 'catalogue', component: AccueilComponent },
  { path: 'connexion', component: AccueilComponent },
  { path: 'inscription', component: AccueilComponent },
  { path: '**', component: AccueilComponent },
];

async function rendre(): Promise<ComponentFixture<AccueilComponent>> {
  const fixture = TestBed.createComponent(AccueilComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function texte(fixture: ComponentFixture<AccueilComponent>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function racine(fixture: ComponentFixture<AccueilComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('AccueilComponent (tasks 4.3 / 4.4)', () => {
  describe('mise en avant des produits', () => {
    it('affiche au plus six produits actifs', async () => {
      await configurerTestBedAmorce({
        imports: [AccueilComponent],
        providers: [provideRouter(ROUTES_TEST)],
      });

      const fixture = await rendre();
      const cartes = racine(fixture).querySelectorAll('app-produit-carte');

      expect(cartes.length).toBeGreaterThan(0);
      expect(cartes.length).toBeLessThanOrEqual(6);
    });

    it('exclut les produits inactifs de la mise en avant', async () => {
      await configurerTestBedAmorce({
        imports: [AccueilComponent],
        providers: [provideRouter(ROUTES_TEST)],
      });

      const fixture = await rendre();

      // Le haricot est le produit inactif du jeu de démonstration.
      expect(texte(fixture)).not.toContain('Haricot');
      expect(racine(fixture).querySelectorAll('app-produit-carte').length).toBe(6);
    });

    it('affiche un état vide invitant à consulter le catalogue', async () => {
      const vide: EtatApplication = {
        ...etatVide(),
        meta: { ...etatVide().meta, initialized: true },
      };
      configurerTestBed({
        imports: [AccueilComponent],
        etatInitial: vide,
        providers: [provideRouter(ROUTES_TEST)],
      });

      const fixture = await rendre();

      expect(texte(fixture)).toContain('Aucun produit à la une');
      expect(racine(fixture).querySelector('button')?.textContent).toContain('catalogue');
    });
  });

  describe('erreur de chargement', () => {
    it('affiche un message en français et un bouton de réessai', async () => {
      const adaptateur = new InMemoryAdapter('{ données illisibles');
      const env = configurerTestBed({
        imports: [AccueilComponent],
        adaptateur,
        providers: [provideRouter(ROUTES_TEST)],
      });
      expect(env.persistence.avertissement()).not.toBeNull();

      const fixture = await rendre();

      expect(texte(fixture)).toContain('Chargement impossible');
      expect(racine(fixture).querySelector('button')?.textContent).toContain('Réessayer');
    });
  });

  describe('appels à l’action', () => {
    it('propose trois accès directs à un visiteur', async () => {
      await configurerTestBedAmorce({
        imports: [AccueilComponent],
        providers: [provideRouter(ROUTES_TEST)],
      });

      const fixture = await rendre();
      const liens = Array.from(
        racine(fixture).querySelectorAll<HTMLAnchorElement>('.hero__actions a'),
      ).map((a) => a.textContent?.trim());

      expect(liens).toEqual(['Catalogue', 'Connexion', 'Inscription']);
    });

    it('remplace les accès visiteur pour un utilisateur connecté', async () => {
      await configurerTestBedAmorce({
        imports: [AccueilComponent],
        providers: [provideRouter(ROUTES_TEST)],
      });
      await TestBed.inject(AuthService).connecter('koffi.yao@agrimarket.ci', 'Achete1234');

      const fixture = await rendre();

      expect(texte(fixture)).toContain('Mon tableau de bord');
      expect(racine(fixture).querySelectorAll<HTMLAnchorElement>('.hero__actions a').length).toBe(
        2,
      );
    });
  });

  describe('chiffres clés et rayons', () => {
    it('calcule les chiffres à partir des données locales', async () => {
      await configurerTestBedAmorce({
        imports: [AccueilComponent],
        providers: [provideRouter(ROUTES_TEST)],
      });

      const fixture = await rendre();
      const chiffres = fixture.componentInstance.statistiques();

      expect(chiffres).toEqual({ produits: 7, producteurs: 2, villes: 2, categories: 6 });
    });

    it('propose les six rayons avec le nombre de produits actifs', async () => {
      await configurerTestBedAmorce({
        imports: [AccueilComponent],
        providers: [provideRouter(ROUTES_TEST)],
      });

      const fixture = await rendre();
      const rayons = fixture.componentInstance.rayons();

      expect(rayons).toHaveLength(6);
      // Le seul produit légumineux (haricot) est inactif.
      expect(rayons.find((rayon) => rayon.categorie === 'LEGUMINEUSES')?.nombre).toBe(0);
      expect(racine(fixture).querySelectorAll('.categorie').length).toBe(6);
    });
  });
});
