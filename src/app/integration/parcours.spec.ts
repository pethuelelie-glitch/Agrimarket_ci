import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from '../app';
import { fraisLivraison, etatVide } from '../core/config';
import { IDS_DEMO } from '../core/data/seed';
import { ROLES_INSCRIPTION, EtatApplication, Utilisateur } from '../core/models';
import { InMemoryAdapter } from '../core/persistence/in-memory-adapter';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { CatalogueService } from '../core/services/catalogue.service';
import { DashboardService } from '../core/services/dashboard.service';
import { DeliveryService } from '../core/services/delivery.service';
import { OrderService } from '../core/services/order.service';
import {
  configurerTestBed,
  configurerTestBedAmorce,
  EnvironnementTest,
} from '../testing/environnement';

@Component({ selector: 'app-page-vide', template: '' })
class PageVideComponent {}

const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;
const PRODUCTEUR_2 = ['bakary.traore@agrimarket.ci', 'Produ1234'] as const;
const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const LIVREUR_1 = ['ibrahim.diallo@agrimarket.ci', 'Livre1234'] as const;
const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;

function produitDe(env: EnvironnementTest, produitId: string) {
  return env.persistence.etat().products.find((produit) => produit.id === produitId)!;
}

describe('Parcours — inscription, achat et livraison (task 11.1)', () => {
  it('mène un nouvel acheteur de l’inscription à la livraison', async () => {
    const env = await configurerTestBedAmorce();
    const auth = TestBed.inject(AuthService);
    const cart = TestBed.inject(CartService);
    const orders = TestBed.inject(OrderService);
    const delivery = TestBed.inject(DeliveryService);

    // 1. Inscription d'un acheteur.
    const inscription = await auth.inscrire({
      nom: 'Nouvel Acheteur',
      email: 'nouvel.acheteur@agrimarket.ci',
      motDePasse: 'Achete1234',
      role: 'ACHETEUR',
      localisation: 'Abidjan',
    });
    expect(inscription.succes).toBe(true);
    const nouvelAcheteurId = auth.utilisateurCourant()!.id;

    // 2. Achat : ajout au panier puis validation.
    expect(cart.ajouter('prd_riz', 3).succes).toBe(true);
    const validation = orders.validerPanier('Cocody, Abidjan');
    expect(validation.succes).toBe(true);
    expect(validation.commandes.length).toBe(1);
    const commandeId = validation.commandes[0].id;
    expect(orders.trouver(commandeId)!.statut).toBe('EN_ATTENTE');
    // Le panier est vidé après validation.
    expect(env.persistence.etat().carts[nouvelAcheteurId]).toBeUndefined();

    // 3. Cycle producteur : confirmation → préparation → prête.
    await auth.connecter(...PRODUCTEUR_1);
    expect(orders.avancer(commandeId, 'CONFIRMEE').succes).toBe(true);
    expect(orders.avancer(commandeId, 'EN_PREPARATION').succes).toBe(true);
    expect(orders.avancer(commandeId, 'PRETE').succes).toBe(true);

    // 4. Administrateur : création et affectation de la livraison.
    await auth.connecter(...ADMIN);
    const creation = delivery.creer(commandeId);
    expect(creation.succes).toBe(true);
    const livraisonId = creation.livraison!.id;
    expect(delivery.affecter(livraisonId, IDS_DEMO.livreur1).succes).toBe(true);
    expect(orders.trouver(commandeId)!.statut).toBe('EN_LIVRAISON');

    // 5. Livreur : en cours puis livrée.
    await auth.connecter(...LIVREUR_1);
    expect(delivery.changerStatut(livraisonId, 'EN_COURS').succes).toBe(true);
    expect(delivery.changerStatut(livraisonId, 'LIVREE').succes).toBe(true);

    // 6. Cohérence finale commande ↔ livraison.
    expect(orders.trouver(commandeId)!.statut).toBe('LIVREE');
    expect(delivery.trouver(livraisonId)!.statut).toBe('LIVREE');
  });
});

