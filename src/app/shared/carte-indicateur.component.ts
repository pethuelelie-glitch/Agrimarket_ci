import { Component, input } from '@angular/core';

/**
 * Carte d'indicateur des tableaux de bord (task 9.5).
 * La valeur est fournie par le service, jamais codée en dur dans le composant.
 */
@Component({
  selector: 'app-carte-indicateur',
  template: `
    <div class="kpi panneau">
      <span class="kpi__valeur">{{ valeur() }}{{ suffixe() }}</span>
      <span class="kpi__libelle">{{ libelle() }}</span>
    </div>
  `,
})
export class CarteIndicateurComponent {
  readonly libelle = input.required<string>();
  readonly valeur = input.required<number | string>();
  readonly suffixe = input('');
}
