import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LIBELLES_ROLE, Role, Utilisateur } from '../../core/models';
import { AdminService } from '../../core/services/admin.service';

/**
 * Gestion des comptes (tasks 10.1 à 10.4, 10.8).
 * Liste, recherche, détail, modification des informations autorisées, changement
 * de rôle, activation/désactivation et réinitialisation de mot de passe.
 * L'adresse e-mail est un identifiant en lecture seule.
 */
@Component({
  selector: 'app-utilisateurs-admin',
  imports: [ReactiveFormsModule],
  template: `
    <section class="admin-page">
      <h1>Comptes</h1>

      <div class="champ">
        <label for="recherche">Rechercher par nom ou e-mail</label>
        <input
          id="recherche"
          type="search"
          [value]="recherche()"
          (input)="surRecherche($event)"
          placeholder="Ex. : Awa ou awa.kone@agrimarket.ci"
        />
      </div>

      @if (message()) {
        <p class="message" role="status">{{ message() }}</p>
      }

      @if (resultats().length === 0) {
        <p class="vide" role="status">Aucun compte ne correspond à cette recherche.</p>
      } @else {
        <table class="liste">
          <caption class="sr-only">Liste des comptes</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">E-mail</th>
              <th scope="col">Rôle</th>
              <th scope="col">Statut</th>
              <th scope="col">Créé le</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (compte of resultats(); track compte.id) {
              <tr [class.inactif]="!compte.actif">
                <td>{{ compte.nom }}</td>
                <td>{{ compte.email }}</td>
                <td>{{ libelleRole(compte.role) }}</td>
                <td>
                  <span
                    class="badge-statut"
                    [attr.data-statut]="compte.actif ? 'LIVREE' : 'ANNULEE'"
                  >
                    {{ compte.actif ? 'Actif' : 'Désactivé' }}
                  </span>
                </td>
                <td>{{ formaterDate(compte.dateCreation) }}</td>
                <td>
                  <button type="button" class="secondaire" (click)="ouvrir(compte)">
                    Détail
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (selection(); as compte) {
        <section class="detail panneau" aria-label="Détail du compte">
          <header class="detail__entete">
            <h2>{{ compte.nom }}</h2>
            <button type="button" class="secondaire" (click)="fermer()">Fermer</button>
          </header>

          <div class="champ">
            <label for="email-detail">Adresse e-mail (identifiant, lecture seule)</label>
            <input id="email-detail" type="email" [value]="compte.email" readonly />
          </div>

          <form [formGroup]="formulaire" (ngSubmit)="enregistrer()" novalidate>
            <div class="champ">
              <label for="nom">Nom</label>
              <input id="nom" type="text" formControlName="nom" />
              @if (erreurChamp('nom')) {
                <p class="erreur-champ" role="alert">{{ erreurChamp('nom') }}</p>
              }
            </div>
            <div class="champ">
              <label for="localisation">Localisation</label>
              <input id="localisation" type="text" formControlName="localisation" />
              @if (erreurChamp('localisation')) {
                <p class="erreur-champ" role="alert">{{ erreurChamp('localisation') }}</p>
              }
            </div>
            <div class="champ">
              <label for="telephone">Téléphone (facultatif)</label>
              <input id="telephone" type="tel" formControlName="telephone" />
              @if (erreurChamp('telephone')) {
                <p class="erreur-champ" role="alert">{{ erreurChamp('telephone') }}</p>
              }
            </div>
            <button type="submit">Enregistrer</button>
          </form>

          <div class="champ">
            <label for="role">Rôle</label>
            <select id="role" [value]="compte.role" (change)="surChangementRole($event)">
              @for (role of roles; track role) {
                <option [value]="role">{{ libelleRole(role) }}</option>
              }
            </select>
          </div>

          <div class="actions">
            <button type="button" class="secondaire" (click)="basculer(compte)">
              {{ compte.actif ? 'Désactiver le compte' : 'Réactiver le compte' }}
            </button>
          </div>

          <form
            class="reinit"
            [formGroup]="formulaireMotDePasse"
            (ngSubmit)="reinitialiser(compte)"
            novalidate
          >
            <div class="champ">
              <label for="nouveauMotDePasse">Nouveau mot de passe (réinitialisation)</label>
              <input
                id="nouveauMotDePasse"
                type="password"
                formControlName="motDePasse"
                autocomplete="new-password"
              />
              @if (erreurChampMotDePasse()) {
                <p class="erreur-champ" role="alert">{{ erreurChampMotDePasse() }}</p>
              }
            </div>
            <button type="submit">Réinitialiser le mot de passe</button>
          </form>
        </section>
      }
    </section>
  `,
  styles: [
    `
      .admin-page {
        display: grid;
        gap: 1rem;
      }
      h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--vert-fonce);
      }
      .champ {
        display: grid;
        gap: 0.25rem;
      }
      input,
      select {
        padding: 0.5rem;
        border: 1px solid #b9c2ae;
        border-radius: 0.4rem;
        font: inherit;
        max-width: 32rem;
      }
      input[readonly] {
        background: #f2f4ef;
        color: var(--texte-doux);
      }
      .liste {
        width: 100%;
        border-collapse: collapse;
      }
      .liste th,
      .liste td {
        text-align: left;
        padding: 0.5rem;
        border-bottom: 1px solid #e2e7db;
        font-size: 0.92rem;
      }
      .inactif {
        background: #faf3f2;
      }
      .detail {
        display: grid;
        gap: 0.75rem;
      }
      .detail__entete,
      .actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .detail__entete h2 {
        margin: 0;
        font-size: 1.15rem;
        color: var(--vert-fonce);
      }
      form {
        display: grid;
        gap: 0.6rem;
        justify-items: start;
      }
      .message {
        margin: 0;
        color: var(--vert-fonce);
        font-weight: 600;
      }
      .vide {
        margin: 0;
        color: var(--texte-doux);
      }
      .erreur-champ {
        margin: 0;
        color: #b3261e;
        font-size: 0.88rem;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
    `,
  ],
})
export class UtilisateursAdminComponent {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly roles = this.admin.roles;
  readonly recherche = signal('');
  readonly selectionId = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly soumis = signal(false);

