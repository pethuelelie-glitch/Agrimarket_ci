import { fraisLivraison } from '../config';
import { Categorie, Produit, Unite, Utilisateur } from '../models';
import { ItemPanier } from '../models/panier';
import { estDisponible } from '../catalogue/disponibilite';

/**
 * Construction du résumé du panier (tasks 6.3 et 6.4).
 *
 * Ces fonctions sont pures : elles reçoivent les articles du panier et les
 * collections de référence (produits, utilisateurs) et renvoient un résumé
 * entièrement dérivé. Aucune donnée n'est dupliquée dans le panier lui-même.
 */

/** État de disponibilité d'une ligne au moment du calcul. */
export type EtatLigne = 'DISPONIBLE' | 'PRODUIT_SUPPRIME' | 'INACTIF' | 'EPUISE' | 'INSUFFISANT';

/** Une ligne de panier enrichie de son produit et de son état. */
export interface LignePanier {
  readonly produitId: string;
  readonly nom: string;
  readonly unite: Unite;
  readonly categorie: Categorie | null;
  readonly quantite: number;
  readonly prixUnitaire: number;
  readonly sousTotal: number;
  readonly etat: EtatLigne;
  /** Quantité maximale commandable (stock disponible, 0 si supprimé/épuisé). */
  readonly maximum: number;
  /** Message expliquant l'indisponibilité, ou `null` si la ligne est commandable. */
  readonly probleme: string | null;
}

/** Articles regroupés par producteur, avec leurs frais de livraison. */
export interface GroupeProducteur {
  readonly producteurId: string;
  readonly producteurNom: string;
  readonly localisation: string;
  readonly lignes: readonly LignePanier[];
  readonly montantProduits: number;
  readonly fraisLivraison: number;
  readonly total: number;
}

/** Résumé complet du panier affiché à l'acheteur. */
export interface ResumePanier {
  readonly groupes: readonly GroupeProducteur[];
  /** Somme des quantités de toutes les lignes (indicateur de navigation). */
  readonly nombreArticles: number;
  readonly nombreLignes: number;
  readonly montantProduits: number;
  readonly fraisLivraison: number;
  readonly total: number;
  /** Vrai si toutes les lignes sont commandables. */
  readonly validable: boolean;
}

function messageProbleme(etat: EtatLigne, maximum: number): string | null {
  switch (etat) {
    case 'DISPONIBLE':
      return null;
    case 'PRODUIT_SUPPRIME':
      return 'Ce produit n’est plus proposé : retirez-le de votre panier.';
    case 'INACTIF':
      return 'Ce produit a été désactivé par son producteur : retirez-le de votre panier.';
    case 'EPUISE':
      return 'Rupture de stock : ce produit n’est plus disponible.';
    case 'INSUFFISANT':
      return `Stock insuffisant : ${maximum} disponible(s) seulement.`;
  }
}

function etatLigne(produit: Produit | null, quantite: number): EtatLigne {
  if (!produit) {
    return 'PRODUIT_SUPPRIME';
  }
  if (!produit.actif) {
    return 'INACTIF';
  }
  if (produit.quantiteDisponible <= 0) {
    return 'EPUISE';
  }
  if (quantite > produit.quantiteDisponible) {
    return 'INSUFFISANT';
  }
  return 'DISPONIBLE';
}

/** Construit une ligne enrichie à partir d'un article brut. */
export function enrichirLigne(item: ItemPanier, produit: Produit | null): LignePanier {
  const etat = etatLigne(produit, item.quantite);
  const maximum = produit ? produit.quantiteDisponible : 0;
  const prixUnitaire = produit ? produit.prix : 0;

  return {
    produitId: item.produitId,
    nom: produit ? produit.nom : 'Produit supprimé',
    unite: produit ? produit.unite : 'PIECE',
    categorie: produit ? produit.categorie : null,
    quantite: item.quantite,
    prixUnitaire,
    sousTotal: prixUnitaire * item.quantite,
    etat,
    maximum,
    probleme: messageProbleme(etat, maximum),
  };
}

/**
 * Regroupe les articles par producteur et calcule tous les montants.
 * Les frais de livraison sont calculés par producteur (décision D7) à partir de
 * la localisation du producteur, et disparaissent avec son groupe.
 */
export function construireResume(
  items: readonly ItemPanier[],
  produits: readonly Produit[],
  utilisateurs: readonly Utilisateur[],
): ResumePanier {
  const produitsParId = new Map(produits.map((produit) => [produit.id, produit]));
  const utilisateursParId = new Map(utilisateurs.map((u) => [u.id, u]));

  const lignes = items.map((item) => {
    const produit = produitsParId.get(item.produitId) ?? null;
    return { item, produit, ligne: enrichirLigne(item, produit) };
  });

  const groupesParProducteur = new Map<string, LignePanier[]>();
  for (const entree of lignes) {
    const producteurId = entree.produit?.producteurId ?? 'inconnu';
    const existant = groupesParProducteur.get(producteurId);
    if (existant) {
      existant.push(entree.ligne);
    } else {
      groupesParProducteur.set(producteurId, [entree.ligne]);
    }
  }

  const groupes: GroupeProducteur[] = [];
  for (const [producteurId, lignesGroupe] of groupesParProducteur) {
    const producteur = utilisateursParId.get(producteurId) ?? null;
    const localisation = producteur?.localisation ?? '';
    const montantProduits = lignesGroupe.reduce((total, ligne) => total + ligne.sousTotal, 0);
    const frais = producteur ? fraisLivraison(localisation) : fraisLivraison('');
    groupes.push({
      producteurId,
      producteurNom: producteur?.nom ?? 'Producteur inconnu',
      localisation,
      lignes: lignesGroupe,
      montantProduits,
      fraisLivraison: frais,
      total: montantProduits + frais,
    });
  }

  // Ordre stable : par nom de producteur.
  groupes.sort((gauche, droite) => gauche.producteurNom.localeCompare(droite.producteurNom));

  const toutesLesLignes = lignes.map((entree) => entree.ligne);
  const montantProduits = toutesLesLignes.reduce((total, ligne) => total + ligne.sousTotal, 0);
  const fraisTotal = groupes.reduce((total, groupe) => total + groupe.fraisLivraison, 0);

  return {
    groupes,
    nombreArticles: toutesLesLignes.reduce((total, ligne) => total + ligne.quantite, 0),
    nombreLignes: toutesLesLignes.length,
    montantProduits,
    fraisLivraison: fraisTotal,
    total: montantProduits + fraisTotal,
    validable:
      toutesLesLignes.length > 0 && toutesLesLignes.every((ligne) => ligne.etat === 'DISPONIBLE'),
  };
}

/** Un article du panier est-il commandable en l'état ? */
export function ligneDisponible(produit: Produit | null): boolean {
  return produit !== null && estDisponible(produit);
}
