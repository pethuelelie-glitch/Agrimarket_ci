import { Injectable, Signal, computed, inject } from '@angular/core';
import { PersistenceService } from '../persistence/persistence.service';
import {
  IndicateursAcheteur,
  IndicateursAdmin,
  IndicateursLivreur,
  IndicateursProducteur,
  indicateursAcheteur,
  indicateursAdmin,
  indicateursLivreur,
  indicateursProducteur,
} from '../tableaux/indicateurs';
import { AuthService } from './auth.service';

/**
 * Tableaux de bord (Module H, task 9.1 à 9.4).
 *
 * Tous les indicateurs sont des `computed` dérivés des données locales : aucune
 * valeur figée, aucun chiffre inventé. Une base vide produit des zéros partout.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);

  /** Indicateurs globaux (administrateur). */
  readonly indicateursAdmin: Signal<IndicateursAdmin> = computed(() =>
    indicateursAdmin(this.persistence.etat(), new Date()),
  );

  /** Indicateurs du producteur connecté, limités à son périmètre. */
  readonly indicateursProducteur: Signal<IndicateursProducteur> = computed(() =>
    indicateursProducteur(this.persistence.etat(), this.auth.utilisateurCourant()),
  );

  /** Indicateurs de l'acheteur connecté. */
  readonly indicateursAcheteur: Signal<IndicateursAcheteur> = computed(() =>
    indicateursAcheteur(this.persistence.etat(), this.auth.utilisateurCourant()),
  );

  /** Indicateurs du livreur connecté, limités à ses livraisons attribuées. */
  readonly indicateursLivreur: Signal<IndicateursLivreur> = computed(() =>
    indicateursLivreur(this.persistence.etat(), this.auth.utilisateurCourant()),
  );
}
