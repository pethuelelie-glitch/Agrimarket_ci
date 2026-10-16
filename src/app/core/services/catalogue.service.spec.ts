import { TestBed } from '@angular/core/testing';
import { DonneesFormulaireProduit } from '../models';
import { IDS_DEMO } from '../data/seed';
import { produitsGerables, produitsVisibles } from '../permissions/permissions';
import { AuthService } from './auth.service';
import { CatalogueService } from './catalogue.service';
import { PersistenceService } from '../persistence/persistence.service';
import { configurerTestBedAmorce } from '../../testing/environnement';

const DONNEES_VALIDES: DonneesFormulaireProduit = {
  nom: 'Ananas de Bonoua',
  description: 'Ananas sucré du Sud-Comoé.',
  categorie: 'FRUITS',
  prix: 900,
  unite: 'PIECE',
  quantiteDisponible: 40,
  localisation: 'Bonoua',
  imageUrl: 'https://exemple.test/ananas.jpg',
};

async function preparer(email: string, motDePasse: string): Promise<CatalogueService> {
  await configurerTestBedAmorce();
  await TestBed.inject(AuthService).connecter(email, motDePasse);
  return TestBed.inject(CatalogueService);
}

/** Connexion en tant que producteur 1 (Awa Koné). */
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;
/** Connexion en tant que producteur 2 (Bakary Traoré). */
const PRODUCTEUR_2 = ['bakary.traore@agrimarket.ci', 'Produ1234'] as const;
const ACHETEUR = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;

