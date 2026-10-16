import { formaterMontantFcfa } from './montant-fcfa';
import { MontantFcfaPipe } from './montant-fcfa.pipe';

/** Retourne uniquement les chiffres d'une chaîne, pour vérifier le montant formaté. */
function chiffres(valeur: string): string {
  return valeur.replace(/\D/g, '');
}

describe('montantFcfa', () => {
  describe('formaterMontantFcfa', () => {
    it('n’affiche aucune décimale', () => {
      const rendu = formaterMontantFcfa(1500);
      expect(rendu).not.toMatch(/\d[.,]\d/);
      expect(rendu).not.toContain(',');
    });

    it('utilise un séparateur de milliers', () => {
      const rendu = formaterMontantFcfa(9750);
      // Un caractère non numérique sépare les groupes de chiffres.
      expect(/\d[^\dA-Za-z]\d/.test(rendu)).toBe(true);
      expect(chiffres(rendu)).toBe('9750');
    });

    it('affiche le montant exact et l’unité FCFA', () => {
      expect(chiffres(formaterMontantFcfa(1500))).toBe('1500');
      expect(chiffres(formaterMontantFcfa(1000))).toBe('1000');
      expect(formaterMontantFcfa(1500)).toContain('CFA');
    });

    it('arrondit les valeurs non entières', () => {
      expect(chiffres(formaterMontantFcfa(1499.6))).toBe('1500');
    });
  });

  describe('MontantFcfaPipe', () => {
    const pipe = new MontantFcfaPipe();

    it('formate un montant', () => {
      expect(chiffres(pipe.transform(9750))).toBe('9750');
    });

    it('retourne une chaîne vide pour null ou undefined', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
    });
  });
});
