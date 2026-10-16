import { FORFAIT_BASE, fraisLivraison, zoneDe } from './config';

describe('config — frais de livraison (décision D7)', () => {
  describe('zoneDe', () => {
    it('reconnaît Abidjan comme zone principale', () => {
      expect(zoneDe('Abidjan')).toBe('ABIDJAN');
      expect(zoneDe('Cocody, Abidjan')).toBe('ABIDJAN');
    });

    it('reconnaît les villes secondaires', () => {
      expect(zoneDe('Bouaké')).toBe('SECONDAIRE');
      expect(zoneDe('Yamoussoukro')).toBe('SECONDAIRE');
      expect(zoneDe('Korhogo')).toBe('SECONDAIRE');
      expect(zoneDe('San-Pédro')).toBe('SECONDAIRE');
    });

    it('classe toute localisation inconnue en zone « autres »', () => {
      expect(zoneDe('Tiébissou')).toBe('AUTRE');
      expect(zoneDe('')).toBe('AUTRE');
      expect(zoneDe('Village de Gboguhé')).toBe('AUTRE');
    });

    it('ignore la casse et les accents', () => {
      expect(zoneDe('ABIDJAN')).toBe('ABIDJAN');
      expect(zoneDe('bouake')).toBe('SECONDAIRE');
      expect(zoneDe('bouaké')).toBe('SECONDAIRE');
    });
  });

  describe('fraisLivraison', () => {
    it('applique 1 500 FCFA pour Abidjan', () => {
      expect(fraisLivraison('Abidjan')).toBe(1500);
      expect(fraisLivraison('Abidjan')).toBe(FORFAIT_BASE + 500);
    });

    it('applique 2 000 FCFA pour une ville secondaire', () => {
      expect(fraisLivraison('Bouaké')).toBe(2000);
      expect(fraisLivraison('Yamoussoukro')).toBe(2000);
    });

    it('applique 2 500 FCFA pour une localisation inconnue', () => {
      expect(fraisLivraison('Tiébissou')).toBe(2500);
      expect(fraisLivraison('')).toBe(2500);
    });
  });
});
