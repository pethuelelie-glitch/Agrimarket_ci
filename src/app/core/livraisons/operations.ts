import { EtatApplication, Livraison, Role, StatutLivraison } from '../models';
import { Resultat, succes, echec } from '../resultat';
import { genererIdentifiant, genererReference } from '../services/identifiants';
import {
  listerStatutsLivraison,
  transitionLivraisonAutorisee,
  transitionsLivraisonPossibles,
} from './transitions';

export interface ActeurLivraison {
  readonly id: string;
  readonly role: Role;
}

/** Résultat d'une opération qui crée ou renvoie une livraison. */
export interface ResultatLivraison extends Resultat {
  readonly livraison: Livraison | null;
}

function resultatLivraison(message: string, livraison: Livraison): ResultatLivraison {
  return { succes: true, message, erreursChamps: {}, livraison };
}

function echecLivraison(message: string): ResultatLivraison {
  return { succes: false, message, erreursChamps: {}, livraison: null };
}

function evenement(
  ancienStatut: StatutLivraison,
  nouveauStatut: StatutLivraison,
  acteurId: string,
  le: Date,
  commentaire?: string,
) {
  return {
    le: le.toISOString(),
    ancienStatut,
    nouveauStatut,
    acteurId,
    ...(commentaire ? { commentaire } : {}),
  };
}

/** Livraison active (ni LIVREE ni ECHEC) d'une commande, ou null. */
export function livraisonActive(brouillon: EtatApplication, commandeId: string): Livraison | null {
  return (
    brouillon.deliveries.find(
      (livraison) =>
        livraison.commandeId === commandeId &&
        livraison.statut !== 'LIVREE' &&
        livraison.statut !== 'ECHEC',
    ) ?? null
  );
}

/**
 * Crée une livraison EN_ATTENTE pour une commande éligible (task 8.1).
 * Réservé à l'administrateur ; refusé si une livraison active existe déjà.
 */
export function creerLivraison(
  brouillon: EtatApplication,
  commandeId: string,
  acteur: ActeurLivraison,
  maintenant: Date,
): ResultatLivraison {
  if (acteur.role !== 'ADMIN') {
    return echecLivraison('Seul un administrateur peut créer une livraison.');
  }

  const commande = brouillon.orders.find((candidat) => candidat.id === commandeId);
  if (!commande) {
    return echecLivraison('Commande introuvable.');
  }
  if (!['CONFIRMEE', 'EN_PREPARATION', 'PRETE'].includes(commande.statut)) {
    return echecLivraison(
      `Une livraison ne peut être créée que pour une commande confirmée, en préparation ou prête (statut actuel : ${commande.statut}).`,
    );
  }
  if (livraisonActive(brouillon, commandeId)) {
    return echecLivraison('Une livraison active existe déjà pour cette commande.');
  }

  const references = new Set(brouillon.deliveries.map((livraison) => livraison.reference));
  const reference = genererReference('LIV', maintenant, (candidat) => references.has(candidat));

  const livraison: Livraison = {
    id: genererIdentifiant('liv'),
    reference,
    commandeId: commande.id,
    commandeReference: commande.reference,
    livreurId: null,
    adresseDestination: commande.adresseLivraison,
    statut: 'EN_ATTENTE',
    dateCreation: maintenant.toISOString(),
    dateAffectation: null,
    dateLivraison: null,
    commentaire: '',
    historique: [evenement('EN_ATTENTE', 'EN_ATTENTE', acteur.id, maintenant, 'Livraison créée.')],
  };

  brouillon.deliveries.push(livraison);
  return resultatLivraison(`Livraison ${reference} créée.`, livraison);
}

/**
 * Attribue un livreur actif à une livraison EN_ATTENTE d'une commande PRETE
 * (task 8.2). Couplage D6 : la commande passe à EN_LIVRAISON.
 */
