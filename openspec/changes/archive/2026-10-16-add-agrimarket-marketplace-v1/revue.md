# Revue avant archivage — AgriMarket CI v1

Document de revue lié aux tasks 11.4, 11.5 et 11.6 du changement
`add-agrimarket-marketplace-v1`. Il consigne les valeurs retenues, la couverture
des dix capacités et les écarts éventuels à traiter avant archivage.

## 1. État de la vérification globale (task 11.5)

| Contrôle                | Commande                    | Résultat                                                |
| ----------------------- | --------------------------- | ------------------------------------------------------- |
| Suite de tests complète | `npx ng test --watch=false` | **374 tests / 43 fichiers — au vert**                   |
| Build de production     | `npx ng build`              | **Succès, aucune erreur stricte**                       |
| Test racine d'origine   | `src/app/app.spec.ts`       | Présent et passant (coquille, navigation, badge panier) |

## 2. Points de revue fonctionnelle (task 11.4)

Ces règles ont été implémentées sur hypothèses (décisions D7/D8/D10 du
`design.md`). Elles doivent être **validées avec l'enseignant**. Les valeurs
retenues sont figées par des tests afin qu'un éventuel ajustement soit explicite.

| Point                         | Valeur retenue                                                            | Justification                                 | Test de référence                                                                         |
| ----------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **D7 — frais de livraison**   | 1 500 FCFA (Abidjan), 2 000 FCFA (villes secondaires), 2 500 FCFA (autre) | Barème simple, base 1 000 + zone              | `core/config.spec.ts`, `integration/parcours.spec.ts` (« Points de revue fonctionnelle ») |
| **D8 — éclatement du panier** | Une commande distincte par producteur, créées dans la même transaction    | Un producteur ne peut traiter que sa commande | `core/services/order.service.spec.ts`, `integration/parcours.spec.ts` (multi-producteurs) |
| **D10 — unicité de rôle**     | Un compte a exactement un rôle ; `ADMIN` non auto-inscriptible            | Simplifie le contrôle d'accès local           | `core/permissions/permissions.spec.ts`, `integration/parcours.spec.ts`                    |

**Statut** : ⏳ **À valider avec l'enseignant.** En l'absence de retour, les
valeurs ci-dessus restent en vigueur et sont vérifiées automatiquement. Si une
règle diffère, ajuster `core/config.ts` (frais, zones) ou les spécifications
(`specs/`) puis mettre à jour les tests cités.

## 3. Couverture des dix capacités (task 11.6)

Chaque capacité de `specs/` est couverte par au moins un test automatisé.

| Capacité              | Exigences principales                                                 | Couverture automatisée                                                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storefront`          | Accueil, navigation, pages 404                                        | `features/accueil/accueil.component.spec.ts`, `app.spec.ts`                                                                                                                                                                                        |
| `user-auth`           | Inscription, connexion, déconnexion, hachage                          | `core/services/auth.service.spec.ts`, `features/auth/connexion.component.spec.ts`, `features/auth/inscription.component.spec.ts`, `shared/deconnexion-bouton.component.spec.ts`                                                                    |
| `access-control`      | Permissions par rôle, périmètre de données, guards                    | `core/permissions/permissions.spec.ts`, `core/guards/auth.guard.spec.ts`, `shared/si-autorise.spec.ts`                                                                                                                                             |
| `product-catalog`     | Consultation, filtres, disponibilité, CRUD producteur                 | `core/services/catalogue.service.spec.ts`, `core/catalogue/filtres.spec.ts`, `core/catalogue/disponibilite.spec.ts`, `core/catalogue/selection.spec.ts`, `features/catalogue/*.spec.ts`, `features/produits/produits-producteur.component.spec.ts` |
| `shopping-cart`       | Ajout, quantités, résumé, assainissement                              | `core/panier/ajout-panier.service.spec.ts`, `core/services/cart.service.spec.ts`, `features/panier/panier.component.spec.ts`, `shared/bouton-ajout-panier.component.spec.ts`                                                                       |
| `order-management`    | Création, transitions, annulation, adresse                            | `core/commandes/transitions.spec.ts`, `core/services/order.service.spec.ts`, `features/commandes/*.spec.ts`                                                                                                                                        |
| `delivery-management` | Création, affectation, statuts, commentaire d'échec                   | `core/services/delivery.service.spec.ts`, `features/livraisons/*.spec.ts`, `features/commandes/detail-commande.component.spec.ts`                                                                                                                  |
| `dashboard`           | Indicateurs par rôle, évolution 14 jours, cohérence avec les listes   | `core/services/dashboard.service.spec.ts`, `features/tableaux-de-bord/tableaux-de-bord.spec.ts`                                                                                                                                                    |
| `admin-oversight`     | Comptes, rôles, activation, modération, supervision, réinitialisation | `core/services/admin.service.spec.ts`, `features/admin/admin-pages.spec.ts`                                                                                                                                                                        |
| `local-persistence`   | Amorçage, schéma, atomicité, robustesse                               | `core/persistence/persistence.service.spec.ts`, `core/data/initialisation.spec.ts`, `core/data/seed.spec.ts`, `integration/parcours.spec.ts`                                                                                                       |

### Écarts et limites assumés

- **Aucun écart bloquant** identifié : chaque exigence des dix capacités possède
  au moins une couverture automatisée.
- **Vérifications manuelles documentées** : la validité responsive et le rendu
  visuel (mentionnés dans `specs/storefront`) restent vérifiés à l'œil ; ils ne
  sont pas couverts par des tests automatisés, ce qui est admis en v1.
- **Validation enseignant (11.4)** : en attente (voir §2). C'est le seul point
  ouvert avant archivage.
- **Hors périmètre** : déploiement Vercel et publication GitHub (à décider
  séparément, cf. « Workflow follow-up » de `tasks.md`).
