import { TestBed } from '@angular/core/testing';
import { InMemoryAdapter } from '../persistence/in-memory-adapter';
import { PersistenceService } from '../persistence/persistence.service';
import { STORAGE_ADAPTER } from '../persistence/storage-adapter';
import { amorcerDonneesDemo, migrerIllustrationsDemo } from './initialisation';
import { ILLUSTRATIONS_HISTORIQUES } from './seed';

function creerPersistence(adaptateur: InMemoryAdapter): PersistenceService {
  TestBed.configureTestingModule({
    providers: [{ provide: STORAGE_ADAPTER, useValue: adaptateur }],
  });
  return TestBed.inject(PersistenceService);
}

describe('amorcerDonneesDemo', () => {
  it('crée les données au premier appel', async () => {
    const persistence = creerPersistence(new InMemoryAdapter(null));

    const cree = await amorcerDonneesDemo(persistence);

    expect(cree).toBe(true);
    expect(persistence.etat().meta.initialized).toBe(true);
    expect(persistence.etat().users).toHaveLength(7);
    expect(persistence.etat().products).toHaveLength(8);
  });

  it('ne modifie ni ne duplique les données au second appel', async () => {
    const persistence = creerPersistence(new InMemoryAdapter(null));
    await amorcerDonneesDemo(persistence);

    // Une modification locale ne doit pas être écrasée par un nouvel amorçage.
    persistence.transaction((brouillon) => {
      brouillon.products.push({
        id: 'prd_local',
        producteurId: 'usr_producteur_1',
        nom: 'Produit local',
        description: '',
        categorie: 'LEGUMES',
        prix: 100,
        unite: 'KG',
        quantiteDisponible: 1,
        localisation: 'Abidjan',
        imageUrl: 'x',
        actif: true,
        dateCreation: new Date().toISOString(),
      });
    });
    const revisionAvantSecondAppel = persistence.etat().meta.revision;
    const utilisateursAvant = persistence.etat().users;

    const cree = await amorcerDonneesDemo(persistence);

    expect(cree).toBe(false);
    expect(persistence.etat().users).toHaveLength(7);
    expect(persistence.etat().users).toBe(utilisateursAvant);
    expect(persistence.etat().products).toHaveLength(9);
    expect(persistence.etat().meta.revision).toBe(revisionAvantSecondAppel);
  });

  it('reconstruit les données quand l’amorçage est forcé', async () => {
    const persistence = creerPersistence(new InMemoryAdapter(null));
    await amorcerDonneesDemo(persistence);
    persistence.transaction((brouillon) => {
      brouillon.products = [];
    });

    const reconstruit = await amorcerDonneesDemo(persistence, { forcer: true });

    expect(reconstruit).toBe(true);
    expect(persistence.etat().products).toHaveLength(8);
  });

  it('amorce de nouveau quand le stockage était corrompu', async () => {
    const adaptateur = new InMemoryAdapter('{ données invalides');
    const persistence = creerPersistence(adaptateur);

    expect(persistence.avertissement()).not.toBeNull();
    const cree = await amorcerDonneesDemo(persistence);

    expect(cree).toBe(true);
    expect(persistence.etat().meta.initialized).toBe(true);
    expect(persistence.etat().users).toHaveLength(7);
  });

  describe('migration des illustrations de démonstration', () => {
    it('remplace les anciennes images distantes par les images locales', async () => {
      const persistence = creerPersistence(new InMemoryAdapter(null));
      await amorcerDonneesDemo(persistence);
      // Simule des données amorcées par une version antérieure.
      persistence.transaction((brouillon) => {
        for (const produit of brouillon.products) {
          produit.imageUrl = ILLUSTRATIONS_HISTORIQUES[produit.id] ?? produit.imageUrl;
        }
      });

      const cree = await amorcerDonneesDemo(persistence);

      expect(cree).toBe(false);
      for (const produit of persistence.etat().products) {
        expect(produit.imageUrl).toMatch(/^\/images\/produits\/.+\.webp$/);
      }
    });

    it('conserve une image personnalisée par le producteur', async () => {
      const persistence = creerPersistence(new InMemoryAdapter(null));
      await amorcerDonneesDemo(persistence);
      persistence.transaction((brouillon) => {
        const riz = brouillon.products.find((produit) => produit.id === 'prd_riz');
        if (riz) {
          riz.imageUrl = 'https://exemple.ci/mon-riz.jpg';
        }
      });

      expect(migrerIllustrationsDemo(persistence)).toBe(0);
      expect(persistence.etat().products.find((p) => p.id === 'prd_riz')?.imageUrl).toBe(
        'https://exemple.ci/mon-riz.jpg',
      );
    });

    it('n’écrit rien quand il n’y a rien à migrer', async () => {
      const persistence = creerPersistence(new InMemoryAdapter(null));
      await amorcerDonneesDemo(persistence);
      const revision = persistence.etat().meta.revision;

      expect(migrerIllustrationsDemo(persistence)).toBe(0);
      expect(persistence.etat().meta.revision).toBe(revision);
    });
  });
});
