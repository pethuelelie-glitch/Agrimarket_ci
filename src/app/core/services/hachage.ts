/**
 * Empreinte des mots de passe (décision D10).
 *
 * Le mot de passe n'est jamais conservé en clair : on stocke un sel aléatoire
 * propre au compte et l'empreinte `SHA-256(sel + motDePasse)`.
 *
 * ⚠️ Cette protection est pédagogique : sans serveur, un attaquant disposant de
 * la machine peut lire le stockage local. Elle empêche seulement la lecture
 * directe du mot de passe (voir docs/limites-v1.md).
 */

/** Longueur minimale exigée pour un mot de passe. */
export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

/** Génère un sel aléatoire de 128 bits, encodé en hexadécimal. */
export function genererSel(): string {
  const octets = new Uint8Array(16);
  globalThis.crypto.getRandomValues(octets);
  return versHexadecimal(octets);
}

/** Calcule l'empreinte `SHA-256(sel + motDePasse)` au format hexadécimal. */
export async function hacherMotDePasse(motDePasse: string, sel: string): Promise<string> {
  const donnees = new TextEncoder().encode(`${sel}${motDePasse}`);
  const empreinte = await globalThis.crypto.subtle.digest('SHA-256', donnees);
  return versHexadecimal(new Uint8Array(empreinte));
}

/** Compare un mot de passe candidat à l'empreinte enregistrée d'un compte. */
export async function verifierMotDePasse(
  motDePasse: string,
  sel: string,
  empreinteAttendue: string,
): Promise<boolean> {
  const empreinte = await hacherMotDePasse(motDePasse, sel);
  return egaliteConstante(empreinte, empreinteAttendue);
}

function versHexadecimal(octets: Uint8Array): string {
  return Array.from(octets)
    .map((octet) => octet.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparaison à temps constant (évite les sorties anticipées). */
function egaliteConstante(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}
