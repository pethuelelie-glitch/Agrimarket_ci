import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { EtatApplication } from '../../core/models';
import { IDS_DEMO } from '../../core/data/seed';
import { AuthService } from '../../core/services/auth.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { TableauAcheteurComponent } from './tableau-acheteur.component';
import { TableauAdminComponent } from './tableau-admin.component';
import { TableauLivreurComponent } from './tableau-livreur.component';
import { TableauProducteurComponent } from './tableau-producteur.component';

const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;
const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const LIVREUR_1 = ['ibrahim.diallo@agrimarket.ci', 'Livre1234'] as const;

function racine<T>(fixture: ComponentFixture<T>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function texte<T>(fixture: ComponentFixture<T>): string {
  return racine(fixture).textContent ?? '';
}

function valeursKpi<T>(fixture: ComponentFixture<T>): string[] {
  return Array.from(racine(fixture).querySelectorAll('.kpi__valeur')).map(
    (element) => (element.textContent ?? '').trim(),
  );
}

function viderMetier(env: EnvironnementTest): void {
  env.persistence.transaction((brouillon: EtatApplication) => {
    brouillon.products = [];
    brouillon.orders = [];
    brouillon.deliveries = [];
    brouillon.carts = {};
  });
}

describe('TableauAdminComponent (task 9.5)', () => {
  it('affiche les indicateurs globaux', async () => {
    await configurerTestBedAmorce({
      imports: [TableauAdminComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...ADMIN);
    const fixture = TestBed.createComponent(TableauAdminComponent);
    fixture.detectChanges();

    const valeurs = valeursKpi(fixture);
    // Utilisateurs = 7, producteurs = 2, produits actifs = 7, commandes = 3.
    expect(valeurs).toContain('7');
    expect(valeurs).toContain('2');
    expect(valeurs).toContain('3');
    expect(texte(fixture)).toContain('Commandes par statut');
    expect(texte(fixture)).toContain('Évolution des commandes');
  });

  it('affiche zéro et un état vide sans donnée', async () => {
    const env = await configurerTestBedAmorce({
      imports: [TableauAdminComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...ADMIN);
    viderMetier(env);
    env.persistence.transaction((brouillon) => {
      brouillon.users = [];
    });

    const fixture = TestBed.createComponent(TableauAdminComponent);
    fixture.detectChanges();

    expect(texte(fixture)).toContain('Aucune donnée');
    expect(valeursKpi(fixture).every((valeur) => valeur === '0')).toBe(true);
  });
});

describe('TableauProducteurComponent (task 9.5)', () => {
  it('affiche les indicateurs du producteur connecté', async () => {
    await configurerTestBedAmorce({
      imports: [TableauProducteurComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    const fixture = TestBed.createComponent(TableauProducteurComponent);
    fixture.detectChanges();

    // Produits actifs = 3 ; stock = 385.
    expect(valeursKpi(fixture)).toContain('3');
    expect(texte(fixture)).toContain('Montant des ventes');
  });

  it('propose une première action sans activité', async () => {
    const env = await configurerTestBedAmorce({
      imports: [TableauProducteurComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    viderMetier(env);

    const fixture = TestBed.createComponent(TableauProducteurComponent);
    fixture.detectChanges();

    expect(texte(fixture)).toContain('Aucune activité');
    expect(racine(fixture).querySelector('.etat-vide__action')).not.toBeNull();
  });
});

describe('TableauAcheteurComponent (task 9.5)', () => {
  it('affiche les commandes en cours et livrées', async () => {
    await configurerTestBedAmorce({
      imports: [TableauAcheteurComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...ACHETEUR_1);
    const fixture = TestBed.createComponent(TableauAcheteurComponent);
    fixture.detectChanges();

    const valeurs = valeursKpi(fixture);
    // En cours = 1, livrées = 1, total = 2.
    expect(valeurs).toEqual(['1', '1', '2']);
    expect(texte(fixture)).toContain('Historique des achats');
  });
});

describe('TableauLivreurComponent (task 9.5)', () => {
  it('affiche les missions du livreur connecté', async () => {
    await configurerTestBedAmorce({
      imports: [TableauLivreurComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...LIVREUR_1);
    const fixture = TestBed.createComponent(TableauLivreurComponent);
    fixture.detectChanges();

    // Missions = 1, en cours = 1, terminées = 0, échec = 0.
    expect(valeursKpi(fixture)).toEqual(['1', '1', '0', '0']);
    expect(texte(fixture)).toContain('Mes missions');
  });

  it('affiche un état vide sans mission', async () => {
    const env = await configurerTestBedAmorce({
      imports: [TableauLivreurComponent],
      providers: [provideRouter([])],
    });
    await TestBed.inject(AuthService).connecter(...LIVREUR_1);
    env.persistence.transaction((brouillon) => {
      brouillon.deliveries = brouillon.deliveries.filter(
        (livraison) => livraison.livreurId !== IDS_DEMO.livreur1,
      );
    });

    const fixture = TestBed.createComponent(TableauLivreurComponent);
    fixture.detectChanges();

    expect(texte(fixture)).toContain('Aucune mission');
  });
});

describe('Routes des tableaux de bord (task 9.5)', () => {
  it('redirige un producteur vers son propre tableau de bord', async () => {
    await configurerTestBedAmorce({ providers: [provideRouter(routes)] });
    await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/tableau-de-bord/administrateur');
    expect(router.url).toBe('/tableau-de-bord/producteur');
  });

  it('redirige la route nue vers le tableau de bord du rôle', async () => {
    await configurerTestBedAmorce({ providers: [provideRouter(routes)] });
    await TestBed.inject(AuthService).connecter(...ACHETEUR_1);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/tableau-de-bord');
    expect(router.url).toBe('/tableau-de-bord/acheteur');
  });
});
