import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

/** Choix de thème : explicite (clair/sombre) ou calqué sur le système. */
export type ChoixTheme = 'light' | 'dark' | 'system';

/** Clé de la préférence d'affichage, distincte du document métier `agrimarket.v1`. */
export const CLE_THEME = 'agrimarket.theme';

/**
 * Préférence d'affichage clair/sombre.
 *
 * Il s'agit d'un réglage d'interface propre au navigateur, pas d'une donnée
 * métier : il est donc conservé hors du `PersistenceService` (comme le ferait
 * un cookie de préférence). Toute erreur d'accès au stockage est ignorée — le
 * thème retombe alors sur la préférence système.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  private readonly _choix = signal<ChoixTheme>(this.lireChoix());
  private readonly _systemeSombre = signal(this.media?.matches ?? false);

  readonly choix = this._choix.asReadonly();

  /** Thème réellement affiché. */
  readonly sombre = computed(() =>
    this._choix() === 'system' ? this._systemeSombre() : this._choix() === 'dark',
  );

  constructor() {
    this.media?.addEventListener?.('change', (evenement) =>
      this._systemeSombre.set(evenement.matches),
    );
    this.appliquer();
  }

  /** Bascule entre clair et sombre (le choix devient explicite). */
  basculer(): void {
    this.definir(this.sombre() ? 'light' : 'dark');
  }

  definir(choix: ChoixTheme): void {
    this._choix.set(choix);
    try {
      if (choix === 'system') {
        localStorage.removeItem(CLE_THEME);
      } else {
        localStorage.setItem(CLE_THEME, choix);
      }
    } catch {
      // Stockage indisponible (navigation privée…) : le choix vaut pour la session.
    }
    this.appliquer();
  }

  private appliquer(): void {
    const racine = this.document.documentElement;
    const choix = this._choix();
    if (choix === 'system') {
      racine.removeAttribute('data-theme');
    } else {
      racine.setAttribute('data-theme', choix);
    }
  }

  private lireChoix(): ChoixTheme {
    try {
      const valeur = localStorage.getItem(CLE_THEME);
      return valeur === 'light' || valeur === 'dark' ? valeur : 'system';
    } catch {
      return 'system';
    }
  }
}
