import { Injectable, Signal, inject, signal } from '@angular/core';
import { SCHEMA_VERSION, etatVide } from '../config';
import { EtatApplication } from '../models';
import { STORAGE_ADAPTER } from './storage-adapter';
import { estEtatApplication } from './schema';

/**
 * Couche de persistance unique de l'application (décisions D2/D3).
 *
 * - Toutes les données métier vivent dans un document racine versionné.
 * - `transaction` compose le nouvel état complet en mémoire puis l'écrit en une
 *   seule fois : les écritures d'une même opération sont donc atomiques et
 *   cohérentes (aucune commande sans décrément de stock, par exemple).
 * - Aucun composant n'accède directement au stockage du navigateur.
 */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly adaptateur = inject(STORAGE_ADAPTER);
  private readonly _etat = signal<EtatApplication>(etatVide());
  private readonly _avertissement = signal<string | null>(null);

  /** État métier courant, en lecture seule. */
  readonly etat: Signal<EtatApplication> = this._etat.asReadonly();

  /** Dernier avertissement lié au stockage (données corrompues, écriture impossible…). */
  readonly avertissement: Signal<string | null> = this._avertissement.asReadonly();

  constructor() {
    this.charger();
  }

  /**
   * Charge le document racine depuis le support de stockage.
   * Un contenu absent, illisible, d'une version inconnue ou de structure invalide
   * laisse l'application dans un état vide avec un avertissement, sans plantage.
   */
  charger(): void {
    let brut: string | null;
    try {
      brut = this.adaptateur.read();
    } catch {
      this.signaler(
        "Le stockage local est inaccessible : l'application démarre sans données enregistrées.",
      );
      this._etat.set(etatVide());
      return;
    }

    if (brut === null || brut === '') {
      this._etat.set(etatVide());
      return;
    }

    let analyse: unknown;
    try {
      analyse = JSON.parse(brut);
    } catch {
      this.donneesIllisibles('Les données locales enregistrées sont illisibles.');
      return;
    }

    if (typeof analyse !== 'object' || analyse === null) {
      this.donneesIllisibles('Les données locales enregistrées ont un format inattendu.');
      return;
    }

    const version = (analyse as { schemaVersion?: unknown }).schemaVersion;
    if (version !== SCHEMA_VERSION) {
      this.donneesIllisibles(
        `La version des données locales (${String(version)}) n'est pas reconnue.`,
      );
      return;
    }

    if (!estEtatApplication(analyse)) {
      this.donneesIllisibles('La structure des données locales est invalide.');
      return;
    }

    this._etat.set(analyse);
  }

  /**
   * Applique une modification métier sur une copie de l'état puis l'enregistre
   * en une seule écriture. Le mutateur reçoit un brouillon à modifier.
   */
  transaction(mutateur: (brouillon: EtatApplication) => void): void {
    const suivant = structuredClone(this._etat());
    mutateur(suivant);
    suivant.meta = { ...suivant.meta, revision: suivant.meta.revision + 1 };
    this._etat.set(suivant);
    this.ecrire(suivant);
  }

  /** Remplace tout l'état (amorçage des données de démonstration, réinitialisation). */
  remplacer(etat: EtatApplication): void {
    const suivant = structuredClone(etat);
    suivant.meta = { ...suivant.meta, revision: suivant.meta.revision + 1 };
    this._etat.set(suivant);
    this.ecrire(suivant);
  }

  /** Efface le stockage et revient à un état vide. */
  reinitialiserStockage(): void {
    try {
      this.adaptateur.clear();
    } catch {
      // Un stockage indisponible ne doit pas empêcher l'application de démarrer.
    }
    this._etat.set(etatVide());
  }

  /** Efface l'avertissement courant une fois qu'il a été présenté à l'utilisateur. */
  effacerAvertissement(): void {
    this._avertissement.set(null);
  }

  private ecrire(etat: EtatApplication): void {
    try {
      this.adaptateur.write(JSON.stringify(etat));
    } catch {
      this.signaler(
        "L'enregistrement local a échoué (stockage plein ou indisponible). " +
          'Les modifications restent actives dans cette session.',
      );
    }
  }

  private donneesIllisibles(message: string): void {
    this.signaler(`${message} Les données de démonstration vont être réinitialisées.`);
    this.reinitialiserStockage();
  }

  private signaler(message: string): void {
    this._avertissement.set(message);
  }
}
