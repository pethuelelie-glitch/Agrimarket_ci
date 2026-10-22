import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

/**
 * En-tête commun des tableaux de bord : salutation personnalisée, titre de
 * l'espace et date du jour. Le contenu projeté s'affiche à droite (actions).
 */
@Component({
  selector: 'app-entete-tableau',
  template: `
    <header class="entete-tableau">
      <div>
        <p class="entete-tableau__salut">{{ salutation() }}</p>
        <h1>{{ titre() }}</h1>
        <p class="entete-tableau__date">{{ dateDuJour }}</p>
      </div>
      <div class="entete-tableau__actions"><ng-content /></div>
    </header>
  `,
  styles: [
    `
      .entete-tableau {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        padding: clamp(1.25rem, 3vw, 2rem);
        border-radius: var(--rayon-2xl);
        background:
          radial-gradient(circle at 92% 0%, rgb(242 140 40 / 0.35), transparent 45%),
          linear-gradient(120deg, #0e3b29, #157347);
        color: #d8eadf;
        box-shadow: var(--ombre-md);
      }
      h1 {
        margin: 0.15rem 0 0.25rem;
        color: #fff;
        font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.2rem);
      }
      .entete-tableau__salut {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 750;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #ffb466;
      }
      .entete-tableau__date {
        margin: 0;
        font-size: 0.9rem;
        text-transform: capitalize;
      }
      .entete-tableau__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .entete-tableau__actions:empty {
        display: none;
      }
    `,
  ],
})
export class EnteteTableauComponent {
  readonly titre = input.required<string>();

  private readonly auth = inject(AuthService);

  readonly dateDuJour = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date());

  /** « Bonjour, Awa » (prénom = premier mot du nom), selon l'heure. */
  readonly salutation = computed(() => {
    const prenom = this.auth.utilisateurCourant()?.nom.split(/\s+/)[0];
    const formule = new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour';
    return prenom ? `${formule}, ${prenom}` : formule;
  });
}
