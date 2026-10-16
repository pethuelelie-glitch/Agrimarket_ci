import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { SupervisionLivraisonsComponent } from './supervision-livraisons.component';

const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;

const MAINTENANT = new Date('2026-06-15T09:00:00.000Z');

interface Contexte {
  fixture: ComponentFixture<SupervisionLivraisonsComponent>;
  env: EnvironnementTest;
}

async function preparer(): Promise<Contexte> {
  const env = await configurerTestBedAmorce({
    imports: [SupervisionLivraisonsComponent],
    providers: [provideRouter([])],
  });
  await TestBed.inject(AuthService).connecter(...ADMIN);
  const fixture = TestBed.createComponent(SupervisionLivraisonsComponent);
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

function boutonParTexte(contexte: Contexte, libelle: string): HTMLButtonElement | undefined {
  return Array.from(racine(contexte).querySelectorAll('button')).find((bouton) =>
    (bouton.textContent ?? '').includes(libelle),
  );
}

describe('SupervisionLivraisonsComponent (task 8.7)', () => {
  it('affiche la supervision complète pour l’administrateur', async () => {
    const contexte = await preparer();
    const contenu = texte(contexte);

    expect(contenu).toContain('Commandes à livrer');
    expect(contenu).toContain('Toutes les livraisons');
    // Les deux livraisons de démonstration apparaissent.
    expect(
      racine(contexte).querySelectorAll('.supervision__bloc .tableau tbody tr').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('signale l’absence de livreur disponible', async () => {
    const contexte = await preparer();
    contexte.env.persistence.transaction((brouillon) => {
      brouillon.users = brouillon.users.map((utilisateur) =>
        utilisateur.role === 'LIVREUR' ? { ...utilisateur, actif: false } : utilisateur,
      );
      // Une livraison en attente d'attribution, mais aucun livreur actif.
      brouillon.deliveries = [
        {
          id: 'liv_attente',
          reference: 'LIV-20260101-0001',
          commandeId: 'cmd_demo_1',
          commandeReference: 'CMD-20260601-0001',
          livreurId: null,
          adresseDestination: 'Cocody, Abidjan',
          statut: 'EN_ATTENTE',
          dateCreation: MAINTENANT.toISOString(),
          dateAffectation: null,
          dateLivraison: null,
          commentaire: '',
          historique: [],
        },
      ];
    });
    contexte.fixture.detectChanges();

    expect(texte(contexte)).toContain('Aucun livreur disponible');
  });

  it('crée une livraison depuis une commande éligible', async () => {
    const contexte = await preparer();
    // cmd_demo_1 doit être confirmée pour être éligible.
    await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    TestBed.inject(OrderService).avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    await TestBed.inject(AuthService).connecter(...ADMIN);
    contexte.fixture.detectChanges();

    const avant = contexte.env.persistence.etat().deliveries.length;
    boutonParTexte(contexte, 'Créer une livraison')?.click();
    contexte.fixture.detectChanges();

    expect(contexte.env.persistence.etat().deliveries.length).toBe(avant + 1);
    const creee = contexte.env.persistence
      .etat()
      .deliveries.find((livraison) => livraison.commandeId === 'cmd_demo_1')!;
    expect(creee.statut).toBe('EN_ATTENTE');
    expect(creee.livreurId).toBeNull();
  });

  it('attribue un livreur actif à une livraison en attente', async () => {
    const contexte = await preparer();
    await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    TestBed.inject(OrderService).avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    TestBed.inject(OrderService).avancer('cmd_demo_1', 'EN_PREPARATION', MAINTENANT);
    TestBed.inject(OrderService).avancer('cmd_demo_1', 'PRETE', MAINTENANT);
    await TestBed.inject(AuthService).connecter(...ADMIN);

    // Création puis attribution via l'interface.
    contexte.fixture.detectChanges();
    boutonParTexte(contexte, 'Créer une livraison')?.click();
    contexte.fixture.detectChanges();
    boutonParTexte(contexte, 'Attribuer')?.click();
    contexte.fixture.detectChanges();

    const affectee = contexte.env.persistence
      .etat()
      .deliveries.find((livraison) => livraison.commandeId === 'cmd_demo_1')!;
    expect(affectee.statut).toBe('ASSIGNEE');
    expect(affectee.livreurId).not.toBeNull();
  });
});
