import { Component } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationsService } from './core/services/notifications.service';
import { configurerTestBedAmorce } from './testing/environnement';

@Component({ selector: 'app-page-vide', template: '' })
class PageVideComponent {}

async function preparer(email?: string, motDePasse = ''): Promise<ComponentFixture<App>> {
  await configurerTestBedAmorce({
    imports: [App],
    providers: [provideRouter([{ path: '**', component: PageVideComponent }])],
  });
  if (email) {
    await TestBed.inject(AuthService).connecter(email, motDePasse);
  }
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function texte(fixture: ComponentFixture<App>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function liensNavigation(fixture: ComponentFixture<App>): string[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.navigation__lien'),
  ).map((lien) => lien.textContent?.trim() ?? '');
}

describe('App — coquille et navigation (tasks 4.1 / 4.2)', () => {
  it('affiche la marque et le pied de page', async () => {
    const fixture = await preparer();

    expect(texte(fixture)).toContain('AgriMarket CI');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-pied-de-page')).not.toBeNull();
  });

  it('propose Catalogue, Aide, Connexion et Inscription à un visiteur', async () => {
    const fixture = await preparer();
    const liens = liensNavigation(fixture);

    expect(liens).toContain('Catalogue');
    expect(liens).toContain('Aide');
    expect(texte(fixture)).toContain('Connexion');
    expect(texte(fixture)).toContain('Inscription');
    expect(liens).not.toContain('Mon tableau de bord');
  });

  it('affiche le tableau de bord et la déconnexion pour un acheteur, sans Inscription', async () => {
    const fixture = await preparer('koffi.yao@agrimarket.ci', 'Achete1234');
    const contenu = texte(fixture);

    expect(contenu).toContain('Mon tableau de bord');
    expect(contenu).toContain('Déconnexion');
    expect(contenu).not.toContain('Inscription');
    expect(liensNavigation(fixture)).toContain('Mon panier');
    expect(liensNavigation(fixture)).toContain('Mes commandes');
  });

  it('n’expose pas les entrées d’administration ni producteur à un acheteur (task 4.2)', async () => {
    const fixture = await preparer('koffi.yao@agrimarket.ci', 'Achete1234');
    const contenu = texte(fixture);

    expect(contenu).not.toContain('Comptes');
    expect(contenu).not.toContain('Mes produits');
    expect(contenu).not.toContain('Mes missions');
  });

  it('expose les entrées d’administration à l’administrateur', async () => {
    const fixture = await preparer('admin@agrimarket.ci', 'Admin1234');
    const liens = liensNavigation(fixture);

    expect(liens).toContain('Comptes');
    expect(liens).toContain('Produits');
    expect(liens).toContain('Commandes');
    expect(liens).toContain('Livraisons');
  });

  it('expose les entrées producteur au producteur', async () => {
    const fixture = await preparer('awa.kone@agrimarket.ci', 'Produ1234');
    const liens = liensNavigation(fixture);

    expect(liens).toContain('Mes produits');
    expect(liens).toContain('Commandes reçues');
  });

  it('replie et déplie le menu (task 4.1)', async () => {
    const fixture = await preparer();
    const bouton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.entete__bascule',
    );
    expect(bouton?.getAttribute('aria-expanded')).toBe('false');

    bouton?.click();
    fixture.detectChanges();
    expect(bouton?.getAttribute('aria-expanded')).toBe('true');

    bouton?.click();
    fixture.detectChanges();
    expect(bouton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('affiche puis efface un message d’information', async () => {
    const fixture = await preparer();
    const notifications = TestBed.inject(NotificationsService);

    notifications.informer('Accès refusé : rôle insuffisant.');
    fixture.detectChanges();
    expect(texte(fixture)).toContain('Accès refusé');

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.annonce__fermer')?.click();
    fixture.detectChanges();
    expect(texte(fixture)).not.toContain('Accès refusé');
  });

  it('affiche le nombre d’articles du panier dans la navigation (task 6.7)', async () => {
    const fixture = await preparer('koffi.yao@agrimarket.ci', 'Achete1234');
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.navigation__badge')).toBeNull();

    TestBed.inject(CartService).ajouter('prd_riz', 2);
    fixture.detectChanges();

    expect(racine.querySelector('.navigation__badge')?.textContent?.trim()).toBe('2');
  });
});
