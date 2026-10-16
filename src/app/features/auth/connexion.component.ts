import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CHEMINS, cheminTableauDeBord } from '../../core/navigation';
import { COMPTES_DEMO_PRINCIPAUX, CompteDemo } from '../../core/data/seed';
import { LIBELLES_ROLE } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

/**
 * Page de connexion (task 2.5).
 * Authentification locale simulée : la mention correspondante est affichée et
 * les identifiants de démonstration sont proposés pour les tests.
 */
@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-auth">
      <h1>Connexion</h1>
      <p class="mention-simulation" role="note">
        Authentification locale simulée, non sécurisée pour la production. N’utilisez pas de mot de
        passe réel.
      </p>

      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <div class="champ">
          <label for="email">Adresse e-mail</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" />
          @if (afficherErreur('email')) {
            <p class="erreur-champ" role="alert">Saisissez une adresse e-mail valide.</p>
          }
        </div>

        <div class="champ">
          <label for="motDePasse">Mot de passe</label>
          <input
            id="motDePasse"
            type="password"
            formControlName="motDePasse"
            autocomplete="current-password"
          />
          @if (afficherErreur('motDePasse')) {
            <p class="erreur-champ" role="alert">Le mot de passe est obligatoire.</p>
          }
        </div>

        @if (messageErreur()) {
          <p class="erreur-globale" role="alert">{{ messageErreur() }}</p>
        }

        <button type="submit" [disabled]="enCours()">Se connecter</button>
      </form>

      <p>Pas encore de compte ? <a routerLink="/inscription">Créer un compte</a></p>

      <section class="comptes-demo" aria-label="Comptes de démonstration">
        <h2>Comptes de démonstration</h2>
        <ul>
          @for (compte of comptesDemo; track compte.id) {
            <li>
              <span class="details-compte">
                <strong>{{ libelleRole(compte) }}</strong>
                {{ compte.email }} — mot de passe : {{ compte.motDePasse }}
              </span>
              <button type="button" class="secondaire" (click)="remplir(compte)">Utiliser</button>
            </li>
          }
        </ul>
      </section>

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
      input {
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
      button.secondaire {
        background: transparent;
        color: #2e7d32;
        border: 1px solid #2e7d32;
        padding: 0.3rem 0.6rem;
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
      .comptes-demo ul {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .comptes-demo li {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .details-compte {
        font-size: 0.9rem;
      }
      .lien-aide {
        font-size: 0.9rem;
      }
    `,
  ],
})
export class ConnexionComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly chemins = CHEMINS;
  readonly comptesDemo = COMPTES_DEMO_PRINCIPAUX;
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly soumis = signal(false);

  readonly formulaire = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required]],
  });

  /** Indique si l'erreur d'un champ doit être affichée (touché ou soumission tentée). */
  afficherErreur(nom: 'email' | 'motDePasse'): boolean {
    const controle = this.formulaire.controls[nom];
    return controle.invalid && (controle.touched || this.soumis());
  }

  /** Remplit le formulaire avec un compte de démonstration. */
  remplir(compte: CompteDemo): void {
    this.formulaire.setValue({ email: compte.email, motDePasse: compte.motDePasse });
    this.messageErreur.set(null);
  }

  /** Libellé lisible du rôle d'un compte de démonstration. */
  libelleRole(compte: CompteDemo): string {
    return LIBELLES_ROLE[compte.role];
  }

  /** Soumet le formulaire si la saisie est valide (task 2.5). */
  async soumettre(): Promise<void> {
    this.soumis.set(true);
    this.messageErreur.set(null);

    if (this.formulaire.invalid || this.enCours()) {
      return;
    }

    this.enCours.set(true);
    try {
      const { email, motDePasse } = this.formulaire.getRawValue();
      const resultat = await this.auth.connecter(email, motDePasse);
      if (!resultat.succes) {
        this.messageErreur.set(resultat.message);
        return;
      }
      const role = this.auth.roleCourant();
      await this.router.navigate([role ? cheminTableauDeBord(role) : CHEMINS.accueil]);
    } finally {
      this.enCours.set(false);
    }
  }
}
