import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CHEMINS, cheminTableauDeBord } from '../../core/navigation';
import { COMPTES_DEMO_PRINCIPAUX, CompteDemo } from '../../core/data/seed';
import { LIBELLES_ROLE } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { IconeComponent, NomIcone } from '../../shared/icone.component';

/**
 * Page de connexion (task 2.5).
 * Authentification locale simulée : la mention correspondante est affichée et
 * les identifiants de démonstration sont proposés pour les tests.
 */
@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule, RouterLink, IconeComponent],
  template: `
    <section class="page-auth apparition">
      <aside class="auth-visuel" aria-hidden="true">
        <div class="auth-visuel__contenu">
          <p class="auth-visuel__marque">AgriMarket CI</p>
          <p class="auth-visuel__titre">Le marché ivoirien, dans votre poche.</p>
          <ul>
            <li>
              <app-icone nom="pousse" [taille]="18" /> Des récoltes publiées par les producteurs
            </li>
            <li><app-icone nom="panier" [taille]="18" /> Un panier multi-producteurs</li>
            <li><app-icone nom="camion" [taille]="18" /> Des livraisons suivies pas à pas</li>
          </ul>
        </div>
      </aside>

      <div class="auth-colonne">
        <header class="auth-entete">
          <h1>Connexion</h1>
          <p>Heureux de vous revoir. Connectez-vous pour accéder à votre espace.</p>
        </header>

        <p class="mention-simulation" role="note">
          <app-icone nom="alerte" [taille]="18" />
          <span>
            Authentification locale simulée, non sécurisée pour la production. N’utilisez pas de mot
            de passe réel.
          </span>
        </p>

        <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
          <div class="champ">
            <label for="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="username"
              placeholder="vous@exemple.ci"
            />
            @if (afficherErreur('email')) {
              <p class="erreur-champ" role="alert">Saisissez une adresse e-mail valide.</p>
            }
          </div>

          <div class="champ">
            <label for="motDePasse">Mot de passe</label>
            <div class="champ-secret">
              <input
                id="motDePasse"
                [type]="motDePasseVisible() ? 'text' : 'password'"
                formControlName="motDePasse"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="champ-secret__bascule"
                (click)="motDePasseVisible.set(!motDePasseVisible())"
                [attr.aria-pressed]="motDePasseVisible()"
              >
                {{ motDePasseVisible() ? 'Masquer' : 'Afficher' }}
              </button>
            </div>
            @if (afficherErreur('motDePasse')) {
              <p class="erreur-champ" role="alert">Le mot de passe est obligatoire.</p>
            }
          </div>

          @if (messageErreur()) {
            <p class="erreur-globale" role="alert">{{ messageErreur() }}</p>
          }

          <button type="submit" class="bouton bouton--grand" [disabled]="enCours()">
            {{ enCours() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        <p class="auth-bascule">
          Pas encore de compte ? <a routerLink="/inscription">Créer un compte</a>
        </p>

        <section class="comptes-demo" aria-labelledby="titre-comptes-demo">
          <h2 id="titre-comptes-demo">Comptes de démonstration</h2>
          <p class="comptes-demo__aide">Choisissez un profil pour remplir le formulaire.</p>
          <ul>
            @for (compte of comptesDemo; track compte.id) {
              <li>
                <button
                  type="button"
                  class="compte"
                  [attr.data-role]="compte.role"
                  (click)="remplir(compte)"
                >
                  <span class="compte__icone"
                    ><app-icone [nom]="iconeRole(compte)" [taille]="20"
                  /></span>
                  <span class="details-compte">
                    <strong>{{ libelleRole(compte) }}</strong>
                    <span>{{ compte.email }}</span>
                    <span class="compte__mdp">mot de passe : {{ compte.motDePasse }}</span>
                  </span>
                  <span class="compte__action">Utiliser</span>
                </button>
              </li>
            }
          </ul>
        </section>

        <p class="lien-aide"><a [routerLink]="chemins.aide">En savoir plus sur les limites</a></p>
      </div>
    </section>
  `,
  styleUrl: './auth.component.css',
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
  readonly motDePasseVisible = signal(false);

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

  /** Icône associée au rôle d'un compte de démonstration. */
  iconeRole(compte: CompteDemo): NomIcone {
    const icones: Record<CompteDemo['role'], NomIcone> = {
      ADMIN: 'bouclier',
      PRODUCTEUR: 'pousse',
      ACHETEUR: 'panier',
      LIVREUR: 'camion',
    };
    return icones[compte.role];
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
