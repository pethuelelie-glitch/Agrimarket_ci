/**
 * Mise en forme des montants en francs CFA (Module J / affichage).
 * Les montants sont stockés en entiers de FCFA : aucun centime n'est manipulé.
 */
const FORMAT_MONTANT = new Intl.NumberFormat('fr-CI', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

/** Formate un entier de FCFA pour l'affichage (ex. 1500 → « 1 500 F CFA »). */
export function formaterMontantFcfa(montant: number): string {
  if (!Number.isFinite(montant)) {
    return '';
  }
  return FORMAT_MONTANT.format(Math.round(montant));
}
