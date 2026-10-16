import { Component, computed, inject, signal } from '@angular/core';
import {
  CATEGORIES,
  DonneesFormulaireProduit,
  LIBELLES_CATEGORIE,
  LIBELLES_UNITE,
  Produit,
  UNITES,
  formulaireProduitVide,
} from '../../core/models';
import { produitsGerables } from '../../core/permissions/permissions';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/** Convertit un produit existant en données de formulaire. */
function versFormulaire(produit: Produit): DonneesFormulaireProduit {
  return {
    nom: produit.nom,
    description: produit.description,
    categorie: produit.categorie,
    prix: produit.prix,
    unite: produit.unite,
    quantiteDisponible: produit.quantiteDisponible,
    localisation: produit.localisation,
    imageUrl: produit.imageUrl,
  };
}

/**
 * Espace producteur de gestion des produits (task 5.8).
 *
 * Liste les produits **gérables** par le producteur connecté (les siens), avec
 * statut et stock, et propose création, modification, suppression (confirmation
 * en ligne) et ajustement du stock.
 */
@Component({
  selector: 'app-produits-producteur',
  imports: [EtatVideComponent, MontantFcfaPipe],
  templateUrl: './produits-producteur.component.html',
  styleUrl: './produits-producteur.component.css',
})
export class ProduitsProducteurComponent {
  readonly categories = CATEGORIES;
  readonly unites = UNITES;
  readonly libellesCategorie = LIBELLES_CATEGORIE;
  readonly libellesUnite = LIBELLES_UNITE;

  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);
  private readonly catalogue = inject(CatalogueService);
  private readonly notifications = inject(NotificationsService);

  readonly formulaireOuvert = signal(false);
  readonly produitEnEdition = signal<string | null>(null);
  readonly formulaire = signal<DonneesFormulaireProduit>(formulaireProduitVide());
  readonly erreurs = signal<Readonly<Record<string, string>>>({});
  readonly suppressionEnAttente = signal<string | null>(null);
  readonly stockEnEdition = signal<string | null>(null);
  readonly stockSaisi = signal(0);

  /** Produits que le producteur connecté peut gérer. */
  readonly produits = computed(() =>
    produitsGerables(this.auth.utilisateurCourant(), this.persistence.etat().products),
  );

  readonly estVide = computed(() => this.produits().length === 0);

  readonly titreFormulaire = computed(() =>
    this.produitEnEdition() ? 'Modifier un produit' : 'Nouveau produit',
  );

  /* -------------------------------------------------------------- formulaire */

  nouveauProduit(): void {
    this.produitEnEdition.set(null);
    this.formulaire.set(formulaireProduitVide());
    this.erreurs.set({});
    this.formulaireOuvert.set(true);
  }

  modifier(produit: Produit): void {
    this.produitEnEdition.set(produit.id);
    this.formulaire.set(versFormulaire(produit));
    this.erreurs.set({});
    this.formulaireOuvert.set(true);
  }

  annulerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.produitEnEdition.set(null);
    this.erreurs.set({});
  }

  majChamp(champ: keyof DonneesFormulaireProduit, valeur: string | number): void {
    this.formulaire.update((courant) => ({ ...courant, [champ]: valeur }));
  }

  majTexte(champ: keyof DonneesFormulaireProduit, evenement: Event): void {
    this.majChamp(champ, (evenement.target as HTMLInputElement).value);
  }

  majNombre(champ: keyof DonneesFormulaireProduit, evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value.trim();
    this.majChamp(champ, valeur === '' ? 0 : Number(valeur));
  }

  enregistrer(): void {
    const donnees = this.formulaire();
    const identifiant = this.produitEnEdition();
    const resultat = identifiant
      ? this.catalogue.modifier(identifiant, donnees)
      : this.catalogue.creer(donnees);

    if (!resultat.succes) {
      this.erreurs.set(resultat.erreursChamps);
      this.notifications.informer(resultat.message);
      return;
    }

    this.notifications.informer(resultat.message);
    this.annulerFormulaire();
  }

  /** Message d'erreur d'un champ, ou `null`. */
  erreurDe(champ: string): string | null {
    return this.erreurs()[champ] ?? null;
  }

  /* -------------------------------------------------------------- suppression */

  demanderSuppression(produitId: string): void {
    this.suppressionEnAttente.set(produitId);
  }

  annulerSuppression(): void {
    this.suppressionEnAttente.set(null);
  }

  confirmerSuppression(produitId: string): void {
    const resultat = this.catalogue.supprimer(produitId);
    this.notifications.informer(resultat.message);
    this.suppressionEnAttente.set(null);
  }

  /* -------------------------------------------------------------------- stock */

  basculerActivation(produitId: string): void {
    const resultat = this.catalogue.basculerActivation(produitId);
    this.notifications.informer(resultat.message);
  }

  ouvrirStock(produit: Produit): void {
    this.stockEnEdition.set(produit.id);
    this.stockSaisi.set(produit.quantiteDisponible);
  }

  annulerStock(): void {
    this.stockEnEdition.set(null);
  }

  majStockSaisi(evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value.trim();
    this.stockSaisi.set(valeur === '' ? 0 : Number(valeur));
  }

  confirmerStock(produitId: string): void {
    const resultat = this.catalogue.ajusterStock(produitId, this.stockSaisi());
    this.notifications.informer(resultat.message);
    if (resultat.succes) {
      this.stockEnEdition.set(null);
    }
  }

  /** Quantité minimale autorisée pour ce produit (commandes en cours). */
  minimumStock(produitId: string): number {
    return this.catalogue.quantiteEngagee(produitId);
  }

  dateCourte(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(iso));
  }
}
