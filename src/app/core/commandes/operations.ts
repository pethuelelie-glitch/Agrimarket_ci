import {
  EtatApplication,
  Commande,
  EvenementCommande,
  LigneCommande,
  Role,
  StatutCommande,
} from '../models';
import { construireResume } from '../panier/resume';
import { normaliserPanier } from '../panier/normalisation';
import { Resultat, succes, echec } from '../resultat';
import { genererIdentifiant, genererReference } from '../services/identifiants';
import {
  listerStatuts,
  statutCibleExiste,
  transitionsPossibles,
  transitionAutorisee,
} from './transitions';

/**
 * Opérations pures de commande, exécutées sur le brouillon d'une transaction
 * (`PersistenceService.transaction`, décision D2).
 *
 * Elles ne connaissent ni le DOM ni les services : toute la logique métier
 * (référence, instantané des prix, décrément/restitution du stock, historique,
 * couplage avec une éventuelle livraison active) est ici et testable seule.
 */

/** Résultat d'une opération qui crée ou renvoie des commandes. */
export interface ResultatCommandes extends Resultat {
  readonly commandes: readonly Commande[];
}

function resultatCommandes(message: string, commandes: readonly Commande[]): ResultatCommandes {
  return { succes: true, message, erreursChamps: {}, commandes };
}

function echecCommandes(message: string): ResultatCommandes {
  return { succes: false, message, erreursChamps: {}, commandes: [] };
}

/** Construit un événement d'historique horodaté. */
function evenement(
  statutPrecedent: StatutCommande | null,
  statut: StatutCommande,
  acteurId: string,
  le: Date,
  commentaire?: string,
): EvenementCommande {
  return {
    le: le.toISOString(),
    statutPrecedent,
    statut,
    acteurId,
    ...(commentaire ? { commentaire } : {}),
  };
}

/**
 * Crée les commandes issues du panier de l'acheteur (tasks 7.2, 7.3).
 * Une commande par producteur représenté ; stock décrémenté ligne à ligne ;
 * panier vidé. La validation est bloquée si le panier est vide, si l'adresse est
 * absente ou si un article n'est plus disponible (task 6.5).
 */
export function creerCommandesDepuisPanier(
  brouillon: EtatApplication,
  acheteurId: string,
  adresse: string,
  maintenant: Date,
): ResultatCommandes {
  const adresseNettoyee = adresse.trim();
  if (adresseNettoyee === '') {
    return echecCommandes('Renseignez une adresse de livraison avant de valider votre commande.');
  }

  const panier = normaliserPanier(brouillon.carts[acheteurId]);
  const items = panier?.items ?? [];
  if (items.length === 0) {
    return echecCommandes('Votre panier est vide : ajoutez des produits avant de valider.');
  }

  const resume = construireResume(items, brouillon.products, brouillon.users);
  const problemes = resume.groupes
    .flatMap((groupe) => groupe.lignes)
    .filter((ligne) => ligne.etat !== 'DISPONIBLE');
  if (problemes.length > 0) {
    const details = problemes.map((ligne) => `${ligne.nom} (${ligne.probleme})`).join(' ; ');
    return echecCommandes(
      `Commande impossible : certains articles ne sont plus disponibles. ${details}`,
    );
  }

  const referencesExistantes = new Set(brouillon.orders.map((commande) => commande.reference));
  const creees: Commande[] = [];

  for (const groupe of resume.groupes) {
    const lignes: LigneCommande[] = groupe.lignes.map((ligne) => ({
      produitId: ligne.produitId,
      nomProduit: ligne.nom,
      unite: ligne.unite,
      quantite: ligne.quantite,
      prixUnitaire: ligne.prixUnitaire,
      sousTotal: ligne.sousTotal,
    }));

    const reference = genererReference('CMD', maintenant, (candidat) =>
      referencesExistantes.has(candidat),
    );
    referencesExistantes.add(reference);

    const commande: Commande = {
      id: genererIdentifiant('cmd'),
      reference,
      acheteurId,
      producteurId: groupe.producteurId,
      lignes,
      montantProduits: groupe.montantProduits,
      fraisLivraison: groupe.fraisLivraison,
      montantTotal: groupe.montantProduits + groupe.fraisLivraison,
      adresseLivraison: adresseNettoyee,
      statut: 'EN_ATTENTE',
      dateCreation: maintenant.toISOString(),
      historique: [
        evenement(null, 'EN_ATTENTE', acheteurId, maintenant, 'Commande créée depuis le panier.'),
      ],
    };

    // Réservation du stock à la création (décision D9), jamais négatif.
    for (const ligne of groupe.lignes) {
      const produit = brouillon.products.find((candidat) => candidat.id === ligne.produitId);
      if (produit) {
        produit.quantiteDisponible = Math.max(0, produit.quantiteDisponible - ligne.quantite);
      }
    }

    brouillon.orders.push(commande);
    creees.push(commande);
  }

  // Vidage du panier correspondant (task 6.6).
  delete brouillon.carts[acheteurId];

  const message =
    creees.length === 1
      ? `Commande ${creees[0].reference} créée.`
      : `${creees.length} commandes créées : ${creees.map((c) => c.reference).join(', ')}.`;
  return resultatCommandes(message, creees);
}

export interface Acteur {
  readonly id: string;
  readonly role: Role;
}

