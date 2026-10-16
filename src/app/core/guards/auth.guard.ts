import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models';
import { CHEMINS, cheminTableauDeBord } from '../navigation';
import { PersistenceService } from '../persistence/persistence.service';
import { AuthService } from '../services/auth.service';
import { NotificationsService } from '../services/notifications.service';

/**
 * Guards de navigation (Module C, décision D11).
 * Vérifications d'interface : elles ne remplacent pas un contrôle serveur
 * (voir `docs/limites-v1.md`).
 */

/** Réserve l'accès aux utilisateurs connectés ; sinon redirige vers la connexion. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estConnecte()) {
    return true;
  }
  return router.createUrlTree([CHEMINS.connexion]);
};

/**
 * Réserve l'accès aux rôles listés.
 * Un utilisateur connecté mais non autorisé est renvoyé vers son propre espace.
 */
export function roleGuard(rolesAutorises: readonly Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notifications = inject(NotificationsService);

    const utilisateur = auth.utilisateurCourant();
    if (!utilisateur) {
      return router.createUrlTree([CHEMINS.connexion]);
    }
    if (rolesAutorises.includes(utilisateur.role)) {
      return true;
    }

    notifications.informer(
      "Accès refusé : cette page n'est pas accessible avec votre rôle. Vous avez été redirigé vers votre espace.",
    );
    return router.createUrlTree([cheminTableauDeBord(utilisateur.role)]);
  };
}

/**
 * Réévalue l'état du compte à chaque navigation (Module C).
 * Un compte désactivé après connexion est déconnecté et redirigé vers la
 * connexion avec un message expliquant la désactivation.
 */
export const compteActifGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationsService);
  const session = inject(PersistenceService).etat().session;

  if (session) {
    const utilisateur = inject(PersistenceService)
      .etat()
      .users.find((candidat) => candidat.id === session.userId);

    if (!utilisateur || !utilisateur.actif) {
      auth.deconnecter();
      notifications.informer(
        'Votre compte a été désactivé par un administrateur. Vous avez été déconnecté.',
      );
      return router.createUrlTree([CHEMINS.connexion]);
    }
  }

  return true;
};
