/**
 * Mise en forme des montants en francs CFA (Module J / affichage).
 * Les montants sont stockés en entiers de FCFA : aucun centime n'est manipulé.
 *
 * Le groupement est forcé (`useGrouping: true`, soit « toujours ») : certaines données de
 * locale n'insèrent pas de séparateur pour les nombres à 4 chiffres, ce qui
 * affichait « 1500 F CFA » au lieu de « 1 500 FCFA » dans le navigateur.
 */
const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** Formate un entier de FCFA pour l'affichage (ex. 1500 → « 1 500 FCFA »). */
export function formaterMontantFcfa(montant: number): string {
  if (!Number.isFinite(montant)) {
    return '';
  }
  // Espace insécable entre le nombre et l'unité : jamais de retour à la ligne.
  return `${FORMAT_NOMBRE.format(Math.round(montant))}\u00a0FCFA`;
}
