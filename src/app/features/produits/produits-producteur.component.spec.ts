import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { configurerTestBedAmorce } from '../../testing/environnement';
import { ProduitsProducteurComponent } from './produits-producteur.component';

const ROUTES_TEST = [{ path: '**', component: ProduitsProducteurComponent }];

async function preparer(): Promise<ComponentFixture<ProduitsProducteurComponent>> {
  await configurerTestBedAmorce({
    imports: [ProduitsProducteurComponent],
    providers: [provideRouter(ROUTES_TEST)],
  });
  const fixture = TestBed.createComponent(ProduitsProducteurComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function racine(fixture: ComponentFixture<ProduitsProducteurComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function texte(fixture: ComponentFixture<ProduitsProducteurComponent>): string {
  return racine(fixture).textContent ?? '';
}

function boutonParTexte(
  fixture: ComponentFixture<ProduitsProducteurComponent>,
  libelle: string,
): HTMLButtonElement | undefined {
  return Array.from(racine(fixture).querySelectorAll('button')).find((bouton) =>
    (bouton.textContent ?? '').includes(libelle),
  );
}

function saisir(
  fixture: ComponentFixture<ProduitsProducteurComponent>,
  selecteur: string,
  valeur: string,
  type: 'input' | 'change' = 'input',
): void {
  const champ = racine(fixture).querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    selecteur,
  );
  if (!champ) {
    throw new Error(`Champ introuvable : ${selecteur}`);
  }
  champ.value = valeur;
  champ.dispatchEvent(new Event(type));
  fixture.detectChanges();
}

describe('ProduitsProducteurComponent (task 5.8)', () => {
  it('affiche un état vide invitant à créer un premier produit', async () => {
    await configurerTestBedAmorce({
      imports: [ProduitsProducteurComponent],
      providers: [provideRouter(ROUTES_TEST)],
    });
    // Un nouveau producteur n'a encore publié aucun produit.
    await TestBed.inject(AuthService).inscrire({
      nom: 'Nouveau Producteur',
      email: 'nouveau.producteur@agrimarket.ci',
      motDePasse: 'Motdepasse1',
      role: 'PRODUCTEUR',
      localisation: 'Abidjan',
    });
    const fixture = TestBed.createComponent(ProduitsProducteurComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(texte(fixture)).toContain('Aucun produit publié');
    expect(boutonParTexte(fixture, 'Créer mon premier produit')).toBeTruthy();
  });

  it('liste uniquement les produits du producteur connecté', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    const contenu = texte(fixture);
    expect(contenu).toContain('Riz local de Gagnoa');
    expect(contenu).toContain('Igname Kponan');
    // Les produits du second producteur ne sont pas gérables ici.
    expect(contenu).not.toContain('Mangues Kent');
  });

  it('crée un produit depuis le formulaire', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    boutonParTexte(fixture, 'Nouveau produit')?.click();
    fixture.detectChanges();

    saisir(fixture, '#produit-nom', 'Ananas de Bonoua');
    saisir(fixture, '#produit-description', 'Ananas sucré du Sud-Comoé.');
    saisir(fixture, '#produit-categorie', 'FRUITS', 'change');
    saisir(fixture, '#produit-unite', 'PIECE', 'change');
    saisir(fixture, '#produit-prix', '900');
    saisir(fixture, '#produit-quantite', '40');
    saisir(fixture, '#produit-localisation', 'Bonoua');
    saisir(fixture, '#produit-image', 'https://exemple.test/ananas.jpg');

    boutonParTexte(fixture, 'Publier le produit')?.click();
    fixture.detectChanges();

    expect(texte(fixture)).toContain('Ananas de Bonoua');
    const produits = TestBed.inject(PersistenceService).etat().products;
    expect(produits.some((p) => p.nom === 'Ananas de Bonoua')).toBe(true);
  });

  it('affiche les erreurs de validation d’un formulaire incomplet', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    boutonParTexte(fixture, 'Nouveau produit')?.click();
    fixture.detectChanges();

    boutonParTexte(fixture, 'Publier le produit')?.click();
    fixture.detectChanges();

    const contenu = texte(fixture);
    expect(contenu).toContain('Le nom est obligatoire.');
    expect(contenu).toContain('Choisissez une catégorie');
  });

  it('demande confirmation avant de supprimer, et permet d’annuler', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    boutonParTexte(fixture, 'Supprimer')?.click();
    fixture.detectChanges();
    expect(texte(fixture)).toContain('Supprimer définitivement');

    boutonParTexte(fixture, 'Annuler')?.click();
    fixture.detectChanges();

    expect(texte(fixture)).not.toContain('Supprimer définitivement');
    expect(texte(fixture)).toContain('Riz local de Gagnoa');
  });

  it('supprime un produit après confirmation', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    // Supprime l'igname (aucune commande en cours ne le référence).
    const lignes = Array.from(racine(fixture).querySelectorAll('tbody tr'));
    const ligneIgname = lignes.find((ligne) => (ligne.textContent ?? '').includes('Igname Kponan'));
    Array.from(ligneIgname?.querySelectorAll('button') ?? [])
      .find((b) => (b.textContent ?? '').includes('Supprimer'))
      ?.click();
    fixture.detectChanges();

    boutonParTexte(fixture, 'Confirmer la suppression')?.click();
    fixture.detectChanges();

    expect(texte(fixture)).not.toContain('Igname Kponan');
    expect(
      TestBed.inject(PersistenceService)
        .etat()
        .products.some((p) => p.id === 'prd_igname'),
    ).toBe(false);
  });

  it('refuse la suppression d’un produit engagé dans une commande en cours', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    // prd_riz est référencé par cmd_demo_1 (EN_ATTENTE).
    const lignes = Array.from(racine(fixture).querySelectorAll('tbody tr'));
    const ligneRiz = lignes.find((ligne) => (ligne.textContent ?? '').includes('Riz local de Gagnoa'));
    Array.from(ligneRiz?.querySelectorAll('button') ?? [])
      .find((b) => (b.textContent ?? '').includes('Supprimer'))
      ?.click();
    fixture.detectChanges();

    boutonParTexte(fixture, 'Confirmer la suppression')?.click();
    fixture.detectChanges();

    expect(texte(fixture)).toContain('Riz local de Gagnoa');
    expect(TestBed.inject(NotificationsService).message()).toContain('commande en cours');
  });

  it('ajuste le stock d’un produit', async () => {
    const fixture = await preparer();
    await TestBed.inject(AuthService).connecter('awa.kone@agrimarket.ci', 'Produ1234');
    fixture.detectChanges();

    const lignes = Array.from(racine(fixture).querySelectorAll('tbody tr'));
    const ligneIgname = lignes.find((ligne) => (ligne.textContent ?? '').includes('Igname Kponan'));
    Array.from(ligneIgname?.querySelectorAll('button') ?? [])
      .find((b) => (b.textContent ?? '').includes('Gérer le stock'))
      ?.click();
    fixture.detectChanges();

    const champStock = racine(fixture).querySelector<HTMLInputElement>('input[id^="stock-"]');
    expect(champStock).not.toBeNull();
    saisir(fixture, `#${champStock?.id}`, '42');

    boutonParTexte(fixture, 'Valider')?.click();
    fixture.detectChanges();

    const igname = TestBed.inject(PersistenceService)
      .etat()
      .products.find((p) => p.id === 'prd_igname');
    expect(igname?.quantiteDisponible).toBe(42);
  });
});
