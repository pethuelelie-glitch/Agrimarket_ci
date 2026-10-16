import { Produit } from '../models';
import {
  CRITERES_PAR_DEFAUT,
  CriteresCatalogue,
  TRI_DEFAUT,
  appliquerCriteres,
  filtresActifs,
  rechercherParNom,
  trierProduits,
} from './filtres';

function produit(partiel: Partial<Produit> & Pick<Produit, 'id' | 'nom'>): Produit {
  return {
    producteurId: 'prd',
    description: 'Description',
    categorie: 'CEREALES',
    prix: 100,
    unite: 'KG',
    quantiteDisponible: 10,
    localisation: 'Abidjan',
    imageUrl: 'https://exemple.test/image.jpg',
    actif: true,
    dateCreation: '2026-06-01T00:00:00.000Z',
    ...partiel,
  };
}

const RIZ = produit({
  id: 'a',
  nom: 'Riz local de Gagnoa',
  categorie: 'CEREALES',
  prix: 450,
  quantiteDisponible: 195,
  localisation: 'Abidjan',
  dateCreation: '2026-05-20T00:00:00.000Z',
});
const TOMATE = produit({
  id: 'b',
  nom: 'Tomates fraîches',
  categorie: 'LEGUMES',
  prix: 600,
  quantiteDisponible: 70,
  localisation: 'Bouaké',
  dateCreation: '2026-05-25T00:00:00.000Z',
});
const GOMBO = produit({
  id: 'c',
  nom: 'Gombo frais',
  categorie: 'LEGUMES',
  prix: 700,
  quantiteDisponible: 0,
  localisation: 'Bouaké',
  dateCreation: '2026-06-10T00:00:00.000Z',
});

const CATALOGUE: readonly Produit[] = [RIZ, TOMATE, GOMBO];

function criteres(partiel: Partial<CriteresCatalogue>): CriteresCatalogue {
  return { ...CRITERES_PAR_DEFAUT, ...partiel };
}

describe('filtres du catalogue (task 5.5)', () => {
  describe('recherche par nom', () => {
    it('ignore la casse et les espaces superflus', () => {
      expect(rechercherParNom(CATALOGUE, '  RIZ ').map((p) => p.id)).toEqual(['a']);
      expect(rechercherParNom(CATALOGUE, 'riz').map((p) => p.id)).toEqual(['a']);
    });

    it('retourne tout le catalogue pour une recherche vide', () => {
      expect(rechercherParNom(CATALOGUE, '   ').length).toBe(3);
    });

    it('ne retourne rien sans correspondance', () => {
      expect(rechercherParNom(CATALOGUE, 'ananas')).toEqual([]);
    });
  });

  describe('filtres combinables', () => {
    it('filtre par catégorie', () => {
      expect(
        appliquerCriteres(CATALOGUE, criteres({ categorie: 'LEGUMES' })).map((p) => p.id),
      ).toEqual(expect.arrayContaining(['b', 'c']));
    });

    it('filtre par prix minimum et maximum', () => {
      expect(appliquerCriteres(CATALOGUE, criteres({ prixMin: 500 })).map((p) => p.id)).toEqual([
        'c',
        'b',
      ]);
      expect(appliquerCriteres(CATALOGUE, criteres({ prixMax: 500 })).map((p) => p.id)).toEqual([
        'a',
      ]);
    });

    it('filtre par disponibilité « en stock » et « épuisé »', () => {
      expect(
        appliquerCriteres(CATALOGUE, criteres({ disponibilite: 'EN_STOCK' })).map((p) => p.id),
      ).toEqual(['b', 'a']);
      expect(
        appliquerCriteres(CATALOGUE, criteres({ disponibilite: 'EPUISE' })).map((p) => p.id),
      ).toEqual(['c']);
    });

    it('filtre par localisation sans tenir compte de la casse ni des accents', () => {
      expect(
        appliquerCriteres(CATALOGUE, criteres({ localisation: 'bouake' })).map((p) => p.id),
      ).toEqual(expect.arrayContaining(['b', 'c']));
      expect(
        appliquerCriteres(CATALOGUE, criteres({ localisation: 'BOUAKÉ' })).map((p) => p.id),
      ).toEqual(expect.arrayContaining(['b', 'c']));
    });

    it('combine plusieurs critères (intersection)', () => {
      const resultat = appliquerCriteres(
        CATALOGUE,
        criteres({ categorie: 'LEGUMES', prixMax: 650, disponibilite: 'EN_STOCK' }),
      );
      expect(resultat.map((p) => p.id)).toEqual(['b']);
    });

    it('retourne une liste vide quand aucun produit ne satisfait les filtres', () => {
      const resultat = appliquerCriteres(CATALOGUE, criteres({ categorie: 'FRUITS', prixMax: 10 }));
      expect(resultat).toEqual([]);
    });

    it('indique si au moins un filtre est actif', () => {
      expect(filtresActifs(CRITERES_PAR_DEFAUT)).toBe(false);
      expect(filtresActifs(criteres({ recherche: 'riz' }))).toBe(true);
      expect(filtresActifs(criteres({ disponibilite: 'EN_STOCK' }))).toBe(true);
    });
  });

  describe('tri', () => {
    it('trie par prix croissant puis décroissant', () => {
      expect(trierProduits(CATALOGUE, 'prix-asc').map((p) => p.prix)).toEqual([450, 600, 700]);
      expect(trierProduits(CATALOGUE, 'prix-desc').map((p) => p.prix)).toEqual([700, 600, 450]);
    });

    it('trie par date du plus récent au plus ancien et inversement', () => {
      expect(trierProduits(CATALOGUE, 'date-desc').map((p) => p.id)).toEqual(['c', 'b', 'a']);
      expect(trierProduits(CATALOGUE, 'date-asc').map((p) => p.id)).toEqual(['a', 'b', 'c']);
    });

    it('applique le tri par date la plus récente par défaut', () => {
      expect(TRI_DEFAUT).toBe('date-desc');
      expect(appliquerCriteres(CATALOGUE, CRITERES_PAR_DEFAUT).map((p) => p.id)).toEqual([
        'c',
        'b',
        'a',
      ]);
    });

    it('conserve les filtres actifs pendant le tri', () => {
      const resultat = appliquerCriteres(
        CATALOGUE,
        criteres({ categorie: 'LEGUMES' }),
        'prix-desc',
      );
      expect(resultat.map((p) => p.prix)).toEqual([700, 600]);
    });
  });

  it('ne modifie pas le tableau reçu', () => {
    const original = [...CATALOGUE];
    trierProduits(CATALOGUE, 'prix-asc');
    rechercherParNom(CATALOGUE, 'riz');
    expect(CATALOGUE).toEqual(original);
  });
});
