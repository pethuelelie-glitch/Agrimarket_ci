import { TestBed } from '@angular/core/testing';
import { Commande } from '../models';
import { IDS_DEMO } from '../data/seed';
import { PersistenceService } from '../persistence/persistence.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { OrderService } from './order.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const ACHETEUR_2 = ['adjoua.bamba@agrimarket.ci', 'Achete1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;
const PRODUCTEUR_2 = ['bakary.traore@agrimarket.ci', 'Produ1234'] as const;
const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const LIVREUR_1 = ['ibrahim.diallo@agrimarket.ci', 'Livre1234'] as const;

const MAINTENANT = new Date('2026-06-15T09:00:00.000Z');

interface Contexte {
  order: OrderService;
  cart: CartService;
  env: EnvironnementTest;
  auth: AuthService;
}

async function preparer(email?: string, motDePasse?: string): Promise<Contexte> {
  const env = await configurerTestBedAmorce();
  const auth = TestBed.inject(AuthService);
  if (email && motDePasse) {
    await auth.connecter(email, motDePasse);
  }
  return { order: TestBed.inject(OrderService), cart: TestBed.inject(CartService), env, auth };
}

function stock(env: EnvironnementTest, produitId: string): number {
  return env.persistence.etat().products.find((produit) => produit.id === produitId)!.quantiteDisponible;
}

function commande(env: EnvironnementTest, id: string): Commande {
  return env.persistence.etat().orders.find((candidat) => candidat.id === id)!;
}

describe('OrderService — création (tasks 7.2, 7.3)', () => {
  it('crée une commande mono-producteur, décrémente le stock et vide le panier', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    const avant = stock(contexte.env, 'prd_riz');
    contexte.cart.ajouter('prd_riz', 2);

    const resultat = contexte.order.validerPanier('Cocody, Abidjan', MAINTENANT);

    expect(resultat.succes).toBe(true);
    expect(resultat.commandes.length).toBe(1);
    const commande = resultat.commandes[0];
    expect(commande.statut).toBe('EN_ATTENTE');
    expect(commande.acheteurId).toBe(IDS_DEMO.acheteur1);
    expect(commande.producteurId).toBe(IDS_DEMO.producteur1);
    expect(commande.reference).toMatch(/^CMD-\d{8}-\d{4}$/);
    expect(commande.lignes[0].prixUnitaire).toBe(450);
    expect(commande.lignes[0].sousTotal).toBe(900);
    expect(commande.adresseLivraison).toBe('Cocody, Abidjan');
    expect(stock(contexte.env, 'prd_riz')).toBe(avant - 2);
    expect(contexte.cart.items()).toEqual([]);
  });

  it('crée une commande par producteur pour un panier multi-producteurs', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    contexte.cart.ajouter('prd_riz', 1); // producteur 1
    contexte.cart.ajouter('prd_mangue', 1); // producteur 2

    const resultat = contexte.order.validerPanier('Yopougon, Abidjan', MAINTENANT);

    expect(resultat.succes).toBe(true);
    expect(resultat.commandes.length).toBe(2);
    const producteurs = resultat.commandes.map((commande) => commande.producteurId).sort();
    expect(producteurs).toEqual([IDS_DEMO.producteur1, IDS_DEMO.producteur2].sort());
    // Frais distincts par producteur (Abidjan 1500, Bouaké 2000).
    const parProducteur = new Map(resultat.commandes.map((c) => [c.producteurId, c.fraisLivraison]));
    expect(parProducteur.get(IDS_DEMO.producteur1)).toBe(1500);
    expect(parProducteur.get(IDS_DEMO.producteur2)).toBe(2000);
    // Deux commandes existaient déjà pour cet acheteur : deux nouvelles s'ajoutent.
    expect(contexte.order.commandes().filter((c) => c.acheteurId === IDS_DEMO.acheteur1).length).toBe(4);
  });

  it('refuse de valider un panier vide', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    const avant = contexte.order.commandes().length;

    const resultat = contexte.order.validerPanier('Cocody, Abidjan', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.commandes.length).toBe(0);
    expect(contexte.order.commandes().length).toBe(avant);
  });

  it('bloque la validation sans adresse de livraison', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    contexte.cart.ajouter('prd_riz', 1);

    const resultat = contexte.order.validerPanier('   ', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('adresse');
    expect(contexte.cart.items().length).toBe(1);
  });

  it('bloque la validation tant qu’un article est indisponible', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    contexte.cart.ajouter('prd_tomate', 5);
    contexte.env.persistence.transaction((brouillon) => {
      const produit = brouillon.products.find((p) => p.id === 'prd_tomate');
      if (produit) {
        produit.quantiteDisponible = 2;
      }
    });

    const resultat = contexte.order.validerPanier('Cocody, Abidjan', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.commandes.length).toBe(0);
  });

  it('conserve le prix unitaire figé et un montant total cohérent (task 7.3)', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    contexte.cart.ajouter('prd_riz', 2);
    const resultat = contexte.order.validerPanier('Cocody, Abidjan', MAINTENANT);
    const creee = resultat.commandes[0];

    expect(creee.montantTotal).toBe(creee.montantProduits + creee.fraisLivraison);

    // Le producteur modifie ensuite le prix : la commande ne change pas.
    contexte.env.persistence.transaction((brouillon) => {
      const produit = brouillon.products.find((p) => p.id === 'prd_riz');
      if (produit) {
        produit.prix = 9999;
      }
    });

    expect(commande(contexte.env, creee.id).lignes[0].prixUnitaire).toBe(450);
    expect(commande(contexte.env, creee.id).montantProduits).toBe(900);
  });
});

