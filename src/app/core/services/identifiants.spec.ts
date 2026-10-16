import { formaterJourCompact, genererReference } from './identifiants';

describe('genererReference (task 7.1, décision D16)', () => {
  const DATE = new Date('2026-03-07T10:00:00.000Z');

  it('respecte le format PREFIXE-AAAAMMJJ-XXXX', () => {
    const reference = genererReference('CMD', DATE, () => false);

    expect(reference).toMatch(/^CMD-\d{8}-\d{4}$/);
  });

  it('intègre la date de création au format AAAAMMJJ', () => {
    const reference = genererReference('CMD', new Date(2026, 2, 7, 12), () => false);

    expect(reference).toContain(`CMD-${formaterJourCompact(new Date(2026, 2, 7, 12))}`);
    expect(reference).toContain('20260307');
  });

  it('produit vingt références uniques le même jour', () => {
    const utilisees = new Set<string>();
    const references: string[] = [];

    for (let index = 0; index < 20; index += 1) {
      const reference = genererReference('CMD', DATE, (candidat) => utilisees.has(candidat));
      utilisees.add(reference);
      references.push(reference);
    }

    expect(new Set(references).size).toBe(20);
  });

  it('régénère un suffixe déjà utilisé', () => {
    let appels = 0;
    const reference = genererReference('LIV', DATE, () => {
      appels += 1;
      return appels === 1; // le premier candidat est considéré comme déjà pris
    });

    expect(appels).toBe(2);
    expect(reference).toMatch(/^LIV-\d{8}-\d{4}$/);
  });
});
