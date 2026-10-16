import { Produit } from '../models';
import { estDisponible, messageIndisponibilite } from './disponibilite';

function produit(partiel: Partial<Produit>): Produit {
  return {
    id: 'prd',
    producteurId: 'usr',
    nom: 'Produit',
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

describe("disponibilité d'un produit (tasks 5.9 / 6.1)", () => {
  it('un produit actif et en stock est disponible', () => {
    expect(estDisponible(produit({}))).toBe(true);
    expect(messageIndisponibilite(produit({}))).toBeNull();
  });

  it("un produit épuisé n'est pas disponible et affiche « rupture de stock »", () => {
    const epuise = produit({ quantiteDisponible: 0 });
    expect(estDisponible(epuise)).toBe(false);
    expect(messageIndisponibilite(epuise)).toContain('Rupture de stock');
  });

  it("un produit inactif n'est pas disponible même s'il reste du stock", () => {
    const inactif = produit({ actif: false, quantiteDisponible: 12 });
    expect(estDisponible(inactif)).toBe(false);
    expect(messageIndisponibilite(inactif)).toContain('indisponible');
  });
});
