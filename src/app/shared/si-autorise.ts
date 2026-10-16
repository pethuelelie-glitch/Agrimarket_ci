import { Component, Directive, computed, inject, input } from '@angular/core';
import { Action, LIBELLES_ACTION, peutAvecUtilisateur } from '../core/permissions/permissions';
import { AuthService } from '../core/services/auth.service';

/**
 * Règle partagée « action masquée si non autorisée » (task 3.5).
 *
 * Utilisation :
 * ```html
 * <app-si-autorise action="admin:users">
 *   <button>Gérer les comptes</button>
 * </app-si-autorise>
 * ```
 * Le contenu n'est rendu que si le rôle courant possède l'action.
 */
@Component({
  selector: 'app-si-autorise',
  template: `@if (autorise()) {
    <ng-content />
  }`,
})
export class SiAutoriseComponent {
  readonly action = input.required<Action>();
  private readonly auth = inject(AuthService);

  readonly autorise = computed(() =>
    peutAvecUtilisateur(this.auth.utilisateurCourant(), this.action()),
  );
}

/**
 * Variante « action désactivée avec infobulle » (task 3.5) : l'élément reste
 * visible mais est désactivé et explique pourquoi l'action n'est pas accessible.
 */
@Directive({
  selector: '[appDesactiveSiNonAutorise]',
  host: {
    '[attr.disabled]': 'desactive() ? "" : null',
    '[attr.title]': 'desactive() ? infobulle : null',
  },
})
export class DesactiveSiNonAutoriseDirective {
  readonly appDesactiveSiNonAutorise = input.required<Action>();
  private readonly auth = inject(AuthService);

  readonly desactive = computed(
    () => !peutAvecUtilisateur(this.auth.utilisateurCourant(), this.appDesactiveSiNonAutorise()),
  );

  get infobulle(): string {
    return `${LIBELLES_ACTION[this.appDesactiveSiNonAutorise()]} : action non accessible avec votre rôle.`;
  }
}
