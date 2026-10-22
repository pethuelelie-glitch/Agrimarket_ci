import { Component, computed, input } from '@angular/core';

/** Un élément d'une répartition ou d'une série. */
export interface ElementBarre {
  readonly libelle: string;
  readonly valeur: number;
  /** Clé de statut facultative, pour reprendre la couleur des badges. */
  readonly statut?: string;
}

/**
 * Répartition en barres simples (task 9.5) — aucune librairie de graphiques.
 *
 * - `barres` (défaut) : barres horizontales, une ligne par élément ;
 * - `colonnes` : histogramme vertical, adapté aux séries temporelles.
 *
 * Chaque barre est proportionnelle au maximum de la série ; une valeur nulle
 * n'affiche pas de barre, mais la ligne reste visible (zéro explicite).
 */
@Component({
  selector: 'app-repartition-barres',
  template: `
    <section class="barres">
      <header class="barres__entete">
        <h2>{{ titre() }}</h2>
        @if (elements().length > 0) {
          <span class="barres__total">Total : {{ total() }}</span>
        }
      </header>
      @if (elements().length === 0) {
        <p class="barres__vide">{{ messageVide() }}</p>
      } @else if (mode() === 'colonnes') {
        <ol class="colonnes" [attr.aria-label]="titre()">
          @for (element of elements(); track element.libelle; let dernier = $last) {
            <li
              class="colonnes__item"
              [class.colonnes__item--dernier]="dernier"
              [attr.title]="element.libelle + ' : ' + element.valeur"
            >
              <span class="colonnes__valeur">{{ element.valeur }}</span>
              <span class="colonnes__piste">
                <span class="colonnes__barre" [style.height.%]="largeur(element)"></span>
              </span>
              <span class="colonnes__libelle">{{ element.libelle }}</span>
            </li>
          }
        </ol>
      } @else {
        <ul class="barres__liste">
          @for (element of elements(); track element.libelle) {
            <li class="barres__ligne" [attr.data-statut]="element.statut">
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
        gap: 1rem;
      }
      .barres__entete {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .barres h2 {
        margin: 0;
        font-size: 1.2rem;
      }
      .barres__total {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--texte-tres-doux);
      }
      .barres__vide {
        margin: 0;
        color: var(--texte-doux);
        font-size: 0.9rem;
      }
      .barres__liste {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.7rem;
      }
      .barres__ligne {
        --teinte: var(--vert);
        display: grid;
        grid-template-columns: minmax(7rem, 11rem) 1fr 2.5rem;
        gap: 0.85rem;
        align-items: center;
        font-size: 0.9rem;
      }
      .barres__ligne[data-statut='EN_ATTENTE'] {
        --teinte: var(--orange);
      }
      .barres__ligne[data-statut='CONFIRMEE'],
      .barres__ligne[data-statut='EN_LIVRAISON'] {
        --teinte: var(--bleu);
      }
      .barres__ligne[data-statut='EN_PREPARATION'] {
        --teinte: var(--violet);
      }
      .barres__ligne[data-statut='PRETE'] {
        --teinte: var(--sarcelle);
      }
      .barres__ligne[data-statut='ANNULEE'] {
        --teinte: var(--rouge);
      }
      .barres__libelle {
        font-weight: 600;
        color: var(--texte-doux);
      }
      .barres__piste {
        background: var(--surface-3);
        border-radius: 999px;
        height: 0.7rem;
        overflow: hidden;
      }
      .barres__barre {
        display: block;
        height: 100%;
        background: var(--teinte);
        border-radius: 999px;
        transition: width 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .barres__valeur {
        text-align: right;
        font-weight: 750;
        color: var(--titre);
        font-variant-numeric: tabular-nums;
      }

      .colonnes {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(0, 1fr);
        gap: 0.35rem;
        align-items: end;
        margin: 0;
        padding: 0;
        list-style: none;
        min-height: 12rem;
      }
      .colonnes__item {
        display: grid;
        grid-template-rows: auto 9rem auto;
        justify-items: center;
        gap: 0.35rem;
        min-width: 0;
      }
      .colonnes__valeur {
        font-size: 0.75rem;
        font-weight: 750;
        color: var(--texte-doux);
        font-variant-numeric: tabular-nums;
      }
      .colonnes__piste {
        display: flex;
        align-items: flex-end;
        width: 100%;
        max-width: 2.25rem;
        height: 100%;
        border-radius: 0.5rem;
        background: var(--surface-3);
        overflow: hidden;
      }
      .colonnes__barre {
        display: block;
        width: 100%;
        min-height: 0;
        border-radius: 0.5rem 0.5rem 0 0;
        background: linear-gradient(180deg, var(--vert-clair), var(--vert));
        transition: height 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .colonnes__item--dernier .colonnes__barre {
        background: linear-gradient(180deg, var(--orange-vif), var(--orange));
      }
      .colonnes__libelle {
        max-width: 100%;
        overflow: hidden;
        font-size: 0.68rem;
        color: var(--texte-tres-doux);
        white-space: nowrap;
        text-overflow: clip;
      }
      @media (max-width: 520px) {
        .barres__ligne {
          grid-template-columns: 1fr auto;
          gap: 0.35rem 0.75rem;
        }
        .barres__piste {
          grid-column: 1 / -1;
          grid-row: 2;
        }
        .colonnes__libelle {
          font-size: 0;
        }
        .colonnes__item--dernier .colonnes__libelle,
        .colonnes__item:first-child .colonnes__libelle {
          font-size: 0.62rem;
        }
      }
    `,
  ],
})
export class RepartitionBarresComponent {
  readonly titre = input.required<string>();
  readonly elements = input.required<readonly ElementBarre[]>();
  readonly messageVide = input('Aucune donnée à afficher.');
  readonly mode = input<'barres' | 'colonnes'>('barres');

  private readonly maximum = computed(() =>
    Math.max(1, ...this.elements().map((element) => element.valeur)),
  );

  readonly total = computed(() =>
    this.elements().reduce((somme, element) => somme + element.valeur, 0),
  );

  largeur(element: ElementBarre): number {
    return (element.valeur / this.maximum()) * 100;
  }
}
