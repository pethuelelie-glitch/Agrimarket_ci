import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconeComponent } from '../../shared/icone.component';
import { CHEMINS } from '../../core/navigation';
import { AdminService } from '../../core/services/admin.service';

/**
 * Accueil de l'administration (task 10.8) : accès aux écrans de supervision et
 * action protégée de réinitialisation des données de démonstration, précédée
 * d'une confirmation.
 */
@Component({
  selector: 'app-administration',
  imports: [RouterLink, IconeComponent],
  template: `
    <section class="admin-page">
      <header class="entete-page">
        <div>
          <p class="surtitre">Espace administrateur</p>
          <h1>Administration</h1>
          <p>Supervisez les comptes, le catalogue, les commandes et les livraisons.</p>
        </div>
      </header>

      <nav class="liens" aria-label="Écrans d’administration">
        <a class="carte" [routerLink]="chemins.tableauDeBord + '/administrateur'">
          <span class="carte__icone"><app-icone nom="graphique" [taille]="22" /></span>
          <strong>Tableau de bord global</strong>
          <span>Indicateurs de la plateforme</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminUtilisateurs">
          <span class="carte__icone"><app-icone nom="utilisateurs" [taille]="22" /></span>
          <strong>Comptes</strong>
          <span>Consulter et modérer les utilisateurs</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminProduits">
          <span class="carte__icone"><app-icone nom="pousse" [taille]="22" /></span>
          <strong>Produits</strong>
          <span>Modérer les produits du catalogue</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminCommandes">
          <span class="carte__icone"><app-icone nom="colis" [taille]="22" /></span>
          <strong>Commandes</strong>
          <span>Superviser et annuler les commandes</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminLivraisons">
          <span class="carte__icone"><app-icone nom="camion" [taille]="22" /></span>
          <strong>Livraisons</strong>
          <span>Créer et attribuer les livraisons</span>
        </a>
      </nav>

      <section class="panneau reinitialisation">
        <h2>Réinitialiser les données de démonstration</h2>
        <p>
          Remplace les données locales par le jeu de démonstration initial. Toutes les modifications
          (comptes, produits, commandes, livraisons, paniers) seront perdues.
        </p>

        @if (message()) {
          <p class="message" role="status">{{ message() }}</p>
        }

        @if (!confirmationOuverte()) {
          <button type="button" class="danger" (click)="ouvrirConfirmation()">
            Réinitialiser les données
          </button>
        } @else {
          <div
            class="confirmation"
            role="alertdialog"
            aria-label="Confirmation de réinitialisation"
          >
            <p>Confirmez-vous la réinitialisation des données de démonstration ?</p>
            <div class="actions">
              <button type="button" class="danger" [disabled]="enCours()" (click)="confirmer()">
                Oui, réinitialiser
              </button>
              <button type="button" class="secondaire" [disabled]="enCours()" (click)="annuler()">
                Annuler
              </button>
            </div>
          </div>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .admin-page {
        display: grid;
        gap: 1.5rem;
      }
      .liens {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1rem;
      }
      .carte {
        display: grid;
        gap: 0.25rem;
        padding: 1.25rem;
        border: 1px solid var(--bord-doux);
        border-radius: var(--rayon-xl);
        background: var(--surface);
        box-shadow: var(--ombre-xs);
        text-decoration: none;
        color: inherit;
        transition:
          transform var(--transition-lente),
          box-shadow var(--transition-lente),
          border-color var(--transition);
      }
      .carte:hover {
        color: inherit;
        transform: translateY(-3px);
        box-shadow: var(--ombre-md);
        border-color: color-mix(in srgb, var(--vert) 35%, var(--bord-doux));
      }
      .carte__icone {
        display: grid;
        place-items: center;
        width: 2.75rem;
        height: 2.75rem;
        margin-bottom: 0.6rem;
        border-radius: var(--rayon);
        background: var(--vert-pale);
        color: var(--vert);
      }
      .carte strong {
        color: var(--vert-fonce);
      }
      .carte span {
        color: var(--texte-doux);
        font-size: 0.9rem;
      }
      .reinitialisation {
        display: grid;
        gap: 0.6rem;
        max-width: 40rem;
      }
      .reinitialisation {
        border-color: color-mix(in srgb, var(--rouge) 25%, var(--bord-doux));
      }
      .reinitialisation h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      .reinitialisation p {
        margin: 0;
      }
      .confirmation {
        display: grid;
        gap: 0.6rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .message {
        margin: 0;
        color: var(--vert-fonce);
        font-weight: 600;
      }
      button {
        justify-self: start;
      }
    `,
  ],
})
export class AdministrationComponent {
  private readonly admin = inject(AdminService);

  readonly chemins = CHEMINS;
  readonly confirmationOuverte = signal(false);
  readonly enCours = signal(false);
  readonly message = signal<string | null>(null);

  ouvrirConfirmation(): void {
    this.message.set(null);
    this.confirmationOuverte.set(true);
  }

  /** Fermer la confirmation sans valider laisse les données inchangées (task 10.7). */
  annuler(): void {
    this.confirmationOuverte.set(false);
  }

  async confirmer(): Promise<void> {
    if (this.enCours()) {
      return;
    }
    this.enCours.set(true);
    try {
      const resultat = await this.admin.reinitialiserDonnees();
      this.message.set(resultat.message);
      if (resultat.succes) {
        this.confirmationOuverte.set(false);
      }
    } finally {
      this.enCours.set(false);
    }
  }
}
