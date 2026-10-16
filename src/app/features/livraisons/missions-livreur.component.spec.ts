import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IDS_DEMO } from '../../core/data/seed';
import { AuthService } from '../../core/services/auth.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { MissionsLivreurComponent } from './missions-livreur.component';

const LIVREUR_1 = ['ibrahim.diallo@agrimarket.ci', 'Livre1234'] as const;
const LIVREUR_2 = ['sery.kouassi@agrimarket.ci', 'Livre1234'] as const;

interface Contexte {
  fixture: ComponentFixture<MissionsLivreurComponent>;
  env: EnvironnementTest;
}

async function preparer(email: string, motDePasse: string): Promise<Contexte> {
  const env = await configurerTestBedAmorce({
    imports: [MissionsLivreurComponent],
    providers: [provideRouter([])],
  });
  await TestBed.inject(AuthService).connecter(email, motDePasse);
  const fixture = TestBed.createComponent(MissionsLivreurComponent);
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

describe('MissionsLivreurComponent (task 8.7)', () => {
  it('groupe les missions du livreur par statut', async () => {
    const contexte = await preparer(...LIVREUR_1);

    const contenu = texte(contexte);
    expect(contenu).toContain('À prendre en charge');
    expect(contenu).toContain('En cours');
    expect(contenu).toContain('Terminées');
    // liv_demo_1 (ASSIGNEE) est attribuée à Ibrahim Diallo.
    expect(racine(contexte).querySelectorAll('.mission-carte').length).toBe(
      contexte.env.persistence
        .etat()
        .deliveries.filter((livraison) => livraison.livreurId === IDS_DEMO.livreur1).length,
    );
    expect(racine(contexte).querySelectorAll('.mission-carte__actions button').length).toBeGreaterThan(
      0,
    );
  });

  it('n’affiche aucune action sur une mission terminée', async () => {
    const contexte = await preparer(...LIVREUR_2);
    // Seule liv_demo_2 (LIVREE) est attribuée à Sery Kouassi.
    expect(racine(contexte).querySelectorAll('.mission-carte__actions').length).toBe(0);
    expect(texte(contexte)).toContain('Terminées');
  });

  it('affiche un état vide sans mission', async () => {
    const contexte = await preparer(...LIVREUR_1);
    contexte.env.persistence.transaction((brouillon) => {
      brouillon.deliveries = brouillon.deliveries.filter(
        (livraison) => livraison.livreurId !== IDS_DEMO.livreur1,
      );
    });
    contexte.fixture.detectChanges();

    expect(texte(contexte)).toContain('Aucune mission');
  });
});
