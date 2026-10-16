import { TestBed } from '@angular/core/testing';
import { EtatApplication, Livraison } from '../models';
import { IDS_DEMO } from '../data/seed';
import { PersistenceService } from '../persistence/persistence.service';
import { AuthService } from './auth.service';
import { DeliveryService } from './delivery.service';
import { OrderService } from './order.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;
const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const LIVREUR_1 = ['ibrahim.diallo@agrimarket.ci', 'Livre1234'] as const;
const LIVREUR_2 = ['sery.kouassi@agrimarket.ci', 'Livre1234'] as const;

const MAINTENANT = new Date('2026-06-15T09:00:00.000Z');

interface Contexte {
  delivery: DeliveryService;
  order: OrderService;
  env: EnvironnementTest;
  auth: AuthService;
}

async function preparer(email?: string, motDePasse?: string): Promise<Contexte> {
  const env = await configurerTestBedAmorce();
  const auth = TestBed.inject(AuthService);
  if (email && motDePasse) {
    await auth.connecter(email, motDePasse);
  }
  return {
    delivery: TestBed.inject(DeliveryService),
    order: TestBed.inject(OrderService),
    env,
    auth,
  };
}

/** Amène cmd_demo_1 (producteur 1) au statut PRETE. */
function rendrePrete(order: OrderService): void {
  order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
  order.avancer('cmd_demo_1', 'EN_PREPARATION', MAINTENANT);
  order.avancer('cmd_demo_1', 'PRETE', MAINTENANT);
}

function livraison(env: EnvironnementTest, id: string): Livraison {
  return env.persistence.etat().deliveries.find((candidat) => candidat.id === id)!;
}

function statutCommande(env: EnvironnementTest, id: string): string {
  return env.persistence.etat().orders.find((candidat) => candidat.id === id)!.statut;
}

function stock(env: EnvironnementTest, produitId: string): number {
  return env.persistence.etat().products.find((p) => p.id === produitId)!.quantiteDisponible;
}

describe('DeliveryService — création (task 8.1)', () => {
  it('crée une livraison EN_ATTENTE pour une commande confirmée', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    await contexte.auth.connecter(...ADMIN);

    const resultat = contexte.delivery.creer('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(true);
    const creee = resultat.livraison!;
    expect(creee.statut).toBe('EN_ATTENTE');
    expect(creee.livreurId).toBeNull();
    expect(creee.dateAffectation).toBeNull();
    expect(creee.adresseDestination).toBe('Cocody, Abidjan');
    expect(creee.reference).toMatch(/^LIV-\d{8}-\d{4}$/);
    expect(creee.historique.length).toBe(1);
  });

  it('refuse la création sur une commande non éligible', async () => {
    const contexte = await preparer(...ADMIN);

    // cmd_demo_1 est EN_ATTENTE : non éligible.
    const resultat = contexte.delivery.creer('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.livraison).toBeNull();
  });

  it('refuse la création si une livraison active existe déjà', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    // Une livraison active est artificiellement placée sur la commande.
    contexte.env.persistence.transaction((brouillon) => {
      brouillon.deliveries.push({
        id: 'liv_active',
        reference: 'LIV-20260101-9999',
        commandeId: 'cmd_demo_1',
        commandeReference: 'CMD-X',
        livreurId: null,
        adresseDestination: 'Cocody, Abidjan',
        statut: 'EN_ATTENTE',
        dateCreation: MAINTENANT.toISOString(),
        dateAffectation: null,
        dateLivraison: null,
        commentaire: '',
        historique: [],
      });
    });

    const resultat = contexte.delivery.creer('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toContain('active');
  });
});

describe('DeliveryService — attribution (task 8.2)', () => {
  it('attribue un livreur actif et fait passer la commande à EN_LIVRAISON', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;

    const resultat = contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);

    expect(resultat.succes).toBe(true);
    const affectee = livraison(contexte.env, creee.id);
    expect(affectee.statut).toBe('ASSIGNEE');
    expect(affectee.livreurId).toBe(IDS_DEMO.livreur1);
    expect(affectee.dateAffectation).not.toBeNull();
    expect(statutCommande(contexte.env, 'cmd_demo_1')).toBe('EN_LIVRAISON');
  });

  it('refuse un compte qui n’est pas un livreur actif', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;

    const resultat = contexte.delivery.affecter(creee.id, IDS_DEMO.acheteur1, MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(livraison(contexte.env, creee.id).statut).toBe('EN_ATTENTE');
  });

  it('refuse l’attribution si la commande n’est pas prête', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    // cmd_demo_1 confirmée mais pas prête.
    contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;

    const resultat = contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('prête');
    expect(statutCommande(contexte.env, 'cmd_demo_1')).toBe('CONFIRMEE');
  });
});