describe('OrderService — transitions (task 7.4)', () => {
  it('confirme puis prépare puis rend prête une commande (producteur)', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);

    expect(contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT).succes).toBe(true);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('CONFIRMEE');
    expect(contexte.order.avancer('cmd_demo_1', 'EN_PREPARATION', MAINTENANT).succes).toBe(true);
    expect(contexte.order.avancer('cmd_demo_1', 'PRETE', MAINTENANT).succes).toBe(true);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('PRETE');
    // Historique horodaté : création + 3 transitions.
    expect(commande(contexte.env, 'cmd_demo_1').historique.length).toBe(4);
  });

  it('refuse une transition invalide en listant les transitions possibles', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);

    const resultat = contexte.order.avancer('cmd_demo_1', 'PRETE', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toContain('CONFIRMEE');
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('EN_ATTENTE');
  });

  it('refuse une transition à un rôle non autorisé', async () => {
    const contexte = await preparer(...ACHETEUR_1);

    const resultat = contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('EN_ATTENTE');
  });

  it('refuse une transition depuis un statut final', async () => {
    const contexte = await preparer(...ADMIN);

    const resultat = contexte.order.avancer('cmd_demo_3', 'EN_PREPARATION', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_3').statut).toBe('LIVREE');
  });

  it('refuse une transition manuelle vers EN_LIVRAISON (task 7.4)', async () => {
    const contexte = await preparer(...PRODUCTEUR_2);
    // cmd_demo_2 est déjà EN_LIVRAISON ; on fabrique une commande PRETE à part.
    contexte.env.persistence.transaction((brouillon) => {
      const cible = brouillon.orders.find((candidat) => candidat.id === 'cmd_demo_2');
      if (cible) {
        cible.statut = 'PRETE';
      }
    });

    const resultat = contexte.order.avancer('cmd_demo_2', 'EN_LIVRAISON', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_2').statut).toBe('PRETE');
  });
});