describe('Parcours — cycle producteur (task 11.1)', () => {
  it('publie un produit, reçoit une commande puis la mène jusqu’à PRETE', async () => {
    const env = await configurerTestBedAmorce();
    const auth = TestBed.inject(AuthService);
    const catalogue = TestBed.inject(CatalogueService);
    const cart = TestBed.inject(CartService);
    const orders = TestBed.inject(OrderService);

    await auth.connecter(...PRODUCTEUR_1);
    const creation = catalogue.creer({
      nom: 'Aubergine locale',
      description: 'Aubergines fraîches du jour.',
      categorie: 'LEGUMES',
      prix: 500,
      unite: 'KG',
      quantiteDisponible: 40,
      localisation: 'Abidjan',
      imageUrl: 'https://exemple.ci/aubergine.jpg',
    });
    expect(creation.succes).toBe(true);
    const produit = env.persistence.etat().products.find((p) => p.nom === 'Aubergine locale')!;
    expect(produit.actif).toBe(true);

    await auth.connecter(...ACHETEUR_1);
    expect(cart.ajouter(produit.id, 5).succes).toBe(true);
    const validation = orders.validerPanier('Abidjan');
    const commandeId = validation.commandes[0].id;

    await auth.connecter(...PRODUCTEUR_1);
    expect(orders.avancer(commandeId, 'CONFIRMEE').succes).toBe(true);
    expect(orders.avancer(commandeId, 'EN_PREPARATION').succes).toBe(true);
    expect(orders.avancer(commandeId, 'PRETE').succes).toBe(true);
    expect(orders.trouver(commandeId)!.statut).toBe('PRETE');
  });
});

describe('Parcours — affectation et mise à jour par le livreur (task 11.1)', () => {
  it('fait évoluer une livraison assignée jusqu’à LIVREE', async () => {
    await configurerTestBedAmorce();
    const auth = TestBed.inject(AuthService);
    const orders = TestBed.inject(OrderService);
    const delivery = TestBed.inject(DeliveryService);

    await auth.connecter(...LIVREUR_1);
    const livraison = delivery.pourCommande('cmd_demo_2')[0];
    expect(livraison.statut).toBe('ASSIGNEE');

    expect(delivery.changerStatut(livraison.id, 'EN_COURS').succes).toBe(true);
    expect(delivery.changerStatut(livraison.id, 'LIVREE').succes).toBe(true);
    expect(orders.trouver('cmd_demo_2')!.statut).toBe('LIVREE');
  });
});

describe('Parcours multi-producteurs (task 11.2)', () => {
  it('éclate le panier, décrémente le stock, restitue à l’annulation et concorde avec les compteurs', async () => {
    const env = await configurerTestBedAmorce();
    const auth = TestBed.inject(AuthService);
    const cart = TestBed.inject(CartService);
    const orders = TestBed.inject(OrderService);
    const dashboard = TestBed.inject(DashboardService);

    const rizAvant = produitDe(env, 'prd_riz').quantiteDisponible; // producteur 1
    const mangueAvant = produitDe(env, 'prd_mangue').quantiteDisponible; // producteur 2

    await auth.connecter(...ACHETEUR_1);
    expect(cart.ajouter('prd_riz', 4).succes).toBe(true);
    expect(cart.ajouter('prd_mangue', 6).succes).toBe(true);

    const validation = orders.validerPanier('Abidjan');
    expect(validation.succes).toBe(true);
    // Une commande par producteur.
    expect(validation.commandes.length).toBe(2);
    expect(new Set(validation.commandes.map((c) => c.producteurId)).size).toBe(2);

    // Stock décrémenté de façon cohérente.
    expect(produitDe(env, 'prd_riz').quantiteDisponible).toBe(rizAvant - 4);
    expect(produitDe(env, 'prd_mangue').quantiteDisponible).toBe(mangueAvant - 6);

    // Annulation de la commande du producteur 1 : stock restitué, l'autre intact.
    const commandeRiz = validation.commandes.find(
      (commande) => commande.producteurId === IDS_DEMO.producteur1,
    )!;
    expect(orders.annuler(commandeRiz.id).succes).toBe(true);
    expect(produitDe(env, 'prd_riz').quantiteDisponible).toBe(rizAvant);
    expect(produitDe(env, 'prd_mangue').quantiteDisponible).toBe(mangueAvant - 6);

    // Les compteurs du tableau de bord concordent avec les listes.
    const indicateursAcheteur = dashboard.indicateursAcheteur();
    expect(indicateursAcheteur.commandesTotal).toBe(orders.mesCommandes().length);
    // cmd_demo_1 (EN_ATTENTE) + commande mangue (EN_ATTENTE) = 2 en cours.
    expect(indicateursAcheteur.commandesEnCours).toBe(2);
    // cmd_demo_3 était déjà livrée, la commande riz est annulée.
    expect(indicateursAcheteur.commandesLivrees).toBe(1);

    await auth.connecter(...ADMIN);
    const indicateursAdmin = dashboard.indicateursAdmin();
    expect(indicateursAdmin.commandesTotal).toBe(env.persistence.etat().orders.length);
    expect(indicateursAdmin.commandesTotal).toBe(5); // 3 de démonstration + 2 créées

    // Le producteur 2 voit sa commande dans ses commandes reçues.
    await auth.connecter(...PRODUCTEUR_2);
    expect(
      orders.mesCommandes().some((commande) => commande.producteurId === IDS_DEMO.producteur2),
    ).toBe(true);
  });
});

