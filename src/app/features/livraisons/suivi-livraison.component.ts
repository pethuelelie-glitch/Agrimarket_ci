import { Component, computed, inject, input } from '@angular/core';
import { LIBELLES_STATUT_LIVRAISON, Livraison } from '../../core/models';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { DeliveryService } from '../../core/services/delivery.service';

/**
 * Suivi de la livraison d'une commande (task 8.7) : statut, livreur, dates,
 * commentaire et historique. Si aucune livraison n'existe, un message explique
 * qu'elle sera organisée après préparation.
 */
@Component({
  selector: 'app-suivi-livraison',
  template: `
    <section class="suivi">
      <h2>Livraison</h2>
      @if (livraisons().length === 0) {
        <p class="suivi__attente">La livraison sera organisée après préparation de la commande.</p>
      } @else {
        @for (livraison of livraisons(); track livraison.id) {
          <article class="suivi__carte">
            <header class="suivi__entete">
              <strong>{{ livraison.reference }}</strong>
              <span class="badge-statut" [attr.data-statut]="livraison.statut">
                {{ libellesStatut[livraison.statut] }}
              </span>
            </header>
            <dl class="suivi__definitions">
              <dt>Livreur</dt>
              <dd>{{ nomLivreur(livraison.livreurId) }}</dd>
              <dt>Destinataire</dt>
              <dd>{{ livraison.adresseDestination }}</dd>
              <dt>Affectée le</dt>
              <dd>{{ dateHeure(livraison.dateAffectation) }}</dd>
              <dt>Livrée le</dt>
              <dd>{{ dateHeure(livraison.dateLivraison) }}</dd>
              @if (livraison.commentaire) {
                <dt>Commentaire</dt>
                <dd>{{ livraison.commentaire }}</dd>
              }
            </dl>
            @if (livraison.historique.length > 0) {
              <ol class="suivi__historique">
                @for (etape of livraison.historique; track etape.le) {
                  <li>
                    <time [attr.datetime]="etape.le">{{ dateHeure(etape.le) }}</time>
                    <span>{{ libellesStatut[etape.nouveauStatut] }}</span>
                    @if (etape.commentaire) {
                      <span class="suivi__commentaire">{{ etape.commentaire }}</span>
                    }
                  </li>
                }
              </ol>
            }
          </article>
        }
      }
    </section>
  `,
  styles: [
    `
      .suivi {
        display: grid;
        gap: 0.75rem;
      }
      .suivi h2 {
        margin: 0;
        font-size: 1.05rem;
        color: var(--vert-fonce);
      }
      .suivi__attente {
        margin: 0;
        color: var(--texte-doux);
      }
      .suivi__carte {
        display: grid;
        gap: 0.5rem;
        border: 1px solid var(--bord);
        border-radius: var(--rayon);
        padding: 0.75rem;
      }
      .suivi__entete {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        justify-content: space-between;
      }
      .suivi__definitions {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.2rem 1rem;
        margin: 0;
      }
      .suivi__definitions dt {
        color: var(--texte-doux);
        font-size: 0.88rem;
      }
      .suivi__definitions dd {
        margin: 0;
      }
      .suivi__historique {
        margin: 0;
        padding-inline-start: 1.25rem;
        display: grid;
        gap: 0.35rem;
      }
      .suivi__historique li {
        display: grid;
        gap: 0.1rem;
      }
      .suivi__historique time {
        color: var(--texte-doux);
        font-size: 0.82rem;
      }
      .suivi__commentaire {
        color: var(--texte-doux);
        font-size: 0.85rem;
        font-style: italic;
      }
    `,
  ],
})
export class SuiviLivraisonComponent {
  readonly commandeId = input.required<string>();

  readonly libellesStatut = LIBELLES_STATUT_LIVRAISON;

  private readonly delivery = inject(DeliveryService);
  private readonly persistence = inject(PersistenceService);

  readonly livraisons = computed<readonly Livraison[]>(() =>
    this.delivery.pourCommande(this.commandeId()),
  );

  nomLivreur(livreurId: string | null): string {
    if (!livreurId) {
      return 'Non attribué';
    }
    return this.persistence.etat().users.find((u) => u.id === livreurId)?.nom ?? 'Livreur inconnu';
  }

  dateHeure(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }
}
