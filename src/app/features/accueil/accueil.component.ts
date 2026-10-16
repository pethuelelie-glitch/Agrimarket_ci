import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NOMBRE_PRODUITS_MISE_EN_AVANT, selectionnerMiseEnAvant } from '../../core/catalogue/selection';
import { CHEMINS, cheminTableauDeBord } from '../../core/navigation';
import { Produit } from '../../core/models';
import { AjoutPanierService } from '../../core/panier/ajout-panier.service';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { AuthService } from '../../core/services/auth.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { ProduitCarteComponent } from '../../shared/produit-carte.component';

/**
 * Page d'accueil (tasks 4.3 et 4.4) : présentation de la marketplace, accès
 * directs adaptés au rôle, et mise en avant des six produits actifs les plus
 * récents. Gère explicitement l'état vide et l'erreur de chargement.
 */
@Component({
  selector: 'app-accueil',
  imports: [RouterLink, EtatVideComponent, ProduitCarteComponent],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent {
  readonly chemins = CHEMINS;
  readonly nombreMiseEnAvant = NOMBRE_PRODUITS_MISE_EN_AVANT;

  private readonly persistence = inject(PersistenceService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly ajoutPanier = inject(AjoutPanierService);

  readonly utilisateurCourant = this.auth.utilisateurCourant;

  get cheminTableauDeBordCourant(): string {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? cheminTableauDeBord(utilisateur.role) : CHEMINS.tableauDeBord;
  }

  /** Signal local, piloté par la lecture du stockage (aucun appel réseau). */
  private readonly _erreurChargement = signal<string | null>(null);
  readonly erreurChargement = this._erreurChargement.asReadonly();

  readonly avertissementStockage = this.persistence.avertissement;

  readonly produitsEnAvant = computed(() =>
    selectionnerMiseEnAvant(this.persistence.etat().products),
  );

  constructor() {
    this.evaluerChargement();
  }

  /** Relit le stockage local : c'est le « réessai » proposé à l'utilisateur. */
  reessayer(): void {
    this.persistence.charger();
    this.evaluerChargement();
  }

  /** Revenir à un état sain après un avertissement, en réinitialisant si besoin. */
  reinitialiser(): void {
    void this.amorcer().then(() => {
      this.persistence.effacerAvertissement();
      this.evaluerChargement();
    });
  }

  voirCatalogue(): void {
    void this.router.navigate([CHEMINS.catalogue]);
  }

  /** Ajoute un produit mis en avant au panier. */
  ajouterAuPanier(produit: Produit): void {
    this.ajoutPanier.ajouter(produit.id);
  }

  private async amorcer(): Promise<void> {
    const { amorcerDonneesDemo } = await import('../../core/data/initialisation');
    await amorcerDonneesDemo(this.persistence, { forcer: true });
  }

  /**
   * Une erreur de chargement est signalée lorsque le stockage local est
   * inaccessible ou contient des données illisibles (task 4.4).
   */
  private evaluerChargement(): void {
    const avertissement = this.persistence.avertissement();
    if (avertissement) {
      this._erreurChargement.set(avertissement);
      return;
    }
    if (!this.persistence.etat().meta.initialized) {
      this._erreurChargement.set(
        "Les données locales n'ont pas pu être chargées. Vous pouvez réessayer.",
      );
      return;
    }
    this._erreurChargement.set(null);
  }
}
