import { TestBed } from '@angular/core/testing';
import { etatVide } from '../config';
import { IDS_DEMO } from '../data/seed';
import { Commande } from '../models';
import {
  indicateursAcheteur,
  indicateursAdmin,
  indicateursLivreur,
  indicateursProducteur,
  serieEvolution,
} from '../tableaux/indicateurs';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { AuthService } from './auth.service';
import { DashboardService } from './dashboard.service';

const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;

const MAINTENANT = new Date('2026-06-15T09:00:00.000Z');

async function preparer(email?: string, motDePasse?: string): Promise<EnvironnementTest> {
  const env = await configurerTestBedAmorce();
  if (email && motDePasse) {
    await TestBed.inject(AuthService).connecter(email, motDePasse);
  }
  return env;
}

/** Fabrique une commande minimale datée, pour tester la série temporelle. */
function commandeLe(dateCreation: string): Commande {
  return {
    id: `cmd_${dateCreation}`,
    reference: 'CMD-TEST-0001',
    acheteurId: IDS_DEMO.acheteur1,
    producteurId: IDS_DEMO.producteur1,
    lignes: [],
    montantProduits: 0,
    fraisLivraison: 0,
    montantTotal: 0,
    adresseLivraison: 'Abidjan',
    statut: 'EN_ATTENTE',
    dateCreation,
    historique: [],
  };
}

describe('indicateursAdmin (task 9.1)', () => {
  it('reflète le jeu de démonstration', async () => {
    const env = await preparer();
    const indicateurs = indicateursAdmin(env.persistence.etat(), MAINTENANT);

    expect(indicateurs.utilisateurs).toBe(7);
    expect(indicateurs.producteurs).toBe(2);
    expect(indicateurs.produitsActifs).toBe(7);
    expect(indicateurs.commandesTotal).toBe(3);
    expect(indicateurs.commandesParStatut.EN_ATTENTE).toBe(1);
    expect(indicateurs.commandesParStatut.EN_LIVRAISON).toBe(1);
    expect(indicateurs.commandesParStatut.LIVREE).toBe(1);
    expect(indicateurs.commandesParStatut.ANNULEE).toBe(0);
    expect(indicateurs.livraisonsEnCours).toBe(1);
    expect(indicateurs.livraisonsTerminees).toBe(1);
  });

  it('égale les comptages des listes', async () => {
    const env = await preparer();
    const etat = env.persistence.etat();
    const indicateurs = indicateursAdmin(etat, MAINTENANT);

    expect(indicateurs.utilisateurs).toBe(etat.users.length);
    expect(indicateurs.producteurs).toBe(
      etat.users.filter((u) => u.role === 'PRODUCTEUR').length,
    );
    expect(indicateurs.produitsActifs).toBe(etat.products.filter((p) => p.actif).length);
    expect(indicateurs.commandesTotal).toBe(etat.orders.length);
  });
});

describe('serieEvolution (task 9.1)', () => {
  it('produit une fenêtre de 14 jours et compte les commandes par jour', () => {
    const serie = serieEvolution(
      [
        commandeLe('2026-06-15T08:00:00.000Z'),
        commandeLe('2026-06-15T18:00:00.000Z'),
        commandeLe('2026-06-14T10:00:00.000Z'),
      ],
      MAINTENANT,
    );

    expect(serie.length).toBe(14);
    expect(serie[serie.length - 1].nombre).toBe(2);
    expect(serie[serie.length - 2].nombre).toBe(1);
    expect(serie[0].nombre).toBe(0);
  });

  it('renvoie quatorze jours à zéro sans commande', () => {
    const serie = serieEvolution([], MAINTENANT);
    expect(serie.length).toBe(14);
    expect(serie.every((point) => point.nombre === 0)).toBe(true);
  });
});

describe('indicateursProducteur (task 9.2)', () => {
  it('limite le périmètre au producteur connecté', async () => {
    const env = await preparer();
    const utilisateur = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.producteur1)!;

    const indicateurs = indicateursProducteur(env.persistence.etat(), utilisateur);

    // awa.kone possède riz, tomate, igname (actifs) et haricot (inactif).
    expect(indicateurs.produitsActifs).toBe(3);
    expect(indicateurs.stockDisponible).toBe(195 + 70 + 120);
    expect(indicateurs.commandesRecues).toBe(1);
    expect(indicateurs.quantitesVendues).toBe(15);
    expect(indicateurs.montantVentes).toBe(9750);
  });

  it('calcule les ventes du second producteur', async () => {
    const env = await preparer();
    const utilisateur = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.producteur2)!;

    const indicateurs = indicateursProducteur(env.persistence.etat(), utilisateur);

    expect(indicateurs.commandesRecues).toBe(2);
    expect(indicateurs.quantitesVendues).toBe(70);
    expect(indicateurs.montantVentes).toBe(29000);
  });

  it('exclut les commandes annulées du montant des ventes', async () => {
    const env = await preparer();
    const utilisateur = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.producteur1)!;
    env.persistence.transaction((brouillon) => {
      const commande = brouillon.orders.find((c) => c.id === 'cmd_demo_1');
      if (commande) {
        commande.statut = 'ANNULEE';
      }
    });

    const indicateurs = indicateursProducteur(env.persistence.etat(), utilisateur);
    expect(indicateurs.montantVentes).toBe(0);
    expect(indicateurs.quantitesVendues).toBe(0);
    // La commande reste comptée comme reçue.
    expect(indicateurs.commandesRecues).toBe(1);
  });
});

