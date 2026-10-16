import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { DetailCommandeComponent } from './detail-commande.component';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const ACHETEUR_2 = ['adjoua.bamba@agrimarket.ci', 'Achete1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;

interface Contexte {
  fixture: ComponentFixture<DetailCommandeComponent>;
  env: EnvironnementTest;
}

async function preparer(commandeId: string, email?: string, motDePasse?: string): Promise<Contexte> {
  const env = await configurerTestBedAmorce({
    imports: [DetailCommandeComponent],
    providers: [provideRouter([])],
  });
  if (email && motDePasse) {
    await TestBed.inject(AuthService).connecter(email, motDePasse);
  }
  const fixture = TestBed.createComponent(DetailCommandeComponent);
  fixture.componentRef.setInput('id', commandeId);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, env };
}

function racine(contexte: Contexte): HTMLElement {
  return contexte.fixture.nativeElement as HTMLElement;
}

function texte(contexte: Contexte): string {
  return racine(contexte).textContent ?? '';
}

function libellesBoutons(contexte: Contexte): string[] {
  return Array.from(racine(contexte).querySelectorAll('button')).map((bouton) =>
    (bouton.textContent ?? '').trim(),
  );
}

describe('DetailCommandeComponent (task 7.8)', () => {
  it('affiche toutes les informations et l’historique horodaté', async () => {
    const contexte = await preparer('cmd_demo_1', ...ACHETEUR_1);

    const contenu = texte(contexte);
    const commande = contexte.env.persistence.etat().orders.find((c) => c.id === 'cmd_demo_1')!;
    expect(contenu).toContain(commande.reference);
    expect(contenu).toContain('Riz local de Gagnoa');
    expect(contenu).toContain('Tomates fraîches');
    expect(contenu).toContain('Cocody, Abidjan');
    expect(contenu).toContain('Historique');
    // Un seul événement à la création pour cette commande de démonstration.
    expect(racine(contexte).querySelectorAll('.detail__historique li').length).toBe(
      contexte.env.persistence.etat().orders.find((c) => c.id === 'cmd_demo_1')!.historique.length,
    );
  });

  it('refuse le détail à un tiers', async () => {
    const contexte = await preparer('cmd_demo_1', ...ACHETEUR_2);

    expect(texte(contexte)).toContain('Commande inaccessible');
    expect(racine(contexte).querySelector('.detail')).toBeNull();
  });

  it('affiche un état introuvable pour un identifiant inconnu', async () => {
    const contexte = await preparer('cmd_inexistante', ...ACHETEUR_1);

    expect(texte(contexte)).toContain('Commande introuvable');
  });

  it('ne propose au producteur que les transitions autorisées', async () => {
    const contexte = await preparer('cmd_demo_1', ...PRODUCTEUR_1);
    const boutons = libellesBoutons(contexte);

    expect(boutons).toContain('Passer à « Confirmée »');
    expect(boutons).not.toContain('Passer à « En préparation »');
    expect(boutons).not.toContain('Passer à « Prête »');
    // L'annulation est possible à ce stade pour le producteur.
    expect(boutons).toContain('Annuler la commande');
  });

  it('masque toute action sur une commande au statut final', async () => {
    // cmd_demo_3 est LIVREE : aucune transition possible.
    const contexte = await preparer('cmd_demo_3', ...ACHETEUR_1);
    const boutons = libellesBoutons(contexte);

    expect(boutons.some((libelle) => libelle.startsWith('Passer à'))).toBe(false);
    expect(boutons).not.toContain('Annuler la commande');
    expect(racine(contexte).querySelector('.detail__actions')).toBeNull();
  });

  it('montre le suivi de livraison rattaché à la commande (task 8.7)', async () => {
    // cmd_demo_2 est EN_LIVRAISON et porte liv_demo_1 (Ibrahim Diallo).
    const contexte = await preparer('cmd_demo_2', ...ACHETEUR_2);

    const contenu = texte(contexte);
    expect(contenu).toContain('Livraison');
    expect(contenu).toContain('Ibrahim Diallo');
    expect(racine(contexte).querySelectorAll('.suivi__carte').length).toBe(1);
  });

  it('explique l’attente de livraison quand aucune n’existe encore', async () => {
    // cmd_demo_1 (acheteur 1) n’a pas encore de livraison.
    const contexte = await preparer('cmd_demo_1', ...ACHETEUR_1);

    expect(texte(contexte)).toContain('La livraison sera organisée après préparation');
  });
});
