import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  NOMBRE_PRODUITS_MISE_EN_AVANT,
  selectionnerMiseEnAvant,
} from '../../core/catalogue/selection';
import { CHEMINS, cheminTableauDeBord } from '../../core/navigation';
import { CATEGORIES, Categorie, LIBELLES_CATEGORIE, Produit } from '../../core/models';
import { AjoutPanierService } from '../../core/panier/ajout-panier.service';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { AuthService } from '../../core/services/auth.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { IconeComponent, NomIcone } from '../../shared/icone.component';
import { MontantFcfaPipe } from '../../shared/montant-fcfa.pipe';
import { ProduitCarteComponent } from '../../shared/produit-carte.component';

/** Habillage visuel d'une catégorie (icône et teinte d'accent). */
const HABILLAGE_CATEGORIE: Readonly<Record<Categorie, { icone: NomIcone; teinte: string }>> = {
  CEREALES: { icone: 'epi', teinte: '#c98a0b' },
  LEGUMES: { icone: 'carotte', teinte: '#2f9e5b' },
  FRUITS: { icone: 'pomme', teinte: '#e0611a' },
  TUBERCULES: { icone: 'tubercule', teinte: '#9a6a3a' },
  LEGUMINEUSES: { icone: 'graine', teinte: '#a3452f' },
  TRANSFORMES: { icone: 'bouteille', teinte: '#c2410c' },
};

/** Un rayon du marché : une catégorie et son nombre de produits actifs. */
export interface Rayon {
  readonly categorie: Categorie;
  readonly libelle: string;
  readonly nombre: number;
  readonly icone: NomIcone;
  readonly teinte: string;
}

/**
 * Page d'accueil (tasks 4.3 et 4.4) : présentation de la marketplace, accès
 * directs adaptés au rôle, recherche rapide, rayons par catégorie, chiffres
 * clés et mise en avant des six produits actifs les plus récents. Gère
 * explicitement l'état vide et l'erreur de chargement.
 *
 * Tous les chiffres affichés sont calculés à partir des données locales.
 */
@Component({
  selector: 'app-accueil',
  imports: [RouterLink, EtatVideComponent, IconeComponent, MontantFcfaPipe, ProduitCarteComponent],
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

  /** Saisie de la recherche rapide du bandeau. */
  readonly recherche = signal('');

  get cheminTableauDeBordCourant(): string {
    const utilisateur = this.utilisateurCourant();
    return utilisateur ? cheminTableauDeBord(utilisateur.role) : CHEMINS.tableauDeBord;
  }

  /** Signal local, piloté par la lecture du stockage (aucun appel réseau). */
  private readonly _erreurChargement = signal<string | null>(null);
  readonly erreurChargement = this._erreurChargement.asReadonly();

  readonly avertissementStockage = this.persistence.avertissement;

  private readonly produitsActifs = computed(() =>
    this.persistence.etat().products.filter((produit) => produit.actif),
  );

  readonly produitsEnAvant = computed(() =>
    selectionnerMiseEnAvant(this.persistence.etat().products),
  );

  /** Produit actif le plus récent, présenté dans le visuel du bandeau. */
  readonly dernierProduit = computed<Produit | null>(() => this.produitsEnAvant()[0] ?? null);

  /** Chiffres clés, calculés à partir des données locales. */
  readonly statistiques = computed(() => {
    const etat = this.persistence.etat();
    const actifs = this.produitsActifs();
    return {
      produits: actifs.length,
      producteurs: etat.users.filter((u) => u.role === 'PRODUCTEUR' && u.actif).length,
      villes: new Set(actifs.map((p) => p.localisation.trim().toLowerCase())).size,
      categories: CATEGORIES.length,
    };
  });

  /** Les six rayons, avec le nombre de produits actifs de chacun. */
  readonly rayons = computed<readonly Rayon[]>(() => {
    const actifs = this.produitsActifs();
    return CATEGORIES.map((categorie) => ({
      categorie,
      libelle: LIBELLES_CATEGORIE[categorie],
      nombre: actifs.filter((produit) => produit.categorie === categorie).length,
      ...HABILLAGE_CATEGORIE[categorie],
    }));
  });

  constructor() {
    this.evaluerChargement();
  }

  /** Ouvre le catalogue filtré par la recherche saisie dans le bandeau. */
  rechercher(evenement: Event): void {
    evenement.preventDefault();
    const terme = this.recherche().trim();
    void this.router.navigate([CHEMINS.catalogue], {
      queryParams: terme ? { q: terme } : {},
    });
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