describe('indicateursAcheteur (task 9.3)', () => {
  it('définit les commandes en cours hors LIVREE et ANNULEE', async () => {
    const env = await preparer();
    const acheteur1 = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.acheteur1)!;
    const indicateurs = indicateursAcheteur(env.persistence.etat(), acheteur1);

    // cmd_demo_1 (EN_ATTENTE, en cours) et cmd_demo_3 (LIVREE).
    expect(indicateurs.commandesEnCours).toBe(1);
    expect(indicateurs.commandesLivrees).toBe(1);
    expect(indicateurs.commandesTotal).toBe(2);
  });

  it('limite le périmètre à l’acheteur', async () => {
    const env = await preparer();
    const acheteur2 = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.acheteur2)!;
    const indicateurs = indicateursAcheteur(env.persistence.etat(), acheteur2);

    expect(indicateurs.commandesTotal).toBe(1);
    expect(indicateurs.commandesEnCours).toBe(1);
    expect(indicateurs.commandesLivrees).toBe(0);
  });
});

describe('indicateursLivreur (task 9.3)', () => {
  it('ne compte que les livraisons attribuées au livreur', async () => {
    const env = await preparer();
    const livreur1 = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.livreur1)!;
    const livreur2 = env.persistence.etat().users.find((u) => u.id === IDS_DEMO.livreur2)!;

    const i1 = indicateursLivreur(env.persistence.etat(), livreur1);
    expect(i1.missionsAttribuees).toBe(1);
    expect(i1.enCours).toBe(1);
    expect(i1.terminees).toBe(0);
    expect(i1.enEchec).toBe(0);

    const i2 = indicateursLivreur(env.persistence.etat(), livreur2);
    expect(i2.missionsAttribuees).toBe(1);
    expect(i2.enCours).toBe(0);
    expect(i2.terminees).toBe(1);
    expect(i2.enEchec).toBe(0);
  });
});

describe('Indicateurs sur base vide (task 9.4)', () => {
  it('renvoie zéro partout sans donnée', () => {
    const vide = etatVide();
    const admin = indicateursAdmin(vide, MAINTENANT);

    expect(admin.utilisateurs).toBe(0);
    expect(admin.producteurs).toBe(0);
    expect(admin.produitsActifs).toBe(0);
    expect(admin.commandesTotal).toBe(0);
    expect(admin.livraisonsEnCours).toBe(0);
    expect(admin.livraisonsTerminees).toBe(0);
    expect(Object.values(admin.commandesParStatut).every((valeur) => valeur === 0)).toBe(true);

    expect(indicateursProducteur(vide, null).montantVentes).toBe(0);
    expect(indicateursAcheteur(vide, null).commandesTotal).toBe(0);
    expect(indicateursLivreur(vide, null).missionsAttribuees).toBe(0);
  });
});

describe('DashboardService (task 9.1 à 9.3)', () => {
  it('réagit à l’ouverture d’une session et aux actions', async () => {
    const env = await preparer(...PRODUCTEUR_1);
    const dashboard = TestBed.inject(DashboardService);

    expect(dashboard.indicateursProducteur().produitsActifs).toBe(3);

    // Un nouveau produit actif incrémente le compteur.
    env.persistence.transaction((brouillon) => {
      brouillon.products.push({
        id: 'prd_nouveau',
        nom: 'Nouveau produit',
        description: '',
        categorie: 'CEREALES',
        unite: 'KG',
        prix: 100,
        quantiteDisponible: 10,
        localisation: 'Abidjan',
        imageUrl: '',
        producteurId: IDS_DEMO.producteur1,
        actif: true,
        dateCreation: MAINTENANT.toISOString(),
      });
    });

    expect(dashboard.indicateursProducteur().produitsActifs).toBe(4);
    expect(dashboard.indicateursProducteur().stockDisponible).toBe(195 + 70 + 120 + 10);
  });

  it('expose les indicateurs de chaque rôle', async () => {
    await preparer(...ADMIN);
    const dashboard = TestBed.inject(DashboardService);

    expect(dashboard.indicateursAdmin().commandesTotal).toBe(3);
  });

  it('renvoie des zéros pour un rôle sans session', async () => {
    await preparer();
    const dashboard = TestBed.inject(DashboardService);

    expect(dashboard.indicateursAcheteur().commandesTotal).toBe(0);
    expect(dashboard.indicateursLivreur().missionsAttribuees).toBe(0);
  });
});