  readonly resultats = computed(() => this.admin.rechercher(this.recherche()));
  readonly selection = computed<Utilisateur | null>(() => {
    const id = this.selectionId();
    return id ? this.admin.trouverUtilisateur(id) : null;
  });

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    localisation: ['', [Validators.required]],
    telephone: [''],
  });

  readonly formulaireMotDePasse = this.fb.nonNullable.group({
    motDePasse: ['', [Validators.required, Validators.minLength(8)]],
  });

  libelleRole(role: Role): string {
    return LIBELLES_ROLE[role];
  }

  formaterDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(iso));
  }

  surRecherche(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  ouvrir(compte: Utilisateur): void {
    this.selectionId.set(compte.id);
    this.message.set(null);
    this.soumis.set(false);
    this.formulaire.reset({
      nom: compte.nom,
      localisation: compte.localisation,
      telephone: compte.telephone ?? '',
    });
    this.formulaireMotDePasse.reset({ motDePasse: '' });
  }

  fermer(): void {
    this.selectionId.set(null);
  }

  /** Message d'erreur d'un champ de modification, une fois touché ou soumis. */
  erreurChamp(nom: 'nom' | 'localisation' | 'telephone'): string | null {
    const controle = this.formulaire.controls[nom];
    if (this.soumis() && controle.invalid) {
      return nom === 'nom'
        ? 'Le nom est obligatoire.'
        : nom === 'localisation'
          ? 'La localisation est obligatoire.'
          : 'Numéro invalide.';
    }
    return null;
  }

  erreurChampMotDePasse(): string | null {
    const controle = this.formulaireMotDePasse.controls.motDePasse;
    if (this.soumis() && controle.invalid) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    return null;
  }

  enregistrer(): void {
    const compte = this.selection();
    if (!compte) {
      return;
    }
    this.soumis.set(true);
    const resultat = this.admin.modifierUtilisateur(compte.id, this.formulaire.getRawValue());
    this.message.set(resultat.message);
  }

  surChangementRole(evenement: Event): void {
    const compte = this.selection();
    if (!compte) {
      return;
    }
    const role = (evenement.target as HTMLSelectElement).value;
    const resultat = this.admin.changerRole(compte.id, role);
    this.message.set(resultat.message);
  }

  basculer(compte: Utilisateur): void {
    const resultat = this.admin.basculerActivation(compte.id);
    this.message.set(resultat.message);
  }

  async reinitialiser(compte: Utilisateur): Promise<void> {
    this.soumis.set(true);
    const controle = this.formulaireMotDePasse.controls.motDePasse;
    if (controle.invalid) {
      return;
    }
    const resultat = await this.admin.reinitialiserMotDePasse(compte.id, controle.value);
    this.message.set(resultat.message);
    if (resultat.succes) {
      this.formulaireMotDePasse.reset({ motDePasse: '' });
      this.soumis.set(false);
    }
  }
}
