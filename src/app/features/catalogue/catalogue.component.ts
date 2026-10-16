import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CHEMINS } from '../../core/navigation';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { peutVoirProduit } from '../../core/permissions/permissions';
import { AuthService } from '../../core/services/auth.service';
import { EtatVideComponent } from '../../shared/etat-vide.component';
import { ProduitCarteComponent } from '../../shared/produit-carte.component';

/**
 * Page catalogue (task 4.5, enrichie en task 5.6) : grille responsive des
 * produits visibles par le visiteur ou l'utilisateur courant.
 */
@Component({
  selector: 'app-catalogue',
  imports: [EtatVideComponent, ProduitCarteComponent],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css',
})
export class CatalogueComponent {
  readonly chemins = CHEMINS;

  private readonly persistence = inject(PersistenceService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly produits = computed(() => {
    const utilisateur = this.auth.utilisateurCourant();
    return this.persistence.etat().products.filter((produit) => peutVoirProduit(utilisateur, produit));
  });

  readonly aucunProduit = computed(() => this.produits().length === 0);

  retourAccueil(): void {
    void this.router.navigate([CHEMINS.accueil]);
  }
}
