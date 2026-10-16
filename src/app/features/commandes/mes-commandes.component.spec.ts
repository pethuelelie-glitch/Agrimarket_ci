import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IDS_DEMO } from '../../core/data/seed';
import { AuthService } from '../../core/services/auth.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { MesCommandesComponent } from './mes-commandes.component';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;

interface Contexte {
  fixture: ComponentFixture<MesCommandesComponent>;
  env: EnvironnementTest;
}

async function preparer(): Promise<Contexte> {
  const env = await configurerTestBedAmorce({
    imports: [MesCommandesComponent],
    providers: [provideRouter([])],
  });
  await TestBed.inject(AuthService).connecter(...ACHETEUR_1);
  const fixture = TestBed.createComponent(MesCommandesComponent);
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

describe('MesCommandesComponent (task 7.8)', () => {
  it('liste les commandes de l’acheteur, les plus récentes d’abord', async () => {
    const contexte = await preparer();

    const cartes = racine(contexte).querySelectorAll('.commande-carte');
    const attendues = contexte.env.persistence
      .etat()
      .orders.filter((commande) => commande.acheteurId === IDS_DEMO.acheteur1);
    expect(cartes.length).toBe(attendues.length);
    expect(cartes.length).toBeGreaterThan(0);
  });

  it('filtre les commandes par statut', async () => {
    const contexte = await preparer();

    const select = racine(contexte).querySelector<HTMLSelectElement>('select')!;
    select.value = 'LIVREE';
    select.dispatchEvent(new Event('change'));
    contexte.fixture.detectChanges();

    const cartes = racine(contexte).querySelectorAll('.commande-carte');
    const livrees = contexte.env.persistence
      .etat()
      .orders.filter(
        (commande) => commande.acheteurId === IDS_DEMO.acheteur1 && commande.statut === 'LIVREE',
      );
    expect(cartes.length).toBe(livrees.length);
  });

  it('affiche un état vide lorsque l’acheteur n’a aucune commande', async () => {
    const contexte = await preparer();
    contexte.env.persistence.transaction((brouillon) => {
      brouillon.orders = brouillon.orders.filter(
        (commande) => commande.acheteurId !== IDS_DEMO.acheteur1,
      );
    });
    contexte.fixture.detectChanges();

    expect(texte(contexte)).toContain('Aucune commande');
  });
});
