import { Component, input } from '@angular/core';
import { IconeComponent, NomIcone } from './icone.component';

/** Teintes d'accent disponibles pour une carte d'indicateur. */
export type TonIndicateur = 'vert' | 'orange' | 'bleu' | 'violet' | 'rouge' | 'sarcelle';

/**
 * Carte d'indicateur des tableaux de bord (task 9.5).
 * La valeur est fournie par le service, jamais codée en dur dans le composant.
 */
@Component({
  selector: 'app-carte-indicateur',
  imports: [IconeComponent],
  template: `
    <div class="kpi panneau" [attr.data-ton]="ton()">
      <span class="kpi__icone"><app-icone [nom]="icone()" [taille]="22" /></span>
      <span class="kpi__valeur">{{ valeur() }}{{ suffixe() }}</span>
      <span class="kpi__libelle">{{ libelle() }}</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .kpi {
        --teinte: var(--vert);
        --fond-teinte: var(--vert-pale);
        position: relative;
        height: 100%;
        gap: 0.35rem;
        overflow: hidden;
        transition:
          transform var(--transition-lente),
          box-shadow var(--transition-lente);
      }
      .kpi::after {
        content: '';
        position: absolute;
        right: -2.5rem;
        top: -2.5rem;
        width: 7rem;
        height: 7rem;
        border-radius: 50%;
        background: var(--fond-teinte);
        opacity: 0.7;
      }
      .kpi:hover {
        transform: translateY(-2px);
        box-shadow: var(--ombre-md);
      }
      .kpi[data-ton='orange'] {
        --teinte: var(--orange);
        --fond-teinte: var(--orange-fond);
      }
      .kpi[data-ton='bleu'] {
        --teinte: var(--bleu);
        --fond-teinte: var(--bleu-fond);
      }
      .kpi[data-ton='violet'] {
        --teinte: var(--violet);
        --fond-teinte: var(--violet-fond);
      }
      .kpi[data-ton='rouge'] {
        --teinte: var(--rouge);
        --fond-teinte: var(--rouge-fond);
      }
      .kpi[data-ton='sarcelle'] {
        --teinte: var(--sarcelle);
        --fond-teinte: var(--sarcelle-fond);
      }
      .kpi__icone {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 2.75rem;
        height: 2.75rem;
        margin-bottom: 0.75rem;
        border-radius: var(--rayon);
        background: var(--fond-teinte);
        color: var(--teinte);
      }
      .kpi__valeur,
      .kpi__libelle {
        position: relative;
        z-index: 1;
      }
    `,
  ],
})
export class CarteIndicateurComponent {
  readonly libelle = input.required<string>();
  readonly valeur = input.required<number | string>();
  readonly suffixe = input('');
  readonly icone = input<NomIcone>('graphique');
  readonly ton = input<TonIndicateur>('vert');
}