/**
 * Fait progresser une commande vers `cible` (confirmation, préparation, prête).
 * Refuse toute transition absente de la table, non ouverte au rôle, ou sur un
 * statut final ; le message liste les transitions possibles (task 7.4).
 */
export function avancerCommande(
  brouillon: EtatApplication,
  commandeId: string,
  cible: StatutCommande,
  acteur: Acteur,
  maintenant: Date,
): Resultat {
  const commande = brouillon.orders.find((candidat) => candidat.id === commandeId);
  if (!commande) {
    return echec('Commande introuvable.');
  }
  if (acteur.role === 'PRODUCTEUR' && commande.producteurId !== acteur.id) {
    return echec('Cette commande ne concerne pas vos produits.');
  }

  if (cible === 'ANNULEE') {
    return echec('Utilisez l’annulation pour clôturer une commande.');
  }
  if (!statutCibleExiste(commande.statut, cible)) {
    return echec(
      `Transition impossible depuis « ${commande.statut} ». Transitions possibles : ${
        listerStatuts(transitionsPossibles(commande.statut)) || 'aucune (statut final)'
      }.`,
    );
  }
  if (!transitionAutorisee(commande.statut, cible, acteur.role)) {
    return echec(`Votre rôle n’est pas autorisé à faire passer la commande à « ${cible} ».`);
  }

  const precedent = commande.statut;
  commande.statut = cible;
  commande.historique.push(evenement(precedent, cible, acteur.id, maintenant));
  return succes(`Statut mis à jour : ${cible}.`);
}

/**
 * Annule une commande selon les règles par rôle (task 7.5) : restitue
 * exactement une fois le stock réservé et clôture toute livraison active en
 * échec (commentaire « commande annulée »).
 */
export function annulerCommande(
  brouillon: EtatApplication,
  commandeId: string,
  acteur: Acteur,
  maintenant: Date,
): Resultat {
  const commande = brouillon.orders.find((candidat) => candidat.id === commandeId);
  if (!commande) {
    return echec('Commande introuvable.');
  }

  if (commande.statut === 'ANNULEE') {
    return echec('Cette commande est déjà annulée.');
  }
  if (commande.statut === 'LIVREE') {
    return echec('Une commande livrée ne peut pas être annulée.');
  }

  // Contrôle de propriété pour l'acheteur et le producteur.
  if (acteur.role === 'ACHETEUR' && commande.acheteurId !== acteur.id) {
    return echec('Cette commande ne vous appartient pas.');
  }
  if (acteur.role === 'PRODUCTEUR' && commande.producteurId !== acteur.id) {
    return echec('Cette commande ne concerne pas vos produits.');
  }

  if (!transitionAutorisee(commande.statut, 'ANNULEE', acteur.role)) {
    return echec(
      `Annulation refusée depuis « ${commande.statut} » pour votre rôle. ` +
        `Transitions possibles : ${listerStatuts(transitionsPossibles(commande.statut)) || 'aucune (statut final)'}.`,
    );
  }

  // Clôture de la livraison active, le cas échéant (fin de vie D6).
  for (const livraison of brouillon.deliveries) {
    if (
      livraison.commandeId === commande.id &&
      livraison.statut !== 'LIVREE' &&
      livraison.statut !== 'ECHEC'
    ) {
      const ancien = livraison.statut;
      livraison.statut = 'ECHEC';
      livraison.commentaire = 'commande annulée';
      livraison.historique.push({
        le: maintenant.toISOString(),
        ancienStatut: ancien,
        nouveauStatut: 'ECHEC',
        acteurId: acteur.id,
        commentaire: 'commande annulée',
      });
    }
  }

  // Restitution du stock, exactement une fois (idempotence via statut final).
  for (const ligne of commande.lignes) {
    const produit = brouillon.products.find((candidat) => candidat.id === ligne.produitId);
    if (produit) {
      produit.quantiteDisponible += ligne.quantite;
    }
  }

  const precedent = commande.statut;
  commande.statut = 'ANNULEE';
  commande.historique.push(
    evenement(precedent, 'ANNULEE', acteur.id, maintenant, 'Commande annulée.'),
  );
  return succes(`Commande ${commande.reference} annulée, stock restitué.`);
}

/**
 * Modifie l'adresse de livraison d'une commande (task 7.6) : possible seulement
 * pour l'acheteur propriétaire, tant que le statut est EN_ATTENTE ou CONFIRMEE.
 */
export function modifierAdresseCommande(
  brouillon: EtatApplication,
  commandeId: string,
  acheteurId: string,
  adresse: string,
): Resultat {
  const commande = brouillon.orders.find((candidat) => candidat.id === commandeId);
  if (!commande) {
    return echec('Commande introuvable.');
  }
  if (commande.acheteurId !== acheteurId) {
    return echec('Vous ne pouvez modifier que vos propres commandes.');
  }
  if (commande.statut !== 'EN_ATTENTE' && commande.statut !== 'CONFIRMEE') {
    return echec('L’adresse de livraison est figée dès que la commande est en préparation.');
  }
  const adresseNettoyee = adresse.trim();
  if (adresseNettoyee === '') {
    return echec('Renseignez une adresse de livraison.');
  }
  commande.adresseLivraison = adresseNettoyee;
  return succes('Adresse de livraison mise à jour.');
}
