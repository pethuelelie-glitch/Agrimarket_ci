import { Role } from './role';
import { Commande } from './commande';
import { Livraison } from './livraison';
import { Panier } from './panier';
import { Produit } from './produit';
import { Utilisateur } from './utilisateur';

/** Métadonnées du document racine (Module J). */
export interface Meta {
  /** Vrai après le premier amorçage des données de démonstration. */
  initialized: boolean;
  /** Version du jeu de données de démonstration. */
  seedVersion: number;
  /** Compteur d'écritures, utilisé pour détecter les écritures concurrentes. */
  revision: number;
}

/** Session locale conservée entre deux visites (Module B). */
export interface SessionLocale {
  userId: string;
  role: Role;
  /** Date ISO 8601 d'ouverture de la session. */
  ouvertLe: string;
}

/**
 * Document racine unique conservé dans le stockage local (décisions D2/D3).
 * Toute opération métier compose un nouvel état complet puis l'écrit en une seule fois.
 */
export interface EtatApplication {
  schemaVersion: number;
  meta: Meta;
  users: Utilisateur[];
  products: Produit[];
  orders: Commande[];
  deliveries: Livraison[];
  /** Panier par identifiant d'acheteur. */
  carts: Record<string, Panier>;
  session: SessionLocale | null;
}
