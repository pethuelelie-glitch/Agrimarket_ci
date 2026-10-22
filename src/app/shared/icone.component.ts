import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Tracés des icônes (style trait, grille 24 × 24, inspirés de Lucide — licence ISC).
 * Embarqués dans le bundle : aucune requête réseau, aucune dépendance.
 */
const TRACES = {
  accueil: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z',
  boutique:
    'M4 7h16l-1.2 12.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8Z M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10',
  panier:
    'M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.3h8.7a1.5 1.5 0 0 0 1.4-1.1L21 8H6.2 M9.5 20.5h.01 M17.5 20.5h.01',
  colis: 'm12 3 8 4.5v9L12 21l-8-4.5v-9Z M4 7.5l8 4.5 8-4.5 M12 12v9 M8 5.3l8 4.4',
  camion:
    'M2 6h11v10H2Z M13 9h4.5l3.5 3.5V16h-8Z M6.5 19.5a1.75 1.75 0 1 0 0-.01Z M17 19.5a1.75 1.75 0 1 0 0-.01Z',
  utilisateurs:
    'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20 M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M20 20v-1.3a3.3 3.3 0 0 0-2.5-3.2 M15.5 4.6a3.5 3.5 0 0 1 0 6.8',
  utilisateur: 'M19 20v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V20 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  bouclier:
    'M12 21s7.5-3.5 7.5-9.5V5.2L12 2.5 4.5 5.2v6.3C4.5 17.5 12 21 12 21Z M9 11.8l2.1 2.1L15.3 9.7',
  graphique: 'M4 20V10 M10 20V4 M16 20v-7 M21 20H3',
  tableau: 'M4 4h7v7H4Z M13 4h7v4h-7Z M13 10h7v10h-7Z M4 13h7v7H4Z',
  aide: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.2 9a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.6-2.8 2.6 M12 16.8h.01',
  pousse:
    'M12 21v-9 M12 12c0-4.4-3.1-7.5-8-7.5 0 4.4 3.1 7.5 8 7.5Z M12 14.5c0-3.6 2.6-6.2 6.7-6.2 0 3.6-2.6 6.2-6.7 6.2Z',
  epi: 'M12 21V8 M12 8c-2-1-3-3-3-5 2 0 3 1.5 3 3 0-1.5 1-3 3-3 0 2-1 4-3 5Z M12 12.5c-2.2 0-4-1.6-4-3.6 2.2 0 4 1.6 4 3.6Z M12 12.5c2.2 0 4-1.6 4-3.6-2.2 0-4 1.6-4 3.6Z M12 17c-2.2 0-4-1.6-4-3.6 2.2 0 4 1.6 4 3.6Z M12 17c2.2 0 4-1.6 4-3.6-2.2 0-4 1.6-4 3.6Z',
  carotte:
    'M14.5 9.5 4 20 M14.5 9.5c1.6 1.6 1.2 4.3-.8 6.3L8 21l-5-5 5.2-5.7c2-2 4.7-2.4 6.3-.8Z M15 9c1.5-2 4.5-2.5 6-2 M15 9c2-1.5 2.5-4.5 2-6 M8 13l1.5 1.5 M10.5 16.5 12 18',
  pomme:
    'M12 7.5c-1.5-1.2-3.4-1.5-5-1-2.8.9-4 4-3.5 7.2.7 4.2 3.4 7.3 6 7.3 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.6 0 5.3-3.1 6-7.3.5-3.2-.7-6.3-3.5-7.2-1.6-.5-3.5-.2-5 1Z M12 7.5c0-2 1-3.5 3-4.5',
  tubercule:
    'M7.5 19.5c-3-1.7-4.2-5.4-2.6-8.4l2.2-4.2c1.6-3 5.3-4.1 8.3-2.5s4.2 5.3 2.6 8.3l-2.2 4.3c-1.6 3-5.3 4.1-8.3 2.5Z M9 10h.01 M13 8h.01 M12 14h.01',
  graine:
    'M12 3.5c4.7 0 7.5 3.7 7.5 8.5S16.7 20.5 12 20.5 4.5 16.8 4.5 12 7.3 3.5 12 3.5Z M12 3.5c-2 3-2 14 0 17',
  bouteille:
    'M10 2.5h4 M10.5 2.5v4L8 10v10a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 16 20V10l-2.5-3.5v-4 M8 14h8',
  recherche: 'M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z M21 21l-4.6-4.6',
  filtre: 'M3 5h18 M6.5 12h11 M10 19h4',
  epingle:
    'M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  plus: 'M12 5v14 M5 12h14',
  moins: 'M5 12h14',
  crayon: 'M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z M14.5 7.5l3 3',
  corbeille:
    'M4 7h16 M10 11v6 M14 11v6 M6 7l1 12.2a2 2 0 0 0 2 1.8h6a2 2 0 0 0 2-1.8L18 7 M9 7V4.5h6V7',
  coche: 'M5 12.5l4.5 4.5L19 7.5',
  croix: 'M6 6l12 12 M18 6 6 18',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  soleil:
    'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  lune: 'M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z',
  sortie: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  fleche: 'M5 12h14 M13 6l6 6-6 6',
  retour: 'M19 12H5 M11 18l-6-6 6-6',
  horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  etoile: 'm12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.1L12 17.1 6.4 20l1.1-6.1L3 9.5l6.2-.9Z',
  eclair: 'M13 2 4 14h7l-1 8 9-12h-7Z',
  cadenas: 'M6 11h12v10H6Z M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5.5 M12 7.6h.01',
  alerte: 'M12 3 2 20h20Z M12 9.5v4.5 M12 17.2h.01',
  porteMonnaie:
    'M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15 M3 6.5A2.5 2.5 0 0 0 5.5 9H20v6h-4a3 3 0 0 1 0-6',
  calendrier: 'M4 5h16v16H4Z M4 10h16 M8.5 3v4 M15.5 3v4',
  telephone:
    'M21 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.4 10.9a16 16 0 0 0 4.7 4.7l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  courrier: 'M3 5h18v14H3Z m0 0 9 7 9-7',
  route: 'M6 21 9 3 M18 21 15 3 M12 5v2 M12 11v2 M12 17v2',
  stock: 'M3 9l9-5 9 5v11H3Z M7 20v-7h10v7 M7 16.5h10',
} as const;

export type NomIcone = keyof typeof TRACES;

/**
 * Icône SVG en ligne (task UI). Purement décorative par défaut (`aria-hidden`) :
 * le texte voisin porte le sens ; passer `libelle` pour une icône seule.
 */
@Component({
  selector: 'app-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      [attr.width]="taille()"
      [attr.height]="taille()"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="epaisseur()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="libelle() ? null : 'true'"
      [attr.role]="libelle() ? 'img' : null"
      [attr.aria-label]="libelle()"
      focusable="false"
    >
      <path [attr.d]="trace()" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: none;
        line-height: 0;
      }
      svg {
        display: block;
      }
    `,
  ],
})
export class IconeComponent {
  readonly nom = input.required<NomIcone>();
  readonly taille = input(20);
  readonly epaisseur = input(1.9);
  readonly libelle = input<string | null>(null);

  readonly trace = computed(() => TRACES[this.nom()]);
}
