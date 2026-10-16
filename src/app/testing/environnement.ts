import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EtatApplication } from '../core/models';
import { creerEtatDemo } from '../core/data/seed';
import { InMemoryAdapter } from '../core/persistence/in-memory-adapter';
import { PersistenceService } from '../core/persistence/persistence.service';
import { STORAGE_ADAPTER } from '../core/persistence/storage-adapter';

/**
 * Utilitaires de test partagés (dossier exclu du build applicatif).
 * Aucun composant ni service de production ne doit importer ce fichier.
 */

/** Date de référence fixe pour rendre les jeux de test déterministes. */
export const DATE_TEST = new Date('2026-06-15T09:00:00.000Z');

export interface EnvironnementTest {
  adaptateur: InMemoryAdapter;
  persistence: PersistenceService;
}

export interface OptionsTestBed {
  /** Composants standalone à déclarer dans le module de test. */
  imports?: readonly Type<unknown>[];
  /** État métier initial (sérialisé dans l'adaptateur en mémoire). */
  etatInitial?: EtatApplication | null;
  /** Fournisseurs supplémentaires (routeur, services simulés…). */
  providers?: readonly (Provider | EnvironmentProviders)[];
  /** Adaptateur personnalisé, par exemple pour simuler un stockage illisible. */
  adaptateur?: InMemoryAdapter;
}

/** Crée un adaptateur en mémoire pré-rempli avec l'état donné. */
export function creerAdaptateur(etatInitial: EtatApplication | null = null): InMemoryAdapter {
  return new InMemoryAdapter(etatInitial ? JSON.stringify(etatInitial) : null);
}

/** Configure le TestBed avec un stockage en mémoire. */
export function configurerTestBed(options: OptionsTestBed = {}): EnvironnementTest {
  const adaptateur =
    options.adaptateur ??
    creerAdaptateur(Object.prototype.hasOwnProperty.call(options, 'etatInitial') ? (options.etatInitial ?? null) : null);
  TestBed.configureTestingModule({
    imports: [...(options.imports ?? [])],
    providers: [{ provide: STORAGE_ADAPTER, useValue: adaptateur }, ...(options.providers ?? [])],
  });
  const persistence = TestBed.inject(PersistenceService);
  return { adaptateur, persistence };
}

/** Configure le TestBed avec le jeu de démonstration complet. */
export async function configurerTestBedAmorce(
  options: OptionsTestBed = {},
  maintenant: Date = DATE_TEST,
): Promise<EnvironnementTest> {
  const etat = await creerEtatDemo(maintenant);
  return configurerTestBed({ ...options, etatInitial: etat });
}
