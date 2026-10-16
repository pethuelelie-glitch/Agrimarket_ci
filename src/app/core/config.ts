import { EtatApplication } from './models';

/**
 * Configuration centrale de l'application AgriMarket CI.
 * Les constantes métier ajustables vivent ici, pas dans les règles.
 */

/** Clé de stockage du document racine dans le navigateur. */
export const CLE_STOCKAGE = 'agrimarket.v1';

/** Version du schéma du document racine. */
export const SCHEMA_VERSION = 1;

/** Version du jeu de données de démonstration. */
export const SEED_VERSION = 1;

/** Forfait de base appliqué aux frais de livraison (FCFA). */
export const FORFAIT_BASE = 1000;

/** Zones géographiques utilisées pour le calcul des frais (décision D7). */
export type Zone = 'ABIDJAN' | 'SECONDAIRE' | 'AUTRE';

/** Supplément de zone ajouté au forfait de base (FCFA). */
export const SUPPLEMENT_ZONE: Readonly<Record<Zone, number>> = {
  ABIDJAN: 500,
  SECONDAIRE: 1000,
  AUTRE: 1500,
};

/** Villes considérées comme secondaires. */
export const VILLES_SECONDAIRES: readonly string[] = [
  'bouake',
  'bouaké',
  'yamoussoukro',
  'san-pedro',
  'sanpedro',
  'korhogo',
  'daloa',
  'man',
  'gagnoa',
];

/** Ville principale. */
export const VILLE_PRINCIPALE = 'abidjan';

/** Normalise une localisation : minuscules, sans accents, espaces réduits. */
export function normaliserLocalisation(localisation: string): string {
  return localisation
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Détermine la zone d'une localisation. Toute localisation inconnue est « AUTRE ». */
export function zoneDe(localisation: string): Zone {
  const normalisee = normaliserLocalisation(localisation);
  if (normalisee.includes(VILLE_PRINCIPALE)) {
    return 'ABIDJAN';
  }
  if (VILLES_SECONDAIRES.some((ville) => normalisee.includes(ville))) {
    return 'SECONDAIRE';
  }
  return 'AUTRE';
}

/**
 * Frais de livraison applicables pour un produit, calculés à partir de la
 * localisation du producteur : forfait de base + supplément de zone.
 */
export function fraisLivraison(localisationProducteur: string): number {
  return FORFAIT_BASE + SUPPLEMENT_ZONE[zoneDe(localisationProducteur)];
}

/** Retourne un état vide, sans données métier. */
export function etatVide(): EtatApplication {
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { initialized: false, seedVersion: 0, revision: 0 },
    users: [],
    products: [],
    orders: [],
    deliveries: [],
    carts: {},
    session: null,
  };
}
