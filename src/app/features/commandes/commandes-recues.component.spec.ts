import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IDS_DEMO } from '../../core/data/seed';
import { AuthService } from '../../core/services/auth.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { CommandesRecuesComponent } from './commandes-recues.component';

const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;

interface Contexte {
  fixture: ComponentFixture<CommandesRecuesComponent>;
  env: EnvironnementTest;
}

async function preparer(email: string, motDePasse: string): Promise<Contexte> {
  const env = await configurerTestBedAmorce({
    imports: [CommandesRecuesComponent],
    providers: [provideRouter([])],
  });
  await TestBed.inject(AuthService).connecter(email, motDePasse);
  const fixture = TestBed.createComponent(CommandesRecuesComponent);
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

function boutons(contexte: Contexte): string[] {
  return Array.from(racine(contexte).querySelectorAll('button')).map((bouton) =>
    (bouton.textContent ?? '').trim(),
  );
}

describe('CommandesRecuesComponent (task 7.8)', () => {
  it('liste les commandes reçues par le producteur', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);

    expect(texte(contexte)).toContain('Commandes reçues');
    // cmd_demo_1 appartient à awa.kone (producteur 1).
    expect(racine(contexte).querySelectorAll('.commande-carte').length).toBe(
      contexte.env.persistence.etat().orders.filter(
        (commande) => commande.producteurId === IDS_DEMO.producteur1,
      ).length,
    );
  });

  it('propose la confirmation et le refus sur une commande en attente', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    const libelles = boutons(contexte);

    expect(libelles).toContain('Confirmée');
    expect(libelles).toContain('Refuser');
  });

  it('affiche un état vide lorsqu’aucune commande n’a été reçue', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    contexte.env.persistence.transaction((brouillon) => {
      brouillon.orders = brouillon.orders.filter(
        (commande) => commande.producteurId !== IDS_DEMO.producteur1,
      );
    });
    contexte.fixture.detectChanges();

    expect(texte(contexte)).toContain('Aucune commande reçue');
  });
});
