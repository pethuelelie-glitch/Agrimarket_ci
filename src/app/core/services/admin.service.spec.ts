import { TestBed } from '@angular/core/testing';
import { IDS_DEMO } from '../data/seed';
import { verifierMotDePasse } from './hachage';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { CatalogueService } from './catalogue.service';
import { configurerTestBedAmorce } from '../../testing/environnement';

const ADMIN = ['admin@agrimarket.ci', 'Admin1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;
const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;

async function preparer(email: string, motDePasse: string) {
  const env = await configurerTestBedAmorce();
  const resultat = await TestBed.inject(AuthService).connecter(email, motDePasse);
  expect(resultat.succes).toBe(true);
  return { env, admin: TestBed.inject(AdminService), auth: TestBed.inject(AuthService) };
}

describe('AdminService — consultation des comptes (task 10.1)', () => {
  it('liste tous les comptes avec rôle et statut', async () => {
    const { admin } = await preparer(...ADMIN);

    const comptes = admin.utilisateurs();
    expect(comptes.length).toBe(7);
    // Triés par nom.
    const noms = comptes.map((utilisateur) => utilisateur.nom);
    expect([...noms].sort((a, b) => a.localeCompare(b))).toEqual(noms);
    // Chaque compte expose son rôle et son statut.
    expect(comptes.every((utilisateur) => typeof utilisateur.role === 'string')).toBe(true);
    expect(comptes.every((utilisateur) => typeof utilisateur.actif === 'boolean')).toBe(true);
  });

  it('recherche par nom et par e-mail, sans tenir compte de la casse', async () => {
    const { admin } = await preparer(...ADMIN);

    expect(admin.rechercher('AWA').map((u) => u.id)).toEqual([IDS_DEMO.producteur1]);
    expect(admin.rechercher('koffi.yao@').map((u) => u.id)).toEqual([IDS_DEMO.acheteur1]);
    expect(admin.rechercher('introuvable')).toEqual([]);
  });

  it('refuse l’administration à un non-administrateur', async () => {
    const { admin } = await preparer(...ACHETEUR_1);

    expect(admin.peutAdministrer()).toBe(false);
    expect(
      admin.modifierUtilisateur(IDS_DEMO.producteur1, {
        nom: 'Pirate',
        localisation: 'Abidjan',
      }).succes,
    ).toBe(false);
  });
});

describe('AdminService — modification d’un compte (task 10.2)', () => {
  it('enregistre le nom, la localisation et le téléphone', async () => {
    const { env, admin } = await preparer(...ADMIN);

    const resultat = admin.modifierUtilisateur(IDS_DEMO.producteur1, {
      nom: 'Awa Koné Diomandé',
      localisation: 'Yopougon, Abidjan',
      telephone: '+225 07 00 00 00',
    });

    expect(resultat.succes).toBe(true);
    const compte = env.persistence
      .etat()
      .users.find((utilisateur) => utilisateur.id === IDS_DEMO.producteur1)!;
    expect(compte.nom).toBe('Awa Koné Diomandé');
    expect(compte.localisation).toBe('Yopougon, Abidjan');
    expect(compte.telephone).toBe('+225 07 00 00 00');
  });

  it('laisse l’adresse e-mail inchangée (lecture seule)', async () => {
    const { env, admin } = await preparer(...ADMIN);
    const avant = env.persistence
      .etat()
      .users.find((utilisateur) => utilisateur.id === IDS_DEMO.producteur1)!.email;

    admin.modifierUtilisateur(IDS_DEMO.producteur1, {
      nom: 'Awa Koné',
      localisation: 'Abidjan',
    });

    const apres = env.persistence
      .etat()
      .users.find((utilisateur) => utilisateur.id === IDS_DEMO.producteur1)!.email;
    expect(apres).toBe(avant);
  });

  it('signale les champs invalides', async () => {
    const { admin } = await preparer(...ADMIN);

    const resultat = admin.modifierUtilisateur(IDS_DEMO.producteur1, {
      nom: '   ',
      localisation: '',
      telephone: 'abc',
    });

    expect(resultat.succes).toBe(false);
    expect(resultat.erreursChamps['nom']).toBeDefined();
    expect(resultat.erreursChamps['localisation']).toBeDefined();
    expect(resultat.erreursChamps['telephone']).toBeDefined();
  });

  it('réinitialise le mot de passe sans jamais le stocker en clair', async () => {
    const { env, admin } = await preparer(...ADMIN);
    const nouveau = 'NouveauMdP1234';

    const resultat = await admin.reinitialiserMotDePasse(IDS_DEMO.producteur1, nouveau);
    expect(resultat.succes).toBe(true);

    const compte = env.persistence
      .etat()
      .users.find((utilisateur) => utilisateur.id === IDS_DEMO.producteur1)!;
    expect(compte.empreinteMotDePasse).not.toBe(nouveau);
    expect(await verifierMotDePasse(nouveau, compte.sel, compte.empreinteMotDePasse)).toBe(true);
    // Aucun mot de passe en clair dans le document sérialisé.
    expect(env.adaptateur.brut).not.toContain(nouveau);

    // L'ancien mot de passe ne fonctionne plus.
    const connexion = await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    expect(connexion.succes).toBe(false);
  });

  it('refuse un mot de passe trop court', async () => {
    const { admin } = await preparer(...ADMIN);
    const resultat = await admin.reinitialiserMotDePasse(IDS_DEMO.producteur1, 'court');
    expect(resultat.succes).toBe(false);
    expect(resultat.erreursChamps['motDePasse']).toBeDefined();
  });
});

describe('AdminService — changement de rôle (task 10.3)', () => {
  it('enregistre un rôle reconnu', async () => {
    const { env, admin } = await preparer(...ADMIN);

    const resultat = admin.changerRole(IDS_DEMO.acheteur1, 'LIVREUR');
    expect(resultat.succes).toBe(true);
    expect(env.persistence.etat().users.find((u) => u.id === IDS_DEMO.acheteur1)!.role).toBe(
      'LIVREUR',
    );
  });

  it('refuse un rôle inconnu', async () => {
    const { env, admin } = await preparer(...ADMIN);

    const resultat = admin.changerRole(IDS_DEMO.acheteur1, 'SUPER_HACKER');
    expect(resultat.succes).toBe(false);
    expect(env.persistence.etat().users.find((u) => u.id === IDS_DEMO.acheteur1)!.role).toBe(
      'ACHETEUR',
    );
  });
});

describe('AdminService — activation/désactivation (task 10.4)', () => {
  it('désactive un compte puis le réactive', async () => {
    const { env, admin } = await preparer(...ADMIN);

    expect(admin.basculerActivation(IDS_DEMO.producteur1).succes).toBe(true);
    expect(env.persistence.etat().users.find((u) => u.id === IDS_DEMO.producteur1)!.actif).toBe(
      false,
    );

    // Le producteur désactivé ne peut plus se connecter.
    const refus = await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    expect(refus.succes).toBe(false);

    expect(admin.basculerActivation(IDS_DEMO.producteur1).succes).toBe(true);
    const ok = await TestBed.inject(AuthService).connecter(...PRODUCTEUR_1);
    expect(ok.succes).toBe(true);
  });

  it('refuse la désactivation de son propre compte', async () => {
    const { env, admin } = await preparer(...ADMIN);
    // Un second administrateur actif existe : la protection « dernier admin »
    // ne s'applique pas, c'est bien la protection « propre compte » qui joue.
    env.persistence.transaction((brouillon) => {
      const cible = brouillon.users.find((u) => u.id === IDS_DEMO.acheteur2);
      if (cible) {
        cible.role = 'ADMIN';
      }
    });

    const resultat = admin.basculerActivation(IDS_DEMO.admin);
    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('connecté');
    expect(env.persistence.etat().users.find((u) => u.id === IDS_DEMO.admin)!.actif).toBe(true);
  });

  it('refuse la désactivation du dernier administrateur actif', async () => {
    const { env, admin } = await preparer(...ADMIN);
    // Un seul administrateur actif : celui qui agit.
    expect(admin.compterAdminsActifs()).toBe(1);

    const resultat = admin.basculerActivation(IDS_DEMO.admin);
    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('administrateur actif');
    expect(env.persistence.etat().users.find((u) => u.id === IDS_DEMO.admin)!.actif).toBe(true);
  });
});

describe('AdminService — modération des produits (task 10.5)', () => {
  it('désactive un produit avec un motif tracé', async () => {
    const { env } = await preparer(...ADMIN);
    const catalogue = TestBed.inject(CatalogueService);

    const resultat = catalogue.moderer('prd_tomate', 'Prix incohérent avec la description.');
    expect(resultat.succes).toBe(true);

    const produit = env.persistence.etat().products.find((p) => p.id === 'prd_tomate')!;
    expect(produit.actif).toBe(false);
    expect(produit.moderation?.motif).toBe('Prix incohérent avec la description.');
    expect(produit.moderation?.parAdminId).toBe(IDS_DEMO.admin);
  });

  it('refuse la modération sans motif', async () => {
    const { env } = await preparer(...ADMIN);
    const catalogue = TestBed.inject(CatalogueService);

    const resultat = catalogue.moderer('prd_tomate', '   ');
    expect(resultat.succes).toBe(false);
    expect(resultat.erreursChamps['motif']).toBeDefined();
    expect(env.persistence.etat().products.find((p) => p.id === 'prd_tomate')!.actif).toBe(true);
  });

  it('refuse la suppression d’un produit référencé par une commande en cours', async () => {
    await preparer(...ADMIN);
    const catalogue = TestBed.inject(CatalogueService);

    // prd_riz est dans cmd_demo_1 (EN_ATTENTE).
    expect(catalogue.estReferenceParCommandeEnCours('prd_riz')).toBe(true);
    const resultat = catalogue.supprimer('prd_riz');
    expect(resultat.succes).toBe(false);
    expect(resultat.message.toLowerCase()).toContain('commande en cours');
  });

  it('supprime un produit non référencé par une commande en cours', async () => {
    const { env } = await preparer(...ADMIN);
    const catalogue = TestBed.inject(CatalogueService);

    // prd_haricot n'apparaît dans aucune commande.
    expect(catalogue.supprimer('prd_haricot').succes).toBe(true);
    expect(env.persistence.etat().products.some((p) => p.id === 'prd_haricot')).toBe(false);
  });
});

describe('AdminService — supervision des commandes (task 10.6)', () => {
  it('filtre par statut et par producteur', async () => {
    const { admin } = await preparer(...ADMIN);

    const enLivraison = admin.filtrerCommandes({ statut: 'EN_LIVRAISON' });
    expect(enLivraison.length).toBe(1);
    expect(enLivraison[0].id).toBe('cmd_demo_2');

    const duProducteur2 = admin.filtrerCommandes({ producteurId: IDS_DEMO.producteur2 });
    expect(duProducteur2.map((c) => c.id).sort()).toEqual(['cmd_demo_2', 'cmd_demo_3']);

    expect(admin.filtrerCommandes({})).toHaveLength(3);
  });

  it('expose les commandes en lecture seule (les lignes ne sont modifiables que par les règles métier)', async () => {
    const { admin } = await preparer(...ADMIN);

    const commande = admin.commandes().find((c) => c.id === 'cmd_demo_1')!;
    expect(commande.lignes.length).toBeGreaterThan(0);
    // Le service ne propose aucune méthode de modification des lignes.
    const methodes = Object.getOwnPropertyNames(Object.getPrototypeOf(admin));
    expect(methodes.some((nom) => /modifierLigne|ajouterLigne|supprimerLigne/i.test(nom))).toBe(
      false,
    );
  });
});

describe('AdminService — réinitialisation (task 10.7)', () => {
  it('remplace les données par le jeu de démonstration initial', async () => {
    const { env, admin } = await preparer(...ADMIN);
    env.persistence.transaction((brouillon) => {
      brouillon.products = [];
    });

    const resultat = await admin.reinitialiserDonnees();
    expect(resultat.succes).toBe(true);
    expect(env.persistence.etat().users.length).toBe(7);
    expect(env.persistence.etat().products.length).toBe(8);
  });

  it('refuse la réinitialisation à un non-administrateur', async () => {
    const { env, admin } = await preparer(...ACHETEUR_1);
    env.persistence.transaction((brouillon) => {
      brouillon.products = [];
    });

    const resultat = await admin.reinitialiserDonnees();
    expect(resultat.succes).toBe(false);
    // Données inchangées.
    expect(env.persistence.etat().products.length).toBe(0);
  });
});
