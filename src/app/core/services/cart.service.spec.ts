import { TestBed } from '@angular/core/testing';
import { IDS_DEMO } from '../data/seed';
import { PersistenceService } from '../persistence/persistence.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { NotificationsService } from './notifications.service';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const ACHETEUR_2 = ['adjoua.bamba@agrimarket.ci', 'Achete1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;

async function preparer(email?: string, motDePasse?: string): Promise<{
  cart: CartService;
  env: EnvironnementTest;
}> {
  const env = await configurerTestBedAmorce();
  const auth = TestBed.inject(AuthService);
  if (email && motDePasse) {
    await auth.connecter(email, motDePasse);
  }
  return { cart: TestBed.inject(CartService), env };
}

/** Fixe la quantité disponible d'un produit (simulation d'un stock faible). */
function fixerStock(env: EnvironnementTest, produitId: string, quantite: number): void {
  env.persistence.transaction((brouillon) => {
    const produit = brouillon.products.find((p) => p.id === produitId);
    if (produit) {
      produit.quantiteDisponible = quantite;
    }
  });
}

describe('CartService', () => {
  describe('6.1 accès et ajout', () => {
    it('refuse l’ajout à un visiteur non connecté', async () => {
      const { cart } = await preparer();

      const resultat = cart.ajouter('prd_riz');

      expect(resultat.succes).toBe(false);
      expect(resultat.message.toLowerCase()).toContain('connectez');
      expect(cart.items().length).toBe(0);
    });

    it('refuse l’ajout à un producteur avec le message « réservé aux acheteurs »', async () => {
      const { cart } = await preparer(...PRODUCTEUR_1);

      const resultat = cart.ajouter('prd_riz');

      expect(resultat.succes).toBe(false);
      expect(resultat.message.toLowerCase()).toContain('réservé aux acheteurs');
      expect(cart.items().length).toBe(0);
    });

    it('refuse un produit épuisé ou inactif', async () => {
      const { cart } = await preparer(...ACHETEUR_1);

      const epuise = cart.ajouter('prd_gombo');
      expect(epuise.succes).toBe(false);
      expect(epuise.message.toLowerCase()).toContain('rupture de stock');

      const inactif = cart.ajouter('prd_haricot');
      expect(inactif.succes).toBe(false);
      expect(inactif.message.toLowerCase()).toContain('indisponible');

      expect(cart.items().length).toBe(0);
    });

    it('refuse une quantité supérieure au stock en indiquant le maximum', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      fixerStock(env, 'prd_tomate', 4);

      const resultat = cart.ajouter('prd_tomate', 5);

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toContain('4');
      expect(cart.items().length).toBe(0);
    });

    it('ajoute un produit disponible et met à jour le nombre d’articles', async () => {
      const { cart } = await preparer(...ACHETEUR_1);

      const resultat = cart.ajouter('prd_riz', 2);

      expect(resultat.succes).toBe(true);
      expect(cart.items()).toEqual([{ produitId: 'prd_riz', quantite: 2 }]);
      expect(cart.nombreArticles()).toBe(2);
    });

    it('cumule les quantités d’un produit déjà présent, plafonnées au stock', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      fixerStock(env, 'prd_tomate', 4);

      expect(cart.ajouter('prd_tomate', 3).succes).toBe(true);
      const second = cart.ajouter('prd_tomate', 3);

      expect(second.succes).toBe(true);
      expect(second.message).toContain('4');
      expect(cart.items()).toEqual([{ produitId: 'prd_tomate', quantite: 4 }]);
    });
  });

  describe('6.2 modification et suppression', () => {
    it('plafonne la quantité au stock disponible avec un message', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      fixerStock(env, 'prd_tomate', 5);
      cart.ajouter('prd_tomate', 2);

      const resultat = cart.modifierQuantite('prd_tomate', 9);

      expect(resultat.succes).toBe(true);
      expect(resultat.message.toLowerCase()).toContain('maximum');
      expect(cart.items()[0].quantite).toBe(5);
    });

    it('maintient une quantité minimale de 1 et invite à supprimer', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 1);

      const resultat = cart.modifierQuantite('prd_riz', 0);

      expect(resultat.succes).toBe(true);
      expect(resultat.message.toLowerCase()).toContain('supprimez');
      expect(cart.items()[0].quantite).toBe(1);
    });

    it('supprime une ligne et recalcule immédiatement le nombre d’articles', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 2);
      cart.ajouter('prd_tomate', 3);
      expect(cart.nombreArticles()).toBe(5);

      const resultat = cart.supprimer('prd_riz');

      expect(resultat.succes).toBe(true);
      expect(cart.items().map((i) => i.produitId)).toEqual(['prd_tomate']);
      expect(cart.nombreArticles()).toBe(3);
    });

    it('vide entièrement le panier à la suppression du dernier article', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 1);

      cart.supprimer('prd_riz');

      expect(cart.items().length).toBe(0);
      expect(env.persistence.etat().carts[IDS_DEMO.acheteur1]).toBeUndefined();
    });
  });

  describe('6.3 calcul des montants', () => {
    it('calcule sous-total, montant des produits, frais et total', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      // Tomates : 600 FCFA × 3 = 1800 ; producteur d'Abidjan → frais 1500.
      cart.ajouter('prd_tomate', 3);

      const resume = cart.resume();
      const ligne = resume.groupes[0].lignes[0];
      expect(ligne.sousTotal).toBe(1800);
      expect(resume.montantProduits).toBe(1800);
      expect(resume.fraisLivraison).toBe(1500);
      expect(resume.total).toBe(1800 + 1500);
    });

    it('retire les frais d’un producteur quand son dernier article disparaît', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 1); // producteur 1 (Abidjan, 1500)
      cart.ajouter('prd_mangue', 1); // producteur 2 (Bouaké, 2000)
      expect(cart.resume().fraisLivraison).toBe(1500 + 2000);

      cart.supprimer('prd_riz');

      const resume = cart.resume();
      expect(resume.groupes.length).toBe(1);
      expect(resume.fraisLivraison).toBe(2000);
      expect(resume.total).toBe(resume.montantProduits + 2000);
    });
  });

  describe('6.4 regroupement par producteur', () => {
    it('regroupe les articles de deux producteurs avec des frais distincts', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 2); // 450 × 2 = 900, producteur 1
      cart.ajouter('prd_tomate', 1); // 600, producteur 1
      cart.ajouter('prd_mangue', 4); // 500 × 4 = 2000, producteur 2

      const resume = cart.resume();

      expect(resume.groupes.length).toBe(2);
      const groupe1 = resume.groupes.find((g) => g.producteurId === IDS_DEMO.producteur1);
      const groupe2 = resume.groupes.find((g) => g.producteurId === IDS_DEMO.producteur2);

      expect(groupe1?.lignes.length).toBe(2);
      expect(groupe1?.montantProduits).toBe(900 + 600);
      expect(groupe1?.fraisLivraison).toBe(1500);
      expect(groupe2?.montantProduits).toBe(2000);
      expect(groupe2?.fraisLivraison).toBe(2000);
      expect(resume.montantProduits).toBe(1500 + 2000);
      expect(resume.fraisLivraison).toBe(1500 + 2000);
    });
  });

  describe('6.5 vérification des stocks avant validation', () => {
    it('signale un article dont le stock est devenu insuffisant et bloque la validation', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_tomate', 5);
      expect(cart.validable()).toBe(true);

      fixerStock(env, 'prd_tomate', 2);

      expect(cart.validable()).toBe(false);
      expect(cart.problemes().length).toBe(1);
      expect(cart.problemes()[0].etat).toBe('INSUFFISANT');
      expect(cart.problemes()[0].maximum).toBe(2);
    });

    it('signale un produit devenu inactif', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_tomate', 1);

      env.persistence.transaction((brouillon) => {
        const produit = brouillon.products.find((p) => p.id === 'prd_tomate');
        if (produit) {
          produit.actif = false;
        }
      });

      expect(cart.validable()).toBe(false);
      expect(cart.problemes()[0].etat).toBe('INACTIF');
    });

    it('signale un produit supprimé du catalogue', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_tomate', 1);

      env.persistence.transaction((brouillon) => {
        brouillon.products = brouillon.products.filter((p) => p.id !== 'prd_tomate');
      });

      expect(cart.validable()).toBe(false);
      expect(cart.problemes()[0].etat).toBe('PRODUIT_SUPPRIME');
    });

    it('autorise la validation quand tous les articles sont disponibles', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 1);
      cart.ajouter('prd_mangue', 2);

      expect(cart.validable()).toBe(true);
      expect(cart.problemes()).toEqual([]);
    });
  });

  describe('6.6 conservation locale', () => {
    it('conserve le panier après rechargement du stockage', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 3);

      env.persistence.charger();

      expect(cart.items()).toEqual([{ produitId: 'prd_riz', quantite: 3 }]);
    });

    it('isole les paniers de deux comptes acheteurs', async () => {
      const { cart } = await preparer(...ACHETEUR_1);
      cart.ajouter('prd_riz', 2);

      await TestBed.inject(AuthService).connecter(...ACHETEUR_2);
      expect(cart.items()).toEqual([]);

      cart.ajouter('prd_mangue', 1);
      expect(cart.items()).toEqual([{ produitId: 'prd_mangue', quantite: 1 }]);

      await TestBed.inject(AuthService).connecter(...ACHETEUR_1);
      expect(cart.items()).toEqual([{ produitId: 'prd_riz', quantite: 2 }]);
    });

    it('réinitialise un panier illisible et en informe l’acheteur', async () => {
      const { cart, env } = await preparer(...ACHETEUR_1);
      env.persistence.transaction((brouillon) => {
        (brouillon.carts as Record<string, unknown>)[IDS_DEMO.acheteur1] = { items: 'corrompu' };
      });

      expect(cart.panier()).toBeNull();

      cart.assainirPanier();

      expect(env.persistence.etat().carts[IDS_DEMO.acheteur1]).toBeUndefined();
      expect(TestBed.inject(NotificationsService).message()).toContain('réinitialisé');
      expect(cart.items()).toEqual([]);
    });
  });
});