export function affecterLivreur(
  brouillon: EtatApplication,
  livraisonId: string,
  livreurId: string,
  acteur: ActeurLivraison,
  maintenant: Date,
): Resultat {
  if (acteur.role !== 'ADMIN') {
    return echec('Seul un administrateur peut attribuer un livreur.');
  }

  const livraison = brouillon.deliveries.find((candidat) => candidat.id === livraisonId);
  if (!livraison) {
    return echec('Livraison introuvable.');
  }
  if (livraison.statut !== 'EN_ATTENTE') {
    return echec('Cette livraison n’est plus en attente d’attribution.');
  }

  const commande = brouillon.orders.find((candidat) => candidat.id === livraison.commandeId);
  if (!commande) {
    return echec('Commande introuvable.');
  }
  if (commande.statut !== 'PRETE') {
    return echec('La commande n’est pas prête : préparez-la avant d’attribuer un livreur.');
  }

  const livreur = brouillon.users.find((utilisateur) => utilisateur.id === livreurId);
  if (!livreur || livreur.role !== 'LIVREUR' || !livreur.actif) {
    return echec('Le compte sélectionné n’est pas un livreur actif.');
  }

  livraison.livreurId = livreur.id;
  livraison.dateAffectation = maintenant.toISOString();
  livraison.statut = 'ASSIGNEE';
  livraison.historique.push(
    evenement('EN_ATTENTE', 'ASSIGNEE', acteur.id, maintenant, `Livreur ${livreur.nom} affecté.`),
  );

  // Couplage D6 : la commande passe à EN_LIVRAISON.
  const precedent = commande.statut;
  commande.statut = 'EN_LIVRAISON';
  commande.historique.push({
    le: maintenant.toISOString(),
    statutPrecedent: precedent,
    statut: 'EN_LIVRAISON',
    acteurId: acteur.id,
    commentaire: `Livreur ${livreur.nom} affecté.`,
  });

  return succes(`Livraison attribuée à ${livreur.nom}.`);
}

/**
 * Fait progresser une livraison (task 8.3) : seul le livreur attribué peut agir ;
 * ECHEC exige un commentaire. Couplage D6 : LIVREE → commande LIVREE ; ECHEC →
 * commande PRETE (nouvelle tentative possible).
 */
export function changerStatutLivraison(
  brouillon: EtatApplication,
  livraisonId: string,
  cible: StatutLivraison,
  acteur: ActeurLivraison,
  commentaire: string,
  maintenant: Date,
): Resultat {
  const livraison = brouillon.deliveries.find((candidat) => candidat.id === livraisonId);
  if (!livraison) {
    return echec('Livraison introuvable.');
  }
  if (livraison.statut === 'LIVREE' || livraison.statut === 'ECHEC') {
    return echec(`Statut final « ${livraison.statut} » : aucune mise à jour possible.`);
  }
  if (acteur.role !== 'LIVREUR' || livraison.livreurId !== acteur.id) {
    return echec('Cette livraison ne vous est pas attribuée.');
  }
  if (!transitionLivraisonAutorisee(livraison.statut, cible, acteur.role)) {
    return echec(
      `Transition impossible depuis « ${livraison.statut} ». Transitions possibles : ${
        listerStatutsLivraison(transitionsLivraisonPossibles(livraison.statut)) ||
        'aucune (statut final)'
      }.`,
    );
  }

  const commentaireNettoye = commentaire.trim();
  if (cible === 'ECHEC' && commentaireNettoye === '') {
    return echec('Un commentaire est obligatoire en cas d’échec.');
  }

  const ancien = livraison.statut;
  livraison.statut = cible;
  if (cible === 'LIVREE') {
    livraison.dateLivraison = maintenant.toISOString();
  }
  if (commentaireNettoye !== '') {
    livraison.commentaire = commentaireNettoye;
  }
  livraison.historique.push(
    evenement(ancien, cible, acteur.id, maintenant, commentaireNettoye || undefined),
  );

  // Couplage D6 : effet sur la commande.
  const commande = brouillon.orders.find((candidat) => candidat.id === livraison.commandeId);
  if (commande) {
    const precedent = commande.statut;
    if (cible === 'LIVREE') {
      commande.statut = 'LIVREE';
      commande.historique.push({
        le: maintenant.toISOString(),
        statutPrecedent: precedent,
        statut: 'LIVREE',
        acteurId: acteur.id,
        commentaire: 'Livraison confirmée.',
      });
    } else if (cible === 'ECHEC') {
      commande.statut = 'PRETE';
      commande.historique.push({
        le: maintenant.toISOString(),
        statutPrecedent: precedent,
        statut: 'PRETE',
        acteurId: acteur.id,
        commentaire: `Échec de livraison : ${commentaireNettoye}`,
      });
    }
  }

  return succes(`Livraison ${livraison.reference} mise à jour : ${cible}.`);
}
