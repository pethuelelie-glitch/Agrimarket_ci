import { Component, computed, inject, signal } from '@angular/core';
import {
  CRITERES_PAR_DEFAUT,
  CriteresCatalogue,
  Disponibilite,
  LIBELLES_TRI,
  TRI_DEFAUT,
  TriCatalogue,
  appliquerCriteres,
  filtresActifs,
} from '../../core/catalogue/filtres';
import { CATEGORIES, Categorie, LIBELLES_CATEGORIE, Produit } from '../../core/models';
import { AjoutPanierService } from '../../core/panier/ajout-panier.service';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { ProduitCarteComponent } from '../../shared/produit-carte.component';

/**
 * Page catalogue (tasks 5.5 et 5.6).
 *
 * Le catalogue public n'expose que les produits **actifs** ; la recherche, les
 * filtres combinables et le tri sont appliqués en mémoire sur ce sous-ensemble.
 */
@Component({
  selector: 'app-catalogue',
  imports: [EtatVideComponent, ProduitCarteComponent],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css',
})
export class CatalogueComponent {
  readonly categories = CATEGORIES;
  readonly libellesCategorie = LIBELLES_CATEGORIE;
  readonly libellesTri = LIBELLES_TRI;
  readonly tris: readonly TriCatalogue[] = ['date-desc', 'date-asc', 'prix-asc', 'prix-desc'];

  private readonly persistence = inject(PersistenceService);
  private readonly ajoutPanier = inject(AjoutPanierService);

  readonly recherche = signal('');
  readonly categorie = signal<Categorie | 'TOUTES'>('TOUTES');
  readonly prixMin = signal<number | null>(null);
  readonly prixMax = signal<number | null>(null);
  readonly disponibilite = signal<Disponibilite>('TOUS');
  readonly localisation = signal('');
  readonly tri = signal<TriCatalogue>(TRI_DEFAUT);

  readonly criteres = computed<CriteresCatalogue>(() => ({
    ...CRITERES_PAR_DEFAUT,
    recherche: this.recherche(),
    categorie: this.categorie(),
    prixMin: this.prixMin(),
    prixMax: this.prixMax(),
    disponibilite: this.disponibilite(),
    localisation: this.localisation(),
  }));

  /** Catalogue public : seuls les produits actifs sont exposés. */
  private readonly base = computed(() =>
    this.persistence.etat().products.filter((produit) => produit.actif),
  );

  readonly resultats = computed(() =>
    appliquerCriteres(this.base(), this.criteres(), this.tri()),
  );

  readonly catalogueVide = computed(() => this.base().length === 0);
  readonly aucunResultat = computed(
    () => !this.catalogueVide() && this.resultats().length === 0,
  );
  readonly aDesFiltresActifs = computed(() => filtresActifs(this.criteres()));

  /** Convertit la saisie d'un champ numérique en nombre, ou `null` si vide. */
  nombreOuNull(evenement: Event): number | null {
    const valeur = (evenement.target as HTMLInputElement).value.trim();
    if (valeur === '') {
      return null;
    }
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? nombre : null;
  }

  /** Remet tous les filtres à zéro (le tri choisi est conservé). */
  reinitialiser(): void {
    this.recherche.set('');
    this.categorie.set('TOUTES');
    this.prixMin.set(null);
    this.prixMax.set(null);
    this.disponibilite.set('TOUS');
    this.localisation.set('');
  }

  /** Ajoute un produit au panier (redirige un visiteur vers la connexion). */
  ajouterAuPanier(produit: Produit): void {
    this.ajoutPanier.ajouter(produit.id);
  }
}
