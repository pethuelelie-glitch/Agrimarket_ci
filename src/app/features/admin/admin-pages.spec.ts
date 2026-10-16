import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { Produit } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { AdministrationComponent } from './administration.component';
import { CommandesAdminComponent } from './commandes-admin.component';
import { ProduitsAdminComponent } from './produits-admin.component';
import { UtilisateursAdminComponent } from './utilisateurs-admin.component';

const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;

function racine<T>(fixture: ComponentFixture<T>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function texte<T>(fixture: ComponentFixture<T>): string {
  return racine(fixture).textContent ?? '';
}

async function connecterAdmin(): Promise<EnvironnementTest> {
  const env = await configurerTestBedAmorce({ providers: [provideRouter([])] });
  await TestBed.inject(AuthService).connecter(...ADMIN);
  return env;
}

describe('Routes d’administration (task 10.8)', () => {
  it('renvoie un non-administrateur vers son propre espace', async () => {
    await configurerTestBedAmorce({ providers: [provideRouter(routes)] });
    await TestBed.inject(AuthService).connecter(...ACHETEUR_1);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/admin/utilisateurs');
    expect(router.url).toBe('/tableau-de-bord/acheteur');
  });

  it('autorise l’administrateur à atteindre chaque écran', async () => {
    await configurerTestBedAmorce({ providers: [provideRouter(routes)] });
    await TestBed.inject(AuthService).connecter(...ADMIN);
    const router = TestBed.inject(Router);

    for (const chemin of [
      '/admin',
      '/admin/utilisateurs',
      '/admin/produits',
      '/admin/commandes',
      '/admin/livraisons',
    ]) {
      await router.navigateByUrl(chemin);
      expect(router.url).toBe(chemin);
    }
  });
});

describe('UtilisateursAdminComponent (task 10.8)', () => {
  it('affiche la liste des comptes et filtre par recherche', async () => {
    await connecterAdmin();
    const fixture = TestBed.createComponent(UtilisateursAdminComponent);
    fixture.detectChanges();

    expect(racine(fixture).querySelectorAll('tbody tr').length).toBe(7);

    const composant = fixture.componentInstance;
    composant.recherche.set('awa');
    fixture.detectChanges();
    expect(racine(fixture).querySelectorAll('tbody tr').length).toBe(1);
    expect(texte(fixture)).toContain('awa.kone@agrimarket.ci');
  });

  it('affiche le détail d’un compte avec l’e-mail en lecture seule', async () => {
    await connecterAdmin();
    const fixture = TestBed.createComponent(UtilisateursAdminComponent);
    fixture.detectChanges();
    const composant = fixture.componentInstance;

    composant.ouvrir(composant.resultats()[0]);
    fixture.detectChanges();

    const email = racine(fixture).querySelector<HTMLInputElement>('#email-detail')!;
    expect(email.readOnly).toBe(true);
    expect(texte(fixture)).toContain('Réinitialiser le mot de passe');
  });
});

describe('ProduitsAdminComponent (task 10.8)', () => {
  it('affiche tous les produits avec prix, unité et stock en lecture seule', async () => {
    await connecterAdmin();
    const fixture = TestBed.createComponent(ProduitsAdminComponent);
    fixture.detectChanges();

    expect(racine(fixture).querySelectorAll('tbody tr').length).toBe(8);
    // Aucun champ de saisie du prix, de l'unité ou du stock.
    expect(racine(fixture).querySelector('input[name="prix"]')).toBeNull();
    expect(racine(fixture).querySelector('input[name="quantiteDisponible"]')).toBeNull();
  });

  it('désactive un produit via le formulaire de modération', async () => {
    const env = await connecterAdmin();
    const fixture = TestBed.createComponent(ProduitsAdminComponent);
    fixture.detectChanges();
    const composant = fixture.componentInstance;

    const produit = composant.produits().find((p: Produit) => p.id === 'prd_tomate')!;
    composant.ouvrirModeration(produit);
    composant.motif.set('Produit non conforme.');
    composant.confirmerModeration(produit);
    fixture.detectChanges();

    const cible = env.persistence.etat().products.find((p) => p.id === 'prd_tomate')!;
    expect(cible.actif).toBe(false);
    expect(cible.moderation?.motif).toBe('Produit non conforme.');
  });
});

describe('CommandesAdminComponent (task 10.8)', () => {
  it('affiche les commandes et filtre par statut', async () => {
    await connecterAdmin();
    const fixture = TestBed.createComponent(CommandesAdminComponent);
    fixture.detectChanges();
    const composant = fixture.componentInstance;

    expect(composant.commandesFiltrees().length).toBe(3);

    composant.filtreStatut.set('EN_LIVRAISON');
    fixture.detectChanges();
    expect(composant.commandesFiltrees().length).toBe(1);
    expect(texte(fixture)).toContain('CMD-');
  });

  it('permet à l’administrateur d’annuler une commande en cours', async () => {
    const env = await connecterAdmin();
    const fixture = TestBed.createComponent(CommandesAdminComponent);
    fixture.detectChanges();
    const composant = fixture.componentInstance;

    const commande = composant.commandesFiltrees().find((c) => c.id === 'cmd_demo_1')!;
    composant.annuler(commande);
    fixture.detectChanges();

    expect(env.persistence.etat().orders.find((o) => o.id === 'cmd_demo_1')!.statut).toBe(
      'ANNULEE',
    );
  });
});

describe('AdministrationComponent — réinitialisation (task 10.8)', () => {
  it('n’agit pas tant que la confirmation n’est pas validée', async () => {
    const env = await connecterAdmin();
    env.persistence.transaction((brouillon) => {
      brouillon.products = [];
    });
    const fixture = TestBed.createComponent(AdministrationComponent);
    fixture.detectChanges();
    const composant = fixture.componentInstance;

    composant.ouvrirConfirmation();
    fixture.detectChanges();
    expect(texte(fixture)).toContain('Confirmez-vous');

    composant.annuler();
    fixture.detectChanges();
    // Données inchangées.
    expect(env.persistence.etat().products.length).toBe(0);
    expect(texte(fixture)).toContain('Réinitialiser les données');
  });

  it('réinitialise après confirmation', async () => {
    const env = await connecterAdmin();
    env.persistence.transaction((brouillon) => {
      brouillon.products = [];
    });
    const fixture = TestBed.createComponent(AdministrationComponent);
    fixture.detectChanges();
    const composant = fixture.componentInstance;

    composant.ouvrirConfirmation();
    await composant.confirmer();
    fixture.detectChanges();

    expect(env.persistence.etat().products.length).toBe(8);
    expect(composant.message()?.toLowerCase()).toContain('réinitialis');
  });

  it('expose un lien vers chaque écran de supervision', async () => {
    await connecterAdmin();
    const fixture = TestBed.createComponent(AdministrationComponent);
    fixture.detectChanges();

    const contenu = texte(fixture);
    expect(contenu).toContain('Comptes');
    expect(contenu).toContain('Produits');
    expect(contenu).toContain('Commandes');
    expect(contenu).toContain('Livraisons');
    expect(contenu).toContain('Tableau de bord global');
    // Le lien vers l'attribution des livreurs est présent.
    const liens = Array.from(racine(fixture).querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(liens).toContain('/admin/livraisons');
  });
});
