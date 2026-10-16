import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEMINS } from '../../core/navigation';
import { AdminService } from '../../core/services/admin.service';

/**
 * Accueil de l'administration (task 10.8) : accès aux écrans de supervision et
 * action protégée de réinitialisation des données de démonstration, précédée
 * d'une confirmation.
 */
@Component({
  selector: 'app-administration',
  imports: [RouterLink],
  template: `
    <section class="admin-page">
      <h1>Administration</h1>

      <nav class="liens" aria-label="Écrans d’administration">
        <a class="carte" [routerLink]="chemins.tableauDeBord + '/administrateur'">
          <strong>Tableau de bord global</strong>
          <span>Indicateurs de la plateforme</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminUtilisateurs">
          <strong>Comptes</strong>
          <span>Consulter et modérer les utilisateurs</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminProduits">
          <strong>Produits</strong>
          <span>Modérer les produits du catalogue</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminCommandes">
          <strong>Commandes</strong>
          <span>Superviser et annuler les commandes</span>
        </a>
        <a class="carte" [routerLink]="chemins.adminLivraisons">
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
          <button type="button" (click)="ouvrirConfirmation()">Réinitialiser les données</button>
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
      h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--vert-fonce);
      }
      .liens {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1rem;
      }
      .carte {
        display: grid;
        gap: 0.25rem;
        padding: 1rem;
        border: 1px solid #e2e7db;
        border-radius: 0.6rem;
        background: #fff;
        text-decoration: none;
        color: inherit;
      }
      .carte:hover {
        border-color: var(--vert);
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
      .reinitialisation h2 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--vert-fonce);
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
      button.danger {
        background: #b3261e;
        color: #fff;
        border: none;
        padding: 0.5rem 0.9rem;
        border-radius: 0.4rem;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: progress;
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