describe('DeliveryService — transitions du livreur (task 8.3)', () => {
  it('prend en charge puis livre, ce qui livre la commande', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;
    contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);

    await contexte.auth.connecter(...LIVREUR_1);
    expect(contexte.delivery.changerStatut(creee.id, 'EN_COURS', '', MAINTENANT).succes).toBe(true);
    expect(livraison(contexte.env, creee.id).statut).toBe('EN_COURS');
    expect(contexte.delivery.changerStatut(creee.id, 'LIVREE', '', MAINTENANT).succes).toBe(true);

    const livree = livraison(contexte.env, creee.id);
    expect(livree.statut).toBe('LIVREE');
    expect(livree.dateLivraison).not.toBeNull();
    expect(statutCommande(contexte.env, 'cmd_demo_1')).toBe('LIVREE');
  });

  it('déclare un échec avec commentaire et remet la commande à PRETE', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;
    contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);

    await contexte.auth.connecter(...LIVREUR_1);
    const resultat = contexte.delivery.changerStatut(creee.id, 'ECHEC', 'Client injoignable', MAINTENANT);

    expect(resultat.succes).toBe(true);
    const echec = livraison(contexte.env, creee.id);
    expect(echec.statut).toBe('ECHEC');
    expect(echec.commentaire).toBe('Client injoignable');
    expect(statutCommande(contexte.env, 'cmd_demo_1')).toBe('PRETE');
  });

  it('refuse un échec sans commentaire', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;
    contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);

    await contexte.auth.connecter(...LIVREUR_1);
    const resultat = contexte.delivery.changerStatut(creee.id, 'ECHEC', '   ', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('commentaire');
    expect(livraison(contexte.env, creee.id).statut).toBe('ASSIGNEE');
  });

  it('refuse une transition invalide en listant les transitions possibles', async () => {
    const contexte = await preparer(...LIVREUR_1);
    // liv_demo_1 est ASSIGNEE au livreur 1 : ASSIGNEE → LIVREE est interdit.
    const resultat = contexte.delivery.changerStatut('liv_demo_1', 'LIVREE', '', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toContain('EN_COURS');
    expect(livraison(contexte.env, 'liv_demo_1').statut).toBe('ASSIGNEE');
  });

  it('refuse la mise à jour par un autre livreur', async () => {
    const contexte = await preparer(...LIVREUR_2);

    const resultat = contexte.delivery.changerStatut('liv_demo_1', 'EN_COURS', '', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(livraison(contexte.env, 'liv_demo_1').statut).toBe('ASSIGNEE');
  });

  it('refuse la mise à jour depuis un statut final', async () => {
    const contexte = await preparer(...LIVREUR_2);
    // liv_demo_2 est LIVREE.
    const resultat = contexte.delivery.changerStatut('liv_demo_2', 'EN_COURS', '', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('final');
  });
});

describe('DeliveryService — couplage commande ↔ livraison (task 8.4)', () => {
  it('passe la livraison en ECHEC et annule la commande sur annulation administrative', async () => {
    const contexte = await preparer(...ADMIN);
    const mangue = stock(contexte.env, 'prd_mangue');

    const resultat = contexte.order.annuler('cmd_demo_2', MAINTENANT);

    expect(resultat.succes).toBe(true);
    expect(statutCommande(contexte.env, 'cmd_demo_2')).toBe('ANNULEE');
    const echec = livraison(contexte.env, 'liv_demo_1');
    expect(echec.statut).toBe('ECHEC');
    expect(echec.commentaire).toBe('commande annulée');
    // Restitution du stock (cmd_demo_2 portait 20 kg de mangues).
    expect(stock(contexte.env, 'prd_mangue')).toBe(mangue + 20);
  });
});

describe('DeliveryService — cohérence et historique (tasks 8.5, 8.6)', () => {
  it('conserve la cohérence des statuts croisés après sérialisation', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;
    contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);

    const deserialise = JSON.parse(JSON.stringify(contexte.env.persistence.etat())) as EtatApplication;
    const livraisonRelue = deserialise.deliveries.find((l) => l.id === creee.id)!;
    const commandeRelue = deserialise.orders.find((c) => c.id === livraisonRelue.commandeId)!;

    expect(livraisonRelue.statut).toBe('ASSIGNEE');
    expect(commandeRelue.statut).toBe('EN_LIVRAISON');
  });

  it('permet une nouvelle livraison après un échec en conservant l’ancienne', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const premiere = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;
    contexte.delivery.affecter(premiere.id, IDS_DEMO.livreur1, MAINTENANT);

    await contexte.auth.connecter(...LIVREUR_1);
    contexte.delivery.changerStatut(premiere.id, 'ECHEC', 'Adresse introuvable', MAINTENANT);

    await contexte.auth.connecter(...ADMIN);
    const seconde = contexte.delivery.creer('cmd_demo_1', MAINTENANT);

    expect(seconde.succes).toBe(true);
    expect(seconde.livraison!.statut).toBe('EN_ATTENTE');
    // La livraison échouée reste consultable.
    expect(contexte.delivery.pourCommande('cmd_demo_1').length).toBe(2);
    expect(livraison(contexte.env, premiere.id).statut).toBe('ECHEC');
  });

  it('ajoute une entrée d’historique à chaque changement de statut', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    rendrePrete(contexte.order);
    await contexte.auth.connecter(...ADMIN);
    const creee = contexte.delivery.creer('cmd_demo_1', MAINTENANT).livraison!;
    expect(creee.historique.length).toBe(1);

    contexte.delivery.affecter(creee.id, IDS_DEMO.livreur1, MAINTENANT);
    expect(livraison(contexte.env, creee.id).historique.length).toBe(2);

    await contexte.auth.connecter(...LIVREUR_1);
    contexte.delivery.changerStatut(creee.id, 'EN_COURS', '', MAINTENANT);
    contexte.delivery.changerStatut(creee.id, 'LIVREE', '', MAINTENANT);

    const historique = livraison(contexte.env, creee.id).historique;
    expect(historique.length).toBe(4);
    expect(historique[historique.length - 1].nouveauStatut).toBe('LIVREE');
  });

  it('limite les missions du livreur à ses propres livraisons (task 8.3)', async () => {
    const contexte = await preparer(...LIVREUR_1);

    const missions = contexte.delivery.mesMissions();
    expect(missions.length).toBeGreaterThan(0);
    expect(missions.every((mission) => mission.livreurId === IDS_DEMO.livreur1)).toBe(true);
  });

  it('refuse l’accès au suivi d’une livraison d’un autre acheteur (task 8.7)', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    // liv_demo_2 concerne cmd_demo_3 (acheteur 1) : accessible.
    expect(contexte.delivery.peutVoir(livraison(contexte.env, 'liv_demo_2'))).toBe(true);

    await contexte.auth.connecter('adjoua.bamba@agrimarket.ci', 'Achete1234');
    // liv_demo_1 concerne cmd_demo_2 (acheteur 2) : accessible ; liv_demo_2 non.
    expect(contexte.delivery.peutVoir(livraison(contexte.env, 'liv_demo_2'))).toBe(false);
  });
});
