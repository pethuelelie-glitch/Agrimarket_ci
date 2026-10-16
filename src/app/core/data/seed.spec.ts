import { TestBed } from '@angular/core/testing';
import { CATEGORIES } from '../models';
import { InMemoryAdapter } from '../persistence/in-memory-adapter';
import { PersistenceService } from '../persistence/persistence.service';
import { STORAGE_ADAPTER } from '../persistence/storage-adapter';
import { COMPTES_DEMO, creerEtatDemo } from './seed';

const MAINTENANT = new Date('2026-06-15T09:00:00.000Z');

describe('seed — jeu de données de démonstration', () => {
  it('crée 1 admin, 2 producteurs, 2 acheteurs et 2 livreurs', async () => {
    const etat = await creerEtatDemo(MAINTENANT);

    expect(etat.users).toHaveLength(7);
    const parRole = (role: string) => etat.users.filter((u) => u.role === role).length;
    expect(parRole('ADMIN')).toBe(1);
    expect(parRole('PRODUCTEUR')).toBe(2);
    expect(parRole('ACHETEUR')).toBe(2);
    expect(parRole('LIVREUR')).toBe(2);
  });

  it('crée 8 produits couvrant les 6 catégories', async () => {
    const etat = await creerEtatDemo(MAINTENANT);

    expect(etat.products).toHaveLength(8);
    const categoriesUtilisees = new Set(etat.products.map((produit) => produit.categorie));
    expect(categoriesUtilisees.size).toBe(CATEGORIES.length);
    for (const categorie of CATEGORIES) {
      expect(categoriesUtilisees.has(categorie)).toBe(true);
    }
  });

  it('crée 3 commandes à des statuts différents et 2 livraisons', async () => {
    const etat = await creerEtatDemo(MAINTENANT);

    expect(etat.orders).toHaveLength(3);
    expect(new Set(etat.orders.map((commande) => commande.statut)).size).toBe(3);
    expect(etat.deliveries).toHaveLength(2);
    expect(etat.deliveries.filter((livraison) => livraison.statut === 'ASSIGNEE')).toHaveLength(1);
    expect(etat.deliveries.filter((livraison) => livraison.statut === 'LIVREE')).toHaveLength(1);
  });

  it('ne persiste jamais le mot de passe en clair', async () => {
    const etat = await creerEtatDemo(MAINTENANT);
    const serialise = JSON.stringify(etat);

    for (const compte of COMPTES_DEMO) {
      expect(serialise).not.toContain(compte.motDePasse);
    }
    for (const utilisateur of etat.users) {
      expect(utilisateur.empreinteMotDePasse).toMatch(/^[0-9a-f]{64}$/);
      expect(utilisateur.sel).toMatch(/^[0-9a-f]{32}$/);
      expect(utilisateur).not.toHaveProperty('motDePasse');
    }
  });

  describe('cohérence du stock avec les commandes', () => {
    it('a déjà déduit les quantités des commandes en cours', async () => {
      const etat = await creerEtatDemo(MAINTENANT);
      const stock = (id: string) =>
        etat.products.find((produit) => produit.id === id)?.quantiteDisponible;

      // Commande 1 réservée sur le riz (5 sacs) et la tomate (10 kg).
      expect(stock('prd_riz')).toBe(195);
      expect(stock('prd_tomate')).toBe(70);
      // Commande 2 réservée sur la mangue (20 kg).
      expect(stock('prd_mangue')).toBe(130);
      // Commande 3 (livrée) a consommé 50 kg de maïs.
      expect(stock('prd_mais')).toBe(250);
    });

    it('ne présente aucun stock négatif', async () => {
      const etat = await creerEtatDemo(MAINTENANT);

      for (const produit of etat.products) {
        expect(produit.quantiteDisponible).toBeGreaterThanOrEqual(0);
      }
    });

    it('expose un produit en rupture et un produit inactif', async () => {
      const etat = await creerEtatDemo(MAINTENANT);

      expect(etat.products.find((produit) => produit.id === 'prd_gombo')?.quantiteDisponible).toBe(
        0,
      );
      expect(etat.products.find((produit) => produit.id === 'prd_haricot')?.actif).toBe(false);
    });
  });

  describe('cohérence des références croisées', () => {
    it('rattache chaque ligne à un produit du bon producteur', async () => {
      const etat = await creerEtatDemo(MAINTENANT);

      for (const commande of etat.orders) {
        for (const ligne of commande.lignes) {
          const produit = etat.products.find((candidat) => candidat.id === ligne.produitId);
          expect(produit).toBeDefined();
          expect(produit?.producteurId).toBe(commande.producteurId);
          expect(ligne.sousTotal).toBe(ligne.quantite * ligne.prixUnitaire);
        }
      }
    });

    it('calcule montantTotal = montantProduits + fraisLivraison', async () => {
      const etat = await creerEtatDemo(MAINTENANT);

      for (const commande of etat.orders) {
        const sommeLignes = commande.lignes.reduce((total, ligne) => total + ligne.sousTotal, 0);
        expect(commande.montantProduits).toBe(sommeLignes);
        expect(commande.montantTotal).toBe(commande.montantProduits + commande.fraisLivraison);
      }
    });

    it('rattache chaque livraison à une commande existante', async () => {
      const etat = await creerEtatDemo(MAINTENANT);

      for (const livraison of etat.deliveries) {
        const commande = etat.orders.find((candidat) => candidat.id === livraison.commandeId);
        expect(commande).toBeDefined();
        expect(livraison.commandeReference).toBe(commande?.reference);
        if (livraison.livreurId) {
          const livreur = etat.users.find((utilisateur) => utilisateur.id === livraison.livreurId);
          expect(livreur?.role).toBe('LIVREUR');
        }
      }
    });

    it('démarre sans panier ni session', async () => {
      const etat = await creerEtatDemo(MAINTENANT);

      expect(etat.carts).toEqual({});
      expect(etat.session).toBeNull();
      expect(etat.meta.initialized).toBe(true);
    });
  });
});

describe('seed — intégration dans PersistenceService', () => {
  it('est enregistrable puis relisible à l’identique', async () => {
    const adaptateur = new InMemoryAdapter(null);
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_ADAPTER, useValue: adaptateur }],
    });
    const persistence = TestBed.inject(PersistenceService);

    const etat = await creerEtatDemo(MAINTENANT);
    persistence.remplacer(etat);

    const relu = JSON.parse(adaptateur.brut ?? '{}');
    expect(relu.users).toHaveLength(7);
    expect(relu.products).toHaveLength(8);
    expect(relu.orders).toHaveLength(3);
  });
});
