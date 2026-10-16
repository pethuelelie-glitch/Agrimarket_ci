import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CHEMINS, cheminTableauDeBord } from '../../core/navigation';
import { LIBELLES_ROLE, ROLES_INSCRIPTION, Role, estRole } from '../../core/models';
import { LONGUEUR_MIN_MOT_DE_PASSE } from '../../core/services/hachage';
import { AuthService } from '../../core/services/auth.service';

type ChampInscription = 'nom' | 'email' | 'motDePasse' | 'role' | 'localisation';

/**
 * Page d'inscription (task 2.5). Le rôle ADMIN n'est jamais proposé.
 */
@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-auth">
      <h1>Créer un compte</h1>
      <p class="mention-simulation" role="note">
        Authentification locale simulée, non sécurisée pour la production. N’utilisez pas de mot de
        passe réel.
      </p>

      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <div class="champ">
          <label for="nom">Nom complet</label>
          <input id="nom" type="text" formControlName="nom" autocomplete="name" />
          @if (afficherErreur('nom')) {
            <p class="erreur-champ" role="alert">Le nom est obligatoire (2 caractères minimum).</p>
          }
        </div>

        <div class="champ">
          <label for="email">Adresse e-mail</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" />
          @if (erreurChamp('email'); as erreurEmail) {
            <p class="erreur-champ" role="alert">{{ erreurEmail }}</p>
          } @else if (afficherErreur('email')) {
            <p class="erreur-champ" role="alert">Saisissez une adresse e-mail valide.</p>
          }
        </div>

        <div class="champ">
          <label for="motDePasse">Mot de passe</label>
          <input
            id="motDePasse"
            type="password"
            formControlName="motDePasse"
            autocomplete="new-password"
          />
          @if (afficherErreur('motDePasse')) {
            <p class="erreur-champ" role="alert">
              Le mot de passe doit contenir au moins {{ longueurMin }} caractères.
            </p>
          }
        </div>

        <div class="champ">
          <label for="role">Rôle</label>
          <select id="role" formControlName="role">
            @for (role of rolesInscription; track role) {
              <option [value]="role">{{ libellesRole[role] }}</option>
            }
          </select>
          @if (afficherErreur('role')) {
            <p class="erreur-champ" role="alert">Choisissez un rôle autorisé.</p>
          }
        </div>

        <div class="champ">
          <label for="localisation">Localisation</label>
          <input id="localisation" type="text" formControlName="localisation" />
          @if (afficherErreur('localisation')) {
            <p class="erreur-champ" role="alert">La localisation est obligatoire.</p>
          }
        </div>

        <div class="champ">
          <label for="telephone">Téléphone (optionnel)</label>
          <input id="telephone" type="tel" formControlName="telephone" autocomplete="tel" />
        </div>

        @if (messageErreur()) {
          <p class="erreur-globale" role="alert">{{ messageErreur() }}</p>
        }

        <button type="submit" [disabled]="enCours()">Créer mon compte</button>
      </form>

      <p>Déjà inscrit ? <a [routerLink]="chemins.connexion">Se connecter</a></p>
      <p class="lien-aide"><a [routerLink]="chemins.aide">En savoir plus sur les limites</a></p>
    </section>
  `,
  styles: [
    `
      .page-auth {
        max-width: 34rem;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      form {
        display: grid;
        gap: 0.85rem;
      }
      .champ {
        display: grid;
        gap: 0.25rem;
      }
      label {
        font-weight: 600;
      }
      input,
      select {
        padding: 0.5rem;
        border: 1px solid #b9c2ae;
        border-radius: 0.4rem;
        font: inherit;
      }
      button {
        padding: 0.6rem 1rem;
        border-radius: 0.4rem;
        border: none;
        background: #2e7d32;
        color: #fff;
        font: inherit;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .erreur-champ,
      .erreur-globale {
        color: #b3261e;
        margin: 0;
      }
      .mention-simulation {
        background: #fff8e1;
        border-left: 4px solid #f9a825;
        padding: 0.6rem 0.8rem;
        margin: 0;
      }
      .lien-aide {
        font-size: 0.9rem;
      }
    `,
  ],
})
export class InscriptionComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly chemins = CHEMINS;
  readonly rolesInscription = ROLES_INSCRIPTION;
  readonly libellesRole = LIBELLES_ROLE;
  readonly longueurMin = LONGUEUR_MIN_MOT_DE_PASSE;
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly erreursChamps = signal<Readonly<Record<string, string>>>({});
  readonly soumis = signal(false);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(LONGUEUR_MIN_MOT_DE_PASSE)]],
    role: this.fb.nonNullable.control<Role>('ACHETEUR', [Validators.required]),
    localisation: ['', [Validators.required]],
    telephone: [''],
  });

  /** Message d'erreur renvoyé par le service pour un champ (ex. e-mail déjà utilisé). */
  erreurChamp(nom: ChampInscription): string | null {
    return this.erreursChamps()[nom] ?? null;
  }

  afficherErreur(nom: ChampInscription): boolean {
    if (this.erreurChamp(nom)) {
      return true;
    }
    const controle = this.formulaire.controls[nom];
    return controle.invalid && (controle.touched || this.soumis());
  }

  /** Soumet l'inscription si la saisie est valide (task 2.5). */
  async soumettre(): Promise<void> {
    this.soumis.set(true);
    this.messageErreur.set(null);
    this.erreursChamps.set({});

    if (this.formulaire.invalid || this.enCours()) {
      return;
    }

    this.enCours.set(true);
    try {
      const valeurs = this.formulaire.getRawValue();
      const role = valeurs.role;
      const resultat = await this.auth.inscrire({
        nom: valeurs.nom,
        email: valeurs.email,
        motDePasse: valeurs.motDePasse,
        role: estRole(role) ? role : 'ACHETEUR',
        localisation: valeurs.localisation,
        telephone: valeurs.telephone,
      });

      if (!resultat.succes) {
        this.messageErreur.set(resultat.message);
        this.erreursChamps.set(resultat.erreursChamps);
        return;
      }

      const roleCourant = this.auth.roleCourant();
      await this.router.navigate([roleCourant ? cheminTableauDeBord(roleCourant) : CHEMINS.accueil]);
    } finally {
      this.enCours.set(false);
    }
  }
}
