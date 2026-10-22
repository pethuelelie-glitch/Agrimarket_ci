import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGE_SECOURS } from '../../core/data/seed';
import { LIBELLES_CATEGORIE, LIBELLES_UNITE, Produit } from '../../core/models';
import { CHEMINS, cheminProduit } from '../../core/navigation';
import { AjoutPanierService } from '../../core/panier/ajout-panier.service';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { BoutonAjoutPanierComponent } from '../../shared/bouton-ajout-panier.component';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { IconeComponent } from '../../shared/icone.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';

/**
 * Fiche détaillée d'un produit (task 5.7).
 *
 * L'identifiant provient du paramètre d'URL `id` (liaison automatique activée
 * par `withComponentInputBinding`). Un identifiant inconnu affiche « produit
 * introuvable » avec un retour vers le catalogue.
 */
@Component({
  selector: 'app-fiche-produit',
  imports: [
    RouterLink,
    EtatVideComponent,
    BoutonAjoutPanierComponent,
    IconeComponent,
    MontantFcfaPipe,
  ],
  templateUrl: './fiche-produit.component.html',
  styleUrl: './fiche-produit.component.css',
})
export class FicheProduitComponent {
  readonly id = input.required<string>();
  readonly chemins = CHEMINS;

  private readonly catalogue = inject(CatalogueService);
  private readonly persistence = inject(PersistenceService);
  private readonly ajoutPanier = inject(AjoutPanierService);

  /** URL d'image qui a échoué, pour ne pas rebasculer indéfiniment sur le secours. */
  private readonly urlEnEchec = signal<string | null>(null);

  readonly produit = computed<Produit | null>(() => this.catalogue.trouver(this.id()));

  readonly producteur = computed(() => {
    const produit = this.produit();
    if (!produit) {
      return null;
    }
    return this.persistence.etat().users.find((u) => u.id === produit.producteurId) ?? null;
  });

  /** Autres produits actifs du même producteur (au plus trois). */
  readonly autresProduits = computed<Produit[]>(() => {
    const produit = this.produit();
    if (!produit) {
      return [];
    }
    return this.persistence
      .etat()
      .products.filter(
        (autre) =>
          autre.actif && autre.producteurId === produit.producteurId && autre.id !== produit.id,
      )
      .slice(0, 3);
  });

  /** Initiales du producteur pour son avatar. */
  readonly initialesProducteur = computed(() =>
    (this.producteur()?.nom ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot.charAt(0).toUpperCase())
      .join(''),
  );

  readonly enStock = computed(() => (this.produit()?.quantiteDisponible ?? 0) > 0);

  cheminDe(produit: Produit): string {
    return cheminProduit(produit.id);
  }

  readonly libelleCategorie = computed(() => {
    const produit = this.produit();
    return produit ? LIBELLES_CATEGORIE[produit.categorie] : '';
  });

  readonly libelleUnite = computed(() => {
    const produit = this.produit();
    return produit ? LIBELLES_UNITE[produit.unite] : '';
  });

  /** Date de mise en ligne, lisible en français. */
  readonly dateMiseEnLigne = computed(() => {
    const produit = this.produit();
    if (!produit) {
      return '';
    }
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
      new Date(produit.dateCreation),
    );
  });

  readonly imageAffichee = computed(() => {
    const produit = this.produit();
    if (!produit || !produit.imageUrl || this.urlEnEchec() === produit.imageUrl) {
      return IMAGE_SECOURS;
    }
    return produit.imageUrl;
  });

  basculerSurSecours(): void {
    this.urlEnEchec.set(this.produit()?.imageUrl ?? null);
  }

  /** Ajoute le produit courant au panier (redirige un visiteur). */
  ajouterAuPanier(): void {
    const produit = this.produit();
    if (produit) {
      this.ajoutPanier.ajouter(produit.id);
    }
  }
}
