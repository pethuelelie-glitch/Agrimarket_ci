import { Commande, Livraison, Produit, Role, Utilisateur } from '../models';
import {
  MATRICE_PERMISSIONS,
  peut,
  peutAvecUtilisateur,
  peutModifierLivraison,
  peutModifierProduit,
  peutSupprimerProduit,
  peutVoirCommande,
  peutVoirLivraison,
  peutVoirProduit,
  produitsGerables,
  produitsVisibles,
} from './permissions';

function utilisateur(id: string, role: Role, actif = true): Utilisateur {
  return {
    id,
    nom: `Utilisateur ${id}`,
    email: `${id}@agrimarket.ci`,
    empreinteMotDePasse: 'a'.repeat(64),
    sel: 'b'.repeat(32),
    role,
    localisation: 'Abidjan',
    actif,
    dateCreation: '2026-01-01T00:00:00.000Z',
  };
}

function produit(id: string, producteurId: string, actif = true): Produit {
  return {
    id,
    producteurId,
    nom: `Produit ${id}`,
    description: '',
    categorie: 'CEREALES',
    prix: 500,
    unite: 'KG',
    quantiteDisponible: 10,
    localisation: 'Abidjan',
    imageUrl: 'x',
    actif,
    dateCreation: '2026-01-01T00:00:00.000Z',
  };
}

function commande(id: string, acheteurId: string, producteurId: string): Commande {
  return {
    id,
    reference: `CMD-20260101-0001`,
    acheteurId,
    producteurId,
    lignes: [],
    montantProduits: 0,
    fraisLivraison: 1500,
    montantTotal: 1500,
    adresseLivraison: 'Abidjan',
    statut: 'EN_ATTENTE',
    dateCreation: '2026-01-01T00:00:00.000Z',
    historique: [],
  };
}

function livraison(id: string, commandeId: string, livreurId: string | null): Livraison {
  return {
    id,
    reference: `LIV-20260101-0001`,
    commandeId,
    commandeReference: 'CMD-20260101-0001',
    livreurId,
    adresseDestination: 'Abidjan',
    statut: livreurId ? 'ASSIGNEE' : 'EN_ATTENTE',
    dateCreation: '2026-01-01T00:00:00.000Z',
    dateAffectation: livreurId ? '2026-01-01T00:00:00.000Z' : null,
    dateLivraison: null,
    commentaire: '',
    historique: [],
  };
}

const ADMIN = utilisateur('u_admin', 'ADMIN');
const PRODUCTEUR_1 = utilisateur('u_prod_1', 'PRODUCTEUR');
const PRODUCTEUR_2 = utilisateur('u_prod_2', 'PRODUCTEUR');
const ACHETEUR_1 = utilisateur('u_ach_1', 'ACHETEUR');
const ACHETEUR_2 = utilisateur('u_ach_2', 'ACHETEUR');
const LIVREUR_1 = utilisateur('u_liv_1', 'LIVREUR');
const LIVREUR_2 = utilisateur('u_liv_2', 'LIVREUR');