describe('CatalogueService', () => {
  describe('5.1 création', () => {
    it('crée un produit actif, daté, rattaché au producteur connecté', async () => {
      const service = await preparer(...PRODUCTEUR_1);
      const avant = service.produits().length;

      const resultat = service.creer({ ...DONNEES_VALIDES });

      expect(resultat.succes).toBe(true);
      expect(service.produits().length).toBe(avant + 1);
      const produit = service.produits().find((p) => p.nom === 'Ananas de Bonoua');
      expect(produit?.producteurId).toBe(IDS_DEMO.producteur1);
      expect(produit?.actif).toBe(true);
      expect(produit?.prix).toBe(900);
      expect(Date.parse(produit?.dateCreation ?? '')).not.toBeNaN();
      expect(produit?.id).toBeTruthy();
    });

    it('refuse chaque champ obligatoire manquant, avec un message par champ', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      const resultat = service.creer({
        ...DONNEES_VALIDES,
        nom: '   ',
        description: '',
        categorie: '',
        unite: '',
        localisation: '',
        imageUrl: '',
      });

      expect(resultat.succes).toBe(false);
      expect(resultat.erreursChamps['nom']).toBeTruthy();
      expect(resultat.erreursChamps['description']).toBeTruthy();
      expect(resultat.erreursChamps['categorie']).toBeTruthy();
      expect(resultat.erreursChamps['unite']).toBeTruthy();
      expect(resultat.erreursChamps['localisation']).toBeTruthy();
      expect(resultat.erreursChamps['imageUrl']).toBeTruthy();
    });

    it('refuse un prix nul ou négatif', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      expect(service.creer({ ...DONNEES_VALIDES, prix: 0 }).erreursChamps['prix']).toBeTruthy();
      expect(service.creer({ ...DONNEES_VALIDES, prix: -10 }).erreursChamps['prix']).toBeTruthy();
    });

    it('refuse une quantité négative et accepte une quantité nulle', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      const negatif = service.creer({ ...DONNEES_VALIDES, quantiteDisponible: -1 });
      expect(negatif.succes).toBe(false);
      expect(negatif.erreursChamps['quantiteDisponible']).toBeTruthy();

      const zero = service.creer({ ...DONNEES_VALIDES, quantiteDisponible: 0 });
      expect(zero.succes).toBe(true);
    });

    it('refuse une catégorie ou une unité hors énumération', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      const categorie = service.creer({
        ...DONNEES_VALIDES,
        categorie: 'INCONNUE' as never,
      });
      expect(categorie.succes).toBe(false);
      expect(categorie.erreursChamps['categorie']).toBeTruthy();

      const unite = service.creer({ ...DONNEES_VALIDES, unite: 'CAISSE' as never });
      expect(unite.succes).toBe(false);
      expect(unite.erreursChamps['unite']).toBeTruthy();
    });

    it("refuse la création par un utilisateur qui n'est pas producteur", async () => {
      const service = await preparer(...ACHETEUR);

      const resultat = service.creer({ ...DONNEES_VALIDES });

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toContain('producteur');
    });
  });

  describe('5.1 modification', () => {
    it('le producteur propriétaire modifie son produit', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      const resultat = service.modifier('prd_riz', {
        ...DONNEES_VALIDES,
        nom: 'Riz local de Gagnoa',
        description: 'Nouvelle description.',
        categorie: 'CEREALES',
        unite: 'SAC',
        prix: 500,
        quantiteDisponible: 300,
      });

      expect(resultat.succes).toBe(true);
      const produit = service.trouver('prd_riz');
      expect(produit?.prix).toBe(500);
      expect(produit?.quantiteDisponible).toBe(300);
    });

    it('refuse la modification par un autre producteur sans changer les valeurs', async () => {
      const service = await preparer(...PRODUCTEUR_2);

      const resultat = service.modifier('prd_riz', { ...DONNEES_VALIDES, prix: 999 });

      expect(resultat.succes).toBe(false);
      expect(service.trouver('prd_riz')?.prix).toBe(450);
    });
  });

  describe('5.2 suppression', () => {
    it('supprime un produit sans commande en cours', async () => {
      const service = await preparer(...PRODUCTEUR_1);
      expect(service.trouver('prd_igname')).not.toBeNull();

      const resultat = service.supprimer('prd_igname');

      expect(resultat.succes).toBe(true);
      expect(service.trouver('prd_igname')).toBeNull();
    });

    it('refuse la suppression si une commande en cours référence le produit', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      const resultat = service.supprimer('prd_riz');

      expect(resultat.succes).toBe(false);
      expect(resultat.message.toLowerCase()).toContain('commande en cours');
      expect(resultat.message.toLowerCase()).toContain('inactif');
      expect(service.trouver('prd_riz')).not.toBeNull();
    });

    it("autorise la suppression si le produit n'apparaît que dans une commande livrée", async () => {
      const service = await preparer(...PRODUCTEUR_2);
      expect(service.estReferenceParCommandeEnCours('prd_mais')).toBe(false);

      const resultat = service.supprimer('prd_mais');

      expect(resultat.succes).toBe(true);
      expect(service.trouver('prd_mais')).toBeNull();
    });
  });

  describe('5.3 statut actif / inactif', () => {
    it('masque un produit désactivé du catalogue public mais le conserve pour son producteur', async () => {
      const service = await preparer(...PRODUCTEUR_1);
      const auth = TestBed.inject(AuthService);
      const producteur = auth.utilisateurCourant();

      const resultat = service.basculerActivation('prd_riz');
      expect(resultat.succes).toBe(true);

      const produit = service.trouver('prd_riz');
      expect(produit?.actif).toBe(false);
      expect(produitsVisibles(null, service.produits()).some((p) => p.id === 'prd_riz')).toBe(
        false,
      );
      expect(produitsGerables(producteur, service.produits()).some((p) => p.id === 'prd_riz')).toBe(
        true,
      );
    });

    it("refuse la bascule à un utilisateur qui n'est ni propriétaire ni administrateur", async () => {
      const service = await preparer(...PRODUCTEUR_2);

      const resultat = service.basculerActivation('prd_riz');

      expect(resultat.succes).toBe(false);
      expect(service.trouver('prd_riz')?.actif).toBe(true);
    });
  });

  describe('5.4 gestion du stock', () => {
    it('refuse une quantité négative', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      const resultat = service.ajusterStock('prd_igname', -1);

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toContain('négative');
    });

    it('refuse une quantité inférieure aux commandes en cours et annonce le minimum', async () => {
      const service = await preparer(...PRODUCTEUR_1);
      // prd_riz est engagé pour 5 unités dans cmd_demo_1 (EN_ATTENTE).
      expect(service.quantiteEngagee('prd_riz')).toBe(5);

      const resultat = service.ajusterStock('prd_riz', 3);

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toContain('5');
      expect(resultat.erreursChamps['quantiteDisponible']).toContain('5');
    });

    it('accepte une quantité égale ou supérieure aux quantités engagées', async () => {
      const service = await preparer(...PRODUCTEUR_1);

      expect(service.ajusterStock('prd_riz', 5).succes).toBe(true);
      expect(service.trouver('prd_riz')?.quantiteDisponible).toBe(5);

      expect(service.ajusterStock('prd_riz', 500).succes).toBe(true);
      expect(service.trouver('prd_riz')?.quantiteDisponible).toBe(500);
    });

    it('ne compte que les commandes en cours dans les quantités engagées', async () => {
      const service = await preparer(...PRODUCTEUR_2);
      // prd_mais est dans cmd_demo_3 (LIVREE) : rien d'engagé.
      expect(service.quantiteEngagee('prd_mais')).toBe(0);
      // prd_mangue est dans cmd_demo_2 (EN_LIVRAISON).
      expect(service.quantiteEngagee('prd_mangue')).toBe(20);
    });
  });

  it('persiste réellement les modifications (relecture du stockage)', async () => {
    const service = await preparer(...PRODUCTEUR_1);
    service.ajusterStock('prd_igname', 42);

    const brut = TestBed.inject(PersistenceService).etat();
    expect(brut.products.find((p) => p.id === 'prd_igname')?.quantiteDisponible).toBe(42);
  });
});