describe('OrderService — annulation (task 7.5)', () => {
  it('restaure exactement le stock à l’annulation par l’acheteur', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    const riz = stock(contexte.env, 'prd_riz');
    const tomate = stock(contexte.env, 'prd_tomate');

    const resultat = contexte.order.annuler('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(true);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('ANNULEE');
    expect(stock(contexte.env, 'prd_riz')).toBe(riz + 5);
    expect(stock(contexte.env, 'prd_tomate')).toBe(tomate + 10);
  });

  it('refuse l’annulation par l’acheteur après préparation', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    contexte.order.avancer('cmd_demo_1', 'EN_PREPARATION', MAINTENANT);
    const riz = stock(contexte.env, 'prd_riz');

    await contexte.auth.connecter(...ACHETEUR_1);
    const resultat = contexte.order.annuler('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('EN_PREPARATION');
    expect(stock(contexte.env, 'prd_riz')).toBe(riz);
  });

  it('refuse l’annulation d’une commande livrée', async () => {
    const contexte = await preparer(...ADMIN);
    const mais = stock(contexte.env, 'prd_mais');

    const resultat = contexte.order.annuler('cmd_demo_3', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_3').statut).toBe('LIVREE');
    expect(stock(contexte.env, 'prd_mais')).toBe(mais);
  });

  it('ne restitue pas le stock une seconde fois (idempotence)', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    contexte.order.annuler('cmd_demo_1', MAINTENANT);
    const apres = stock(contexte.env, 'prd_riz');

    const second = contexte.order.annuler('cmd_demo_1', MAINTENANT);

    expect(second.succes).toBe(false);
    expect(stock(contexte.env, 'prd_riz')).toBe(apres);
  });

  it('autorise l’administrateur à annuler une commande en préparation', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    contexte.order.avancer('cmd_demo_1', 'EN_PREPARATION', MAINTENANT);

    await contexte.auth.connecter(...ADMIN);
    const resultat = contexte.order.annuler('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(true);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('ANNULEE');
  });

  it('refuse à un producteur d’annuler la commande d’un autre', async () => {
    const contexte = await preparer(...PRODUCTEUR_2);

    const resultat = contexte.order.annuler('cmd_demo_1', MAINTENANT);

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_1').statut).toBe('EN_ATTENTE');
  });
});

describe('OrderService — adresse (task 7.6)', () => {
  it('modifie l’adresse d’une commande EN_ATTENTE', async () => {
    const contexte = await preparer(...ACHETEUR_1);

    const resultat = contexte.order.modifierAdresse('cmd_demo_1', 'Marcory, Abidjan');

    expect(resultat.succes).toBe(true);
    expect(commande(contexte.env, 'cmd_demo_1').adresseLivraison).toBe('Marcory, Abidjan');
  });

  it('refuse la modification de l’adresse après préparation', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    contexte.order.avancer('cmd_demo_1', 'CONFIRMEE', MAINTENANT);
    contexte.order.avancer('cmd_demo_1', 'EN_PREPARATION', MAINTENANT);

    await contexte.auth.connecter(...ACHETEUR_1);
    const resultat = contexte.order.modifierAdresse('cmd_demo_1', 'Treichville, Abidjan');

    expect(resultat.succes).toBe(false);
    expect(commande(contexte.env, 'cmd_demo_1').adresseLivraison).toBe('Cocody, Abidjan');
  });
});

describe('OrderService — accès au détail (task 7.7)', () => {
  it('autorise l’acheteur propriétaire et refuse les autres', async () => {
    const contexte = await preparer(...ACHETEUR_1);
    const cmd1 = commande(contexte.env, 'cmd_demo_1');
    expect(contexte.order.peutVoir(cmd1)).toBe(true);

    await contexte.auth.connecter(...ACHETEUR_2);
    expect(contexte.order.peutVoir(cmd1)).toBe(false);
  });

  it('autorise le producteur concerné et refuse l’autre producteur', async () => {
    const contexte = await preparer(...PRODUCTEUR_1);
    const cmd1 = commande(contexte.env, 'cmd_demo_1');
    expect(contexte.order.peutVoir(cmd1)).toBe(true);

    await contexte.auth.connecter(...PRODUCTEUR_2);
    expect(contexte.order.peutVoir(cmd1)).toBe(false);
  });

  it('autorise l’administrateur et refuse le livreur', async () => {
    const contexte = await preparer(...ADMIN);
    expect(contexte.order.peutVoir(commande(contexte.env, 'cmd_demo_1'))).toBe(true);

    await contexte.auth.connecter(...LIVREUR_1);
    expect(contexte.order.peutVoir(commande(contexte.env, 'cmd_demo_1'))).toBe(false);
  });
});
