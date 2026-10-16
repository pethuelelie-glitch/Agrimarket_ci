/**
 * Génération des identifiants techniques et des références lisibles.
 */

let compteur = 0;

/** Génère un identifiant unique et stable (préfixé) pour une nouvelle entité. */
export function genererIdentifiant(prefixe: string): string {
  compteur += 1;
  const horodatage = Date.now().toString(36);
  const aleatoire = Math.random().toString(36).slice(2, 6);
  return `${prefixe}_${horodatage}${compteur.toString(36)}${aleatoire}`;
}

/** Formate une date en `AAAAMMJJ`. */
export function formaterJourCompact(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${annee}${mois}${jour}`;
}

/**
 * Génère une référence lisible `PREFIXE-AAAAMMJJ-XXXX` (décision D16).
 * Le suffixe de 4 chiffres est tiré au sort puis régénéré tant qu'il n'est pas
 * unique (test via `referenceExiste`).
 */
export function genererReference(
  prefixe: string,
  date: Date,
  referenceExiste: (reference: string) => boolean,
): string {
  const jour = formaterJourCompact(date);
  for (let essai = 0; essai < 20_000; essai += 1) {
    const suffixe = String(Math.floor(Math.random() * 10_000)).padStart(4, '0');
    const reference = `${prefixe}-${jour}-${suffixe}`;
    if (!referenceExiste(reference)) {
      return reference;
    }
  }
  throw new Error(`Impossible de générer une référence unique pour ${prefixe} le ${jour}.`);
}