describe('permissions (task 3.1)', () => {
  describe('matrice par rôle', () => {
    it('déclare une entrée pour chaque action', () => {
      for (const roles of Object.values(MATRICE_PERMISSIONS)) {
        expect(roles.length).toBeGreaterThan(0);
      }
    });

    it('autorise le producteur à créer et gérer ses produits', () => {
      expect(peut('PRODUCTEUR', 'product:create')).toBe(true);
      expect(peut('PRODUCTEUR', 'product:update')).toBe(true);
      expect(peut('PRODUCTEUR', 'product:manage-stock')).toBe(true);
      expect(peut('PRODUCTEUR', 'order:advance')).toBe(true);
    });

    it('interdit au producteur l’administration et la modération', () => {
      expect(peut('PRODUCTEUR', 'admin:users')).toBe(false);
      expect(peut('PRODUCTEUR', 'admin:dashboard')).toBe(false);
      expect(peut('PRODUCTEUR', 'product:moderate')).toBe(false);
    });

    it('autorise l’acheteur à gérer son panier et ses commandes', () => {
      expect(peut('ACHETEUR', 'cart:manage')).toBe(true);
      expect(peut('ACHETEUR', 'order:create')).toBe(true);
      expect(peut('ACHETEUR', 'order:read-own')).toBe(true);
    });

    it('interdit à l’acheteur de modifier le catalogue ou d’avancer les statuts producteur', () => {
      expect(peut('ACHETEUR', 'product:update')).toBe(false);
      expect(peut('ACHETEUR', 'product:delete')).toBe(false);
      expect(peut('ACHETEUR', 'product:manage-stock')).toBe(false);
      expect(peut('ACHETEUR', 'order:advance')).toBe(false);
    });

    it('autorise le livreur à mettre à jour ses livraisons', () => {
      expect(peut('LIVREUR', 'delivery:update-status')).toBe(true);
      expect(peut('LIVREUR', 'delivery:read-assigned')).toBe(true);
    });

    it('interdit au livreur le catalogue de gestion et les commandes d’autrui', () => {
      expect(peut('LIVREUR', 'product:update')).toBe(false);
      expect(peut('LIVREUR', 'order:read-all')).toBe(false);
      expect(peut('LIVREUR', 'order:read-own')).toBe(false);
      expect(peut('LIVREUR', 'delivery:assign')).toBe(false);
    });

    it('autorise l’administrateur à superviser sans modifier le catalogue producteur', () => {
      expect(peut('ADMIN', 'admin:users')).toBe(true);
      expect(peut('ADMIN', 'admin:reset')).toBe(true);
      expect(peut('ADMIN', 'product:moderate')).toBe(true);
      expect(peut('ADMIN', 'delivery:assign')).toBe(true);
      // L'administrateur ne modifie pas le contenu commercial d'un produit.
      expect(peut('ADMIN', 'product:update')).toBe(false);
      expect(peut('ADMIN', 'product:manage-stock')).toBe(false);
    });
  });

  describe('périmètre des produits', () => {
    it('autorise un producteur à modifier son propre produit', () => {
      expect(peutModifierProduit(PRODUCTEUR_1, produit('p1', PRODUCTEUR_1.id))).toBe(true);
    });

    it('refuse à un producteur la modification du produit d’un autre', () => {
      expect(peutModifierProduit(PRODUCTEUR_1, produit('p2', PRODUCTEUR_2.id))).toBe(false);
    });

    it('refuse à un acheteur toute modification de produit', () => {
      expect(peutModifierProduit(ACHETEUR_1, produit('p1', PRODUCTEUR_1.id))).toBe(false);
    });

    it('autorise l’administrateur à supprimer mais pas à modifier', () => {
      const cible = produit('p1', PRODUCTEUR_1.id);
      expect(peutSupprimerProduit(ADMIN, cible)).toBe(true);
      expect(peutModifierProduit(ADMIN, cible)).toBe(false);
    });

    it('ne rend visibles que les produits actifs pour un visiteur', () => {
      expect(peutVoirProduit(null, produit('p1', PRODUCTEUR_1.id, false))).toBe(false);
      expect(peutVoirProduit(null, produit('p2', PRODUCTEUR_1.id, true))).toBe(true);
      expect(
        produitsVisibles(null, [
          produit('p1', PRODUCTEUR_1.id, false),
          produit('p2', PRODUCTEUR_1.id, true),
        ]).map((p) => p.id),
      ).toEqual(['p2']);
    });

    it('montre au producteur ses produits inactifs dans le catalogue public', () => {
      const siens = produit('p1', PRODUCTEUR_1.id, false);
      const autres = produit('p2', PRODUCTEUR_2.id, true);
      expect(peutVoirProduit(PRODUCTEUR_1, siens)).toBe(true);
      expect(peutVoirProduit(PRODUCTEUR_1, autres)).toBe(true);
    });

    it('limite le catalogue de gestion du producteur à ses propres produits', () => {
      const siens = produit('p1', PRODUCTEUR_1.id, false);
      const autres = produit('p2', PRODUCTEUR_2.id, true);
      expect(produitsGerables(PRODUCTEUR_1, [siens, autres]).map((p) => p.id)).toEqual(['p1']);
      expect(produitsGerables(ACHETEUR_1, [siens, autres])).toEqual([]);
      expect(produitsGerables(ADMIN, [siens, autres]).map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('refuse toute permission à un compte désactivé', () => {
      const desactive = utilisateur('u_prod_1', 'PRODUCTEUR', false);
      expect(peutAvecUtilisateur(desactive, 'product:update')).toBe(false);
      expect(peutModifierProduit(desactive, produit('p1', desactive.id))).toBe(false);
    });
  });

  describe('périmètre des commandes', () => {
    const commandeA1 = commande('c1', ACHETEUR_1.id, PRODUCTEUR_1.id);
    const commandeA2 = commande('c2', ACHETEUR_2.id, PRODUCTEUR_1.id);

    it('montre à un acheteur uniquement ses commandes', () => {
      expect(peutVoirCommande(ACHETEUR_1, commandeA1)).toBe(true);
      expect(peutVoirCommande(ACHETEUR_1, commandeA2)).toBe(false);
    });

    it('montre au producteur les commandes qui le concernent', () => {
      expect(peutVoirCommande(PRODUCTEUR_1, commandeA2)).toBe(true);
      expect(peutVoirCommande(PRODUCTEUR_2, commandeA2)).toBe(false);
    });

    it('montre toutes les commandes à l’administrateur, aucune au livreur', () => {
      expect(peutVoirCommande(ADMIN, commandeA1)).toBe(true);
      expect(peutVoirCommande(LIVREUR_1, commandeA1)).toBe(false);
    });
  });

  describe('périmètre des livraisons', () => {
    const livraisonL1 = livraison('l1', 'c1', LIVREUR_1.id);
    const livraisonL2 = livraison('l2', 'c2', LIVREUR_2.id);
    const commandeLiee = commande('c1', ACHETEUR_1.id, PRODUCTEUR_1.id);

    it('autorise le livreur attribué à faire évoluer sa livraison', () => {
      expect(peutModifierLivraison(LIVREUR_1, livraisonL1)).toBe(true);
    });

    it('refuse le livreur sur une livraison attribuée à un autre', () => {
      expect(peutModifierLivraison(LIVREUR_1, livraisonL2)).toBe(false);
      expect(peutVoirLivraison(LIVREUR_1, livraisonL2, commandeLiee)).toBe(false);
    });

    it('refuse la modification d’une livraison déjà terminée', () => {
      const terminee: Livraison = { ...livraisonL1, statut: 'LIVREE' };
      expect(peutModifierLivraison(LIVREUR_1, terminee)).toBe(false);
    });

    it('refuse à un non-livreur la modification d’une livraison', () => {
      expect(peutModifierLivraison(ADMIN, livraisonL1)).toBe(false);
      expect(peutModifierLivraison(PRODUCTEUR_1, livraisonL1)).toBe(false);
    });

    it('permet le suivi par l’acheteur et le producteur concernés', () => {
      expect(peutVoirLivraison(ACHETEUR_1, livraisonL1, commandeLiee)).toBe(true);
      expect(peutVoirLivraison(ACHETEUR_2, livraisonL1, commandeLiee)).toBe(false);
      expect(peutVoirLivraison(PRODUCTEUR_1, livraisonL1, commandeLiee)).toBe(true);
    });
  });
});