describe('Robustesse de bout en bout (task 11.3)', () => {
  it('affiche la coquille sur un document racine corrompu, sans écran blanc', () => {
    const adaptateur = new InMemoryAdapter('{ ceci n’est pas du JSON');
    const env = configurerTestBed({
      adaptateur,
      imports: [App],
      providers: [provideRouter([{ path: '**', component: PageVideComponent }])],
    });

    expect(env.persistence.avertissement()).toContain('illisibles');
    expect(env.persistence.etat().users).toEqual([]);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const contenu = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(contenu).toContain('AgriMarket CI');
  });

  it('ignore une version de schéma inconnue sans perdre la coquille', () => {
    const etat = etatVide();
    const inconnu = { ...etat, schemaVersion: 99 };
    const adaptateur = new InMemoryAdapter(JSON.stringify(inconnu));
    const env = configurerTestBed({ adaptateur });

    expect(env.persistence.etat().users).toEqual([]);
    expect(env.persistence.avertissement()).toContain('99');
    expect(adaptateur.brut).toBeNull();
  });

  it('conserve les données valides en mémoire quand l’écriture échoue (quota)', async () => {
    const env = await configurerTestBedAmorce();
    const orders = TestBed.inject(OrderService);
    const auth = TestBed.inject(AuthService);

    await auth.connecter(...ACHETEUR_1);
    TestBed.inject(CartService).ajouter('prd_riz', 2);

    // L'écriture échoue désormais (quota dépassé simulé).
    env.adaptateur.echecEcriture = true;
    const validation = orders.validerPanier('Abidjan');

    expect(validation.succes).toBe(true);
    expect(orders.trouver(validation.commandes[0].id)).not.toBeNull();
    // Le stock valide n'est pas perdu et l'utilisateur est averti.
    expect(produitDe(env, 'prd_riz').quantiteDisponible).toBe(195 - 2);
    expect(env.persistence.avertissement()).toContain('enregistrement local a échoué');
  });

  it('traite une session illisible comme une déconnexion', () => {
    const etat: EtatApplication = etatVide();
    etat.users = [utilisateurDeTest()];
    etat.session = {
      userId: 'usr_fantome',
      role: 'ROLE_INCONNU' as never,
      ouvertLe: '2026-01-01T00:00:00.000Z',
    };
    const adaptateur = new InMemoryAdapter(JSON.stringify(etat));

    const env = configurerTestBed({ adaptateur });
    const auth = TestBed.inject(AuthService);

    expect(auth.estConnecte()).toBe(false);
    expect(env.persistence.etat().session).toBeNull();
  });
});

describe('Points de revue fonctionnelle (task 11.4)', () => {
  it('applique la grille des frais de livraison (D7)', () => {
    expect(fraisLivraison('Abidjan')).toBe(1500);
    expect(fraisLivraison('Bouaké')).toBe(2000);
    expect(fraisLivraison('Odienné')).toBe(2500);
  });

  it('garantit un rôle unique par compte et refuse ADMIN à l’inscription', () => {
    expect(ROLES_INSCRIPTION).not.toContain('ADMIN');
    const utilisateur = utilisateurDeTest();
    expect(typeof utilisateur.role).toBe('string');
  });
});

function utilisateurDeTest(): Utilisateur {
  return {
    id: 'usr_test',
    nom: 'Test',
    email: 'test@agrimarket.ci',
    empreinteMotDePasse: 'empreinte',
    sel: 'sel',
    role: 'ACHETEUR',
    localisation: 'Abidjan',
    actif: true,
    dateCreation: '2026-01-01T08:00:00.000Z',
  };
}
