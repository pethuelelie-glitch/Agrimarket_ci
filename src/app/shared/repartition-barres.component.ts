import { Component, computed, input } from '@angular/core';

/** Un élément d'une répartition ou d'une série. */
export interface ElementBarre {
  readonly libelle: string;
  readonly valeur: number;
}

/**
 * Répartition en barres simples (task 9.5) — aucune librairie de graphiques.
 * Chaque barre est proportionnelle au maximum de la série ; une valeur nulle
 * n'affiche pas de barre, mais la ligne reste visible (zéro explicite).
 */
@Component({
  selector: 'app-repartition-barres',
  template: `
    <section class="barres">
      <h2>{{ titre() }}</h2>
      @if (elements().length === 0) {
        <p class="barres__vide">{{ messageVide() }}</p>
      } @else {
        <ul class="barres__liste">
          @for (element of elements(); track element.libelle) {
            <li class="barres__ligne">
              <span class="barres__libelle">{{ element.libelle }}</span>
              <span class="barres__piste">
                <span class="barres__barre" [style.width.%]="largeur(element)"></span>
              </span>
              <span class="barres__valeur">{{ element.valeur }}</span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .barres {
        display: grid;
        gap: 0.6rem;
      }
      .barres h2 {
        margin: 0;
        font-size: 1.05rem;
        color: var(--vert-fonce);
      }
      .barres__vide {
        margin: 0;
        color: var(--texte-doux);
        font-size: 0.92rem;
      }
      .barres__liste {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.4rem;
      }
      .barres__ligne {
        display: grid;
        grid-template-columns: minmax(6rem, 10rem) 1fr auto;
        gap: 0.6rem;
        align-items: center;
        font-size: 0.88rem;
      }
      .barres__piste {
        background: var(--vert-pale);
        border-radius: 999px;
        height: 0.7rem;
        overflow: hidden;
      }
      .barres__barre {
        display: block;
        height: 100%;
        background: var(--vert);
        border-radius: 999px;
      }
      .barres__valeur {
        min-width: 2rem;
        text-align: right;
        font-weight: 600;
      }
    `,
  ],
})
export class RepartitionBarresComponent {
  readonly titre = input.required<string>();
  readonly elements = input.required<readonly ElementBarre[]>();
  readonly messageVide = input('Aucune donnée à afficher.');

  private readonly maximum = computed(() =>
    Math.max(1, ...this.elements().map((element) => element.valeur)),
  );

  largeur(element: ElementBarre): number {
    return (element.valeur / this.maximum()) * 100;
  }
}
