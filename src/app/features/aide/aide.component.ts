import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../../core/navigation';
import { LIBELLES_ACTION, MATRICE_PERMISSIONS, Action } from '../../core/permissions/permissions';
import { LIBELLES_ROLE, Role } from '../../core/models';

/**
 * Page d'aide et de mentions (task 3.4).
 * Explique les rôles, la matrice des droits et surtout les **limites** d'un
 * contrôle d'accès et d'une authentification purement locaux.
 */
@Component({
  selector: 'app-aide',
  imports: [RouterLink],
  template: `
    <article class="aide">
      <h1>Aide et limites de la démonstration</h1>

      <section>
        <h2>Rôles et droits</h2>
        <p>
          AgriMarket CI reconnaît exactement quatre rôles : Administrateur, Producteur, Acheteur et
          Livreur. Chaque action n'est proposée qu'aux rôles autorisés ; le tableau ci-dessous
          récapitule la matrice appliquée par l'application.
        </p>
        <table class="matrice">
          <caption>
            Matrice des permissions (rôle → actions autorisées)
          </caption>
          <thead>
            <tr>
              <th scope="col">Action</th>
              @for (role of roles; track role) {
                <th scope="col">{{ libellesRole[role] }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (ligne of matrice; track ligne.action) {
              <tr>
                <th scope="row">{{ ligne.libelle }}</th>
                @for (role of roles; track role) {
                  <td [class.oui]="ligne.roles.includes(role)">
                    {{ ligne.roles.includes(role) ? '✓' : '—' }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section>
        <h2>Limites du contrôle d'accès côté client</h2>
        <ul>
          <li>
            Les écrans protégés, les guards de navigation et les boutons masqués sont des
            <strong>protections d'interface</strong>, pas une sécurité de production.
          </li>
          <li>
            Toutes les données vivent dans le <strong>stockage local du navigateur</strong>
            (<code>agrimarket.v1</code>). Une personne ayant accès à la machine peut modifier ce
            stockage à la main : un rôle falsifié ou un compte désactivé pourraient tromper les
            gardes.
          </li>
          <li>
            Aucune vérification n'a lieu côté serveur, puisqu'<strong>il n'y a pas de serveur</strong>.
            Une application réelle devrait refaire tous ces contrôles côté back-end.
          </li>
          <li>
            L'authentification est <strong>simulée</strong> : les mots de passe ne sont jamais
            stockés en clair (empreinte salée), mais les identifiants de démonstration sont
            volontairement affichés. N'utilisez jamais de mot de passe réel.
          </li>
        </ul>
      </section>

      <section>
        <h2>Ce que la démonstration ne fait pas</h2>
        <ul>
          <li>Aucun backend, aucune API, aucune synchronisation entre appareils.</li>
          <li>Aucun paiement réel et aucun processus de règlement simulé comme réel.</li>
          <li>Aucun envoi d'e-mail ni notification externe.</li>
          <li>Aucun transfert d'image : les produits référencent une URL d'image.</li>
        </ul>
      </section>

      <p><a [routerLink]="chemins.accueil">Retour à l'accueil</a></p>
    </article>
  `,
  styles: [
    `
      .aide {
        max-width: 60rem;
        margin: 0 auto;
        display: grid;
        gap: 1.25rem;
      }
      section {
        display: grid;
        gap: 0.5rem;
      }
      ul {
        margin: 0;
        padding-left: 1.2rem;
        display: grid;
        gap: 0.35rem;
      }
      .matrice {
        border-collapse: collapse;
        width: 100%;
        font-size: 0.9rem;
      }
      .matrice th,
      .matrice td {
        border: 1px solid #d7ddcd;
        padding: 0.3rem 0.5rem;
        text-align: center;
      }
      .matrice th[scope='row'] {
        text-align: left;
      }
      .matrice td.oui {
        color: #2e7d32;
        font-weight: 700;
      }
      caption {
        text-align: left;
        font-weight: 600;
        padding-bottom: 0.35rem;
      }
    `,
  ],
})
export class AideComponent {
  readonly chemins = CHEMINS;
  readonly roles: readonly Role[] = ['ADMIN', 'PRODUCTEUR', 'ACHETEUR', 'LIVREUR'];
  readonly libellesRole = LIBELLES_ROLE;

  readonly matrice: { action: Action; libelle: string; roles: readonly Role[] }[] = (
    Object.keys(MATRICE_PERMISSIONS) as Action[]
  ).map((action) => ({
    action,
    libelle: LIBELLES_ACTION[action],
    roles: MATRICE_PERMISSIONS[action],
  }));
}
