import { Role } from './role';

/**
 * Compte utilisateur (Module B — authentification).
 * Le mot de passe n'est jamais stocké en clair : seule une empreinte salée est conservée.
 */
export interface Utilisateur {
  id: string;
  nom: string;
  /** Identifiant unique et non modifiable du compte. */
  email: string;
  /** Empreinte non réversible du mot de passe (sel + mot de passe). */
  empreinteMotDePasse: string;
  /** Sel aléatoire propre au compte. */
  sel: string;
  role: Role;
  telephone?: string;
  localisation: string;
  actif: boolean;
  /** Date ISO 8601 de création. */
  dateCreation: string;
}
