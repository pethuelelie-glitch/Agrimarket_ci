import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IDS_DEMO } from '../../core/data/seed';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { PanierComponent } from './panier.component';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;

interface Contexte {
  fixture: ComponentFixture<PanierComponent>;
  cart: CartService;
  env: EnvironnementTest;
}

const ROUTES_TEST = [
  { path: 'panier', component: PanierComponent },
  { path: 'catalogue', component: PanierComponent },
  { path: '', component: PanierComponent },
  { path: '**', component: PanierComponent },
];

async function preparer(): Promise<Contexte> {
  const env = await configurerTestBedAmorce({
    imports: [PanierComponent],
    providers: [provideRouter(ROUTES_TEST)],
  });
  await TestBed.inject(AuthService).connecter(...ACHETEUR_1);
  const cart = TestBed.inject(CartService);
  const fixture = TestBed.createComponent(PanierComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, cart, env };
}

function racine(contexte: Contexte): HTMLElement {
  return contexte.fixture.nativeElement as HTMLElement;
}

function texte(contexte: Contexte): string {
  return racine(contexte).textContent ?? '';
}

function boutonParTexte(contexte: Contexte, libelle: string): HTMLButtonElement | undefined {
  return Array.from(racine(contexte).querySelectorAll('button')).find((bouton) =>
    (bouton.textContent ?? '').includes(libelle),
  );
}

describe('PanierComponent (task 6.7)', () => {
  it('affiche un état vide lorsque le panier ne contient rien', async () => {
    const contexte = await preparer();

    expect(texte(contexte)).toContain('Votre panier est vide');
    const lien = racine(contexte).querySelector<HTMLAnchorElement>('a[href="/catalogue"]');
    expect(lien).not.toBeNull();
  });

  it('regroupe le panier par producteur avec des frais distincts', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_riz', 2); // producteur 1 (Abidjan)
    contexte.cart.ajouter('prd_mangue', 1); // producteur 2 (Bouaké)
    contexte.fixture.detectChanges();

    const contenu = texte(contexte);
    expect(contenu).toContain('Awa Koné');
    expect(contenu).toContain('Bakary Traoré');
    // Frais producteur d'Abidjan (1500) et de Bouaké (2000) affichés séparément.
    expect(contenu).toContain('1 500');
    expect(contenu).toContain('2 000');
    expect(racine(contexte).querySelectorAll('.panier__groupe').length).toBe(2);
  });

  it('affiche le montant des produits, les frais et le total', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_tomate', 3); // 600 × 3 = 1800, frais 1500
    contexte.fixture.detectChanges();

    const contenu = texte(contexte);
    expect(contenu).toContain('Montant des produits');
    expect(contenu).toContain('1 800');
    expect(contenu).toContain('Montant total');
    expect(contenu).toContain('3 300');
  });

  it('recalcule le nombre d’articles et le total après suppression', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_riz', 2);
    contexte.cart.ajouter('prd_tomate', 1);
    contexte.fixture.detectChanges();
    expect(texte(contexte)).toContain('3 article(s)');

    const premierRetirer = racine(contexte).querySelector<HTMLButtonElement>('.panier__retirer');
    premierRetirer?.click();
    contexte.fixture.detectChanges();

    expect(texte(contexte)).toContain('1 article(s)');
    expect(racine(contexte).querySelectorAll('.panier__ligne').length).toBe(1);
  });

  it('signale et bloque un article dont le stock est devenu insuffisant', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_tomate', 5);
    contexte.env.persistence.transaction((brouillon) => {
      const produit = brouillon.products.find((p) => p.id === 'prd_tomate');
      if (produit) {
        produit.quantiteDisponible = 2;
      }
    });
    contexte.fixture.detectChanges();

    const contenu = texte(contexte);
    expect(contenu).toContain('ne sont plus commandables');
    expect(contenu).toContain('Stock insuffisant');
  });

  it('vide le panier depuis le bouton dédié', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_riz', 1);
    contexte.fixture.detectChanges();

    boutonParTexte(contexte, 'Vider le panier')?.click();
    contexte.fixture.detectChanges();

    expect(texte(contexte)).toContain('Votre panier est vide');
    expect(contexte.env.persistence.etat().carts[IDS_DEMO.acheteur1]).toBeUndefined();
  });
});

describe('PanierComponent — validation (tasks 7.2, 7.6)', () => {
  it('crée la commande et vide le panier à la validation', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_riz', 2);
    contexte.fixture.detectChanges();
    const avant = contexte.env.persistence.etat().orders.length;

    boutonParTexte(contexte, 'Valider la commande')?.click();
    contexte.fixture.detectChanges();

    const commandes = contexte.env.persistence.etat().orders;
    expect(commandes.length).toBe(avant + 1);
    expect(contexte.env.persistence.etat().carts[IDS_DEMO.acheteur1]).toBeUndefined();
    expect(texte(contexte)).toContain('Votre panier est vide');
  });

  it('désactive la validation tant qu’un article est indisponible', async () => {
    const contexte = await preparer();
    contexte.cart.ajouter('prd_tomate', 5);
    contexte.env.persistence.transaction((brouillon) => {
      const produit = brouillon.products.find((p) => p.id === 'prd_tomate');
      if (produit) {
        produit.quantiteDisponible = 2;
      }
    });
    contexte.fixture.detectChanges();

    const bouton = boutonParTexte(contexte, 'Valider la commande');
    expect(bouton?.disabled).toBe(true);
  });
});
