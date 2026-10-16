import { Produit } from '../models';
import { NOMBRE_PRODUITS_MISE_EN_AVANT, selectionnerMiseEnAvant } from './selection';

function produit(id: string, actif: boolean, dateCreation: string): Produit {
  return {
    id,
    producteurId: 'usr_producteur_1',
    nom: `Produit ${id}`,
    description: 'Description',
    categorie: 'CEREALES',
    prix: 500,
    unite: 'KG',
    quantiteDisponible: 10,
    localisation: 'Abidjan',
    imageUrl: 'x',
    actif,
    dateCreation,
  };
}

describe('selectionnerMiseEnAvant (task 4.3)', () => {
  it('exclut les produits inactifs', () => {
    const selection = selectionnerMiseEnAvant([
      produit('p1', false, '2026-01-05T00:00:00.000Z'),
      produit('p2', true, '2026-01-04T00:00:00.000Z'),
    ]);

    expect(selection.map((p) => p.id)).toEqual(['p2']);
  });

  it('trie les produits actifs du plus récent au plus ancien', () => {
    const selection = selectionnerMiseEnAvant([
      produit('p_ancien', true, '2026-01-01T00:00:00.000Z'),
      produit('p_recent', true, '2026-01-09T00:00:00.000Z'),
      produit('p_moyen', true, '2026-01-05T00:00:00.000Z'),
    ]);

    expect(selection.map((p) => p.id)).toEqual(['p_recent', 'p_moyen', 'p_ancien']);
  });

  it('ne dépasse jamais la limite de six éléments par défaut', () => {
    const produits = Array.from({ length: 12 }, (_, index) =>
      produit(`p${index}`, true, new Date(Date.UTC(2026, 0, 1 + index)).toISOString()),
    );

    const selection = selectionnerMiseEnAvant(produits);

    expect(selection).toHaveLength(NOMBRE_PRODUITS_MISE_EN_AVANT);
    expect(selection.map((p) => p.id)).toEqual(['p11', 'p10', 'p9', 'p8', 'p7', 'p6']);
  });

  it('accepte une limite explicite', () => {
    const produits = Array.from({ length: 5 }, (_, index) =>
      produit(`p${index}`, true, new Date(Date.UTC(2026, 0, 1 + index)).toISOString()),
    );

    expect(selectionnerMiseEnAvant(produits, 3)).toHaveLength(3);
    expect(selectionnerMiseEnAvant(produits, 0)).toHaveLength(0);
  });

  it('ne modifie pas le tableau reçu', () => {
    const produits = [
      produit('p_ancien', true, '2026-01-01T00:00:00.000Z'),
      produit('p_recent', true, '2026-01-09T00:00:00.000Z'),
    ];
    const avant = [...produits].map((p) => p.id);

    selectionnerMiseEnAvant(produits);

    expect(produits.map((p) => p.id)).toEqual(avant);
  });

  it('retourne une sélection vide sans produit actif', () => {
    expect(selectionnerMiseEnAvant([produit('p1', false, '2026-01-05T00:00:00.000Z')])).toEqual([]);
    expect(selectionnerMiseEnAvant([])).toEqual([]);
  });
});
