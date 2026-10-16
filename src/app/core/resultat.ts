/**
 * Résultat uniforme d'une opération métier (validation, authentification,
 * transitions…). Permet aux services de renvoyer à la fois un message global et
 * des erreurs par champ, sans lever d'exception vers les composants.
 */
export interface Resultat {
  readonly succes: boolean;
  /** Message global à afficher (vide si succès sans texte). */
  readonly message: string;
  /** Erreurs associées à un champ de formulaire, indexées par nom de champ. */
  readonly erreursChamps: Readonly<Record<string, string>>;
}

/** Construit un résultat de succès. */
export function succes(message = ''): Resultat {
  return { succes: true, message, erreursChamps: {} };
}

/** Construit un résultat d'échec, avec ou sans erreurs par champ. */
export function echec(
  message: string,
  erreursChamps: Readonly<Record<string, string>> = {},
): Resultat {
  return { succes: false, message, erreursChamps };
}
