import { FENETRE_EVOLUTION_JOURS } from '../config';
import {
  Commande,
  EtatApplication,
  Livraison,
  STATUTS_COMMANDE,
  StatutCommande,
  Utilisateur,
} from '../models';

/**
 * Calculs des indicateurs de tableau de bord (décision D13).
 *
 * Ces fonctions sont **pures** : elles reçoivent l'état et, le cas échéant,
 * l'utilisateur et la date de référence, et ne renvoient que des valeurs
 * dérivées des données enregistrées — jamais de constante d'affichage.
 */

/** Point d'une série temporelle. */
export interface PointEvolution {
  /** Clé locale `AAAA-MM-JJ`. */
  readonly jour: string;
  /** Libellé court `JJ/MM`. */
  readonly libelle: string;
  readonly nombre: number;
}

export interface IndicateursAdmin {
  readonly utilisateurs: number;
  readonly producteurs: number;
  readonly produitsActifs: number;
  readonly commandesParStatut: Readonly<Record<StatutCommande, number>>;
  readonly commandesTotal: number;
  readonly livraisonsEnCours: number;
  readonly livraisonsTerminees: number;
  readonly evolution: readonly PointEvolution[];
}

export interface IndicateursProducteur {
  readonly produitsActifs: number;
  readonly stockDisponible: number;
  readonly commandesRecues: number;
  readonly quantitesVendues: number;
  readonly montantVentes: number;
}

export interface IndicateursAcheteur {
  readonly commandesEnCours: number;
  readonly commandesLivrees: number;
  readonly commandesTotal: number;
}

export interface IndicateursLivreur {
  readonly missionsAttribuees: number;
  readonly enCours: number;
  readonly terminees: number;
  readonly enEchec: number;
}

/* ------------------------------------------------------------------ utilitaires */

/** Clé locale `AAAA-MM-JJ` d'une date (regroupement sur la date locale). */
export function cleJour(date: Date): string {
  const annee = date.getFullYear();
  const mois = `${date.getMonth() + 1}`.padStart(2, '0');
  const jour = `${date.getDate()}`.padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
}

/** Libellé court `JJ/MM`. */
export function libelleJour(date: Date): string {
  const mois = `${date.getMonth() + 1}`.padStart(2, '0');
  const jour = `${date.getDate()}`.padStart(2, '0');
  return `${jour}/${mois}`;
}

/**
 * Série du nombre de commandes par jour sur une fenêtre glissante de `jours`
 * jours, se terminant au jour de `maintenant` (décision D13).
 */
export function serieEvolution(
  commandes: readonly Commande[],
  maintenant: Date,
  jours: number = FENETRE_EVOLUTION_JOURS,
): readonly PointEvolution[] {
  const comptes = new Map<string, number>();
  for (const commande of commandes) {
    const jour = cleJour(new Date(commande.dateCreation));
    comptes.set(jour, (comptes.get(jour) ?? 0) + 1);
  }

  const points: PointEvolution[] = [];
  const base = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  for (let decalage = jours - 1; decalage >= 0; decalage -= 1) {
    const jour = new Date(base.getFullYear(), base.getMonth(), base.getDate() - decalage);
    const cle = cleJour(jour);
    points.push({ jour: cle, libelle: libelleJour(jour), nombre: comptes.get(cle) ?? 0 });
  }
  return points;
}

/** Une livraison est active si elle n'est ni livrée ni en échec. */
function estActive(livraison: Livraison): boolean {
  return livraison.statut !== 'LIVREE' && livraison.statut !== 'ECHEC';
}

/** Une commande est en cours si elle n'est ni livrée ni annulée. */
function estEnCours(commande: Commande): boolean {
  return commande.statut !== 'LIVREE' && commande.statut !== 'ANNULEE';
}

/* ------------------------------------------------------------------ admin */

export function indicateursAdmin(etat: EtatApplication, maintenant: Date): IndicateursAdmin {
  const commandesParStatut = Object.fromEntries(
    STATUTS_COMMANDE.map((statut) => [statut, 0]),
  ) as Record<StatutCommande, number>;
  for (const commande of etat.orders) {
    commandesParStatut[commande.statut] += 1;
  }

  return {
    utilisateurs: etat.users.length,
    producteurs: etat.users.filter((utilisateur) => utilisateur.role === 'PRODUCTEUR').length,
    produitsActifs: etat.products.filter((produit) => produit.actif).length,
    commandesParStatut,
    commandesTotal: etat.orders.length,
    livraisonsEnCours: etat.deliveries.filter(estActive).length,
    livraisonsTerminees: etat.deliveries.filter((livraison) => livraison.statut === 'LIVREE').length,
    evolution: serieEvolution(etat.orders, maintenant),
  };
}

/* ------------------------------------------------------------------ producteur */

export function indicateursProducteur(
  etat: EtatApplication,
  utilisateur: Utilisateur | null,
): IndicateursProducteur {
  if (!utilisateur) {
    return {
      produitsActifs: 0,
      stockDisponible: 0,
      commandesRecues: 0,
      quantitesVendues: 0,
      montantVentes: 0,
    };
  }

  const produits = etat.products.filter((produit) => produit.producteurId === utilisateur.id);
  const produitsActifs = produits.filter((produit) => produit.actif);
  const commandes = etat.orders.filter((commande) => commande.producteurId === utilisateur.id);
  const commandesRetenues = commandes.filter((commande) => commande.statut !== 'ANNULEE');

  return {
    produitsActifs: produitsActifs.length,
    // Stock réellement commercialisable : seuls les produits actifs comptent.
    stockDisponible: produitsActifs.reduce(
      (total, produit) => total + produit.quantiteDisponible,
      0,
    ),
    commandesRecues: commandes.length,
    quantitesVendues: commandesRetenues.reduce(
      (total, commande) =>
        total + commande.lignes.reduce((sousTotal, ligne) => sousTotal + ligne.quantite, 0),
      0,
    ),
    montantVentes: commandesRetenues.reduce(
      (total, commande) => total + commande.montantTotal,
      0,
    ),
  };
}

/* ------------------------------------------------------------------ acheteur */

export function indicateursAcheteur(
  etat: EtatApplication,
  utilisateur: Utilisateur | null,
): IndicateursAcheteur {
  if (!utilisateur) {
    return { commandesEnCours: 0, commandesLivrees: 0, commandesTotal: 0 };
  }

  const commandes = etat.orders.filter((commande) => commande.acheteurId === utilisateur.id);
  return {
    commandesEnCours: commandes.filter(estEnCours).length,
    commandesLivrees: commandes.filter((commande) => commande.statut === 'LIVREE').length,
    commandesTotal: commandes.length,
  };
}

/* ------------------------------------------------------------------ livreur */

export function indicateursLivreur(
  etat: EtatApplication,
  utilisateur: Utilisateur | null,
): IndicateursLivreur {
  if (!utilisateur) {
    return { missionsAttribuees: 0, enCours: 0, terminees: 0, enEchec: 0 };
  }

  const missions = etat.deliveries.filter((livraison) => livraison.livreurId === utilisateur.id);
  return {
    missionsAttribuees: missions.length,
    enCours: missions.filter(
      (livraison) => livraison.statut === 'ASSIGNEE' || livraison.statut === 'EN_COURS',
    ).length,
    terminees: missions.filter((livraison) => livraison.statut === 'LIVREE').length,
    enEchec: missions.filter((livraison) => livraison.statut === 'ECHEC').length,
  };
}
