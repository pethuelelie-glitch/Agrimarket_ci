import { TestBed } from '@angular/core/testing';
import {
  DATE_TEST,
  configurerTestBed,
  configurerTestBedAmorce,
  EnvironnementTest,
} from '../../testing/environnement';
import { AuthService } from './auth.service';
import { genererSel, hacherMotDePasse, LONGUEUR_MIN_MOT_DE_PASSE } from './hachage';

async function environnementAmorce(): Promise<EnvironnementTest> {
  return configurerTestBedAmorce();
}

describe('AuthService', () => {
  describe('inscription (task 2.1)', () => {
    it('crée le compte et ouvre la session pour une saisie valide', async () => {
      const env = await environnementAmorce();
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.inscrire({
        nom: 'Nouvelle Acheteuse',
        email: 'Nouvelle@AgriMarket.ci',
        motDePasse: 'MotDePasse1',
        role: 'ACHETEUR',
        localisation: 'Abidjan',
      });

      expect(resultat.succes).toBe(true);
      expect(env.persistence.etat().users).toHaveLength(8);
      expect(auth.estConnecte()).toBe(true);
      expect(auth.utilisateurCourant()?.email).toBe('nouvelle@agrimarket.ci');
      expect(auth.roleCourant()).toBe('ACHETEUR');
      expect(env.persistence.etat().session?.userId).toBe(auth.utilisateurCourant()?.id);
    });

    it('refuse une adresse e-mail déjà utilisée sans créer de compte', async () => {
      const env = await environnementAmorce();
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.inscrire({
        nom: 'Doublon',
        email: 'admin@agrimarket.ci',
        motDePasse: 'MotDePasse1',
        role: 'ACHETEUR',
        localisation: 'Abidjan',
      });

      expect(resultat.succes).toBe(false);
      expect(resultat.erreursChamps['email']).toContain('déjà utilisée');
      expect(env.persistence.etat().users).toHaveLength(7);
      expect(auth.estConnecte()).toBe(false);
    });

    it('refuse le rôle ADMIN à l’inscription', async () => {
      const env = await environnementAmorce();
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.inscrire({
        nom: 'Faux Admin',
        email: 'faux.admin@agrimarket.ci',
        motDePasse: 'MotDePasse1',
        role: 'ADMIN',
        localisation: 'Abidjan',
      });

      expect(resultat.succes).toBe(false);
      expect(resultat.erreursChamps['role']).toBeDefined();
      expect(env.persistence.etat().users).toHaveLength(7);
    });

    it('signale le champ fautif pour un e-mail mal formé', async () => {
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.inscrire({
        nom: 'Test',
        email: 'pas-un-email',
        motDePasse: 'MotDePasse1',
        role: 'ACHETEUR',
        localisation: 'Abidjan',
      });

      expect(resultat.succes).toBe(false);
      expect(resultat.erreursChamps['email']).toBeDefined();
    });

    it(`refuse un mot de passe de moins de ${LONGUEUR_MIN_MOT_DE_PASSE} caractères`, async () => {
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.inscrire({
        nom: 'Test',
        email: 'court@agrimarket.ci',
        motDePasse: 'court',
        role: 'ACHETEUR',
        localisation: 'Abidjan',
      });

      expect(resultat.succes).toBe(false);
      expect(resultat.erreursChamps['motDePasse']).toContain(String(LONGUEUR_MIN_MOT_DE_PASSE));
    });
  });

  describe('connexion refusée (task 2.3)', () => {
    it('affiche un message générique pour une adresse inconnue', async () => {
      await environnementAmorce();
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.connecter('inconnu@agrimarket.ci', 'MotDePasse1');

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toBe('Adresse e-mail ou mot de passe incorrect.');
      expect(auth.estConnecte()).toBe(false);
    });

    it('affiche exactement le même message pour un mot de passe erroné', async () => {
      await environnementAmorce();
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.connecter('koffi.yao@agrimarket.ci', 'MauvaisMotDePasse');

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toBe('Adresse e-mail ou mot de passe incorrect.');
      expect(auth.estConnecte()).toBe(false);
    });

    it('signale un compte désactivé', async () => {
      const env = await environnementAmorce();
      env.persistence.transaction((brouillon) => {
        const utilisateur = brouillon.users.find((u) => u.email === 'koffi.yao@agrimarket.ci');
        if (utilisateur) {
          utilisateur.actif = false;
        }
      });
      const auth = TestBed.inject(AuthService);

      const resultat = await auth.connecter('koffi.yao@agrimarket.ci', 'Achete1234');

      expect(resultat.succes).toBe(false);
      expect(resultat.message).toContain('désactivé');
      expect(auth.estConnecte()).toBe(false);
    });
  });

  describe('session (task 2.4)', () => {
    it('conserve la session après une actualisation simulée', async () => {
      const env = await environnementAmorce();
      const auth = TestBed.inject(AuthService);
      await auth.connecter('awa.kone@agrimarket.ci', 'Produ1234');
      const brut = env.adaptateur.brut;

      // Actualisation : un nouvel environnement lit le même document racine.
      TestBed.resetTestingModule();
      const env2 = configurerTestBed({ etatInitial: JSON.parse(brut ?? '{}') });
      const auth2 = TestBed.inject(AuthService);

      expect(auth2.estConnecte()).toBe(true);
      expect(auth2.utilisateurCourant()?.email).toBe('awa.kone@agrimarket.ci');
      expect(auth2.roleCourant()).toBe('PRODUCTEUR');
      expect(env2.persistence.etat().session).not.toBeNull();
    });

    it('traite une session au rôle inconnu comme une déconnexion et la supprime', async () => {
      const env = await environnementAmorce();
      env.persistence.transaction((brouillon) => {
        brouillon.session = {
          userId: 'usr_admin',
          role: 'SUPER_ADMIN' as never,
          ouvertLe: DATE_TEST.toISOString(),
        };
      });

      const auth = TestBed.inject(AuthService);

      expect(auth.estConnecte()).toBe(false);
      expect(env.persistence.etat().session).toBeNull();
    });

    it('traite une session pointant vers un compte inexistant comme une déconnexion', async () => {
      const env = await environnementAmorce();
      env.persistence.transaction((brouillon) => {
        brouillon.session = {
          userId: 'usr_fantome',
          role: 'ACHETEUR',
          ouvertLe: DATE_TEST.toISOString(),
        };
      });

      const auth = TestBed.inject(AuthService);

      expect(auth.estConnecte()).toBe(false);
      expect(env.persistence.etat().session).toBeNull();
    });

    it('déconnecte une session dont le compte a été désactivé', async () => {
      const env = await environnementAmorce();
      const auth = TestBed.inject(AuthService);
      await auth.connecter('koffi.yao@agrimarket.ci', 'Achete1234');
      expect(auth.estConnecte()).toBe(true);

      env.persistence.transaction((brouillon) => {
        const utilisateur = brouillon.users.find((u) => u.email === 'koffi.yao@agrimarket.ci');
        if (utilisateur) {
          utilisateur.actif = false;
        }
      });

      expect(auth.estConnecte()).toBe(false);
    });

    it('ferme la session à la déconnexion sans supprimer les données', async () => {
      const env = await environnementAmorce();
      const auth = TestBed.inject(AuthService);
      await auth.connecter('admin@agrimarket.ci', 'Admin1234');

      auth.deconnecter();

      expect(auth.estConnecte()).toBe(false);
      expect(env.persistence.etat().session).toBeNull();
      expect(env.persistence.etat().users).toHaveLength(7);
      expect(env.persistence.etat().products).toHaveLength(8);
    });
  });
});

describe('empreintes de mot de passe (task 2.2)', () => {
  it('produit une empreinte hexadécimale de 64 caractères', async () => {
    const empreinte = await hacherMotDePasse('MotDePasse1', genererSel());
    expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
  });

  it('donne deux empreintes et deux sels différents pour un même mot de passe', async () => {
    const sel1 = genererSel();
    const sel2 = genererSel();
    expect(sel1).not.toBe(sel2);

    const empreinte1 = await hacherMotDePasse('MotDePasse1', sel1);
    const empreinte2 = await hacherMotDePasse('MotDePasse1', sel2);
    expect(empreinte1).not.toBe(empreinte2);
  });

  it('ne stocke jamais le mot de passe en clair après une inscription', async () => {
    const env = await environnementAmorce();
    const auth = TestBed.inject(AuthService);
    const motDePasse = 'SecretDuCompte1';

    await auth.inscrire({
      nom: 'Compte Secret',
      email: 'secret@agrimarket.ci',
      motDePasse,
      role: 'ACHETEUR',
      localisation: 'Abidjan',
    });

    const contenu = env.adaptateur.brut ?? '';
    expect(contenu).not.toContain(motDePasse);
    const utilisateur = env.persistence
      .etat()
      .users.find((candidat) => candidat.email === 'secret@agrimarket.ci');
    expect(utilisateur?.empreinteMotDePasse).toMatch(/^[0-9a-f]{64}$/);
    expect(utilisateur?.empreinteMotDePasse).not.toBe(motDePasse);
  });

  it('génère un sel distinct par compte, y compris pour un mot de passe identique', async () => {
    const env = await environnementAmorce();
    const auth = TestBed.inject(AuthService);
    await auth.inscrire({
      nom: 'Compte A',
      email: 'a@agrimarket.ci',
      motDePasse: 'MotDePasse1',
      role: 'ACHETEUR',
      localisation: 'Abidjan',
    });
    await auth.inscrire({
      nom: 'Compte B',
      email: 'b@agrimarket.ci',
      motDePasse: 'MotDePasse1',
      role: 'ACHETEUR',
      localisation: 'Abidjan',
    });

    const a = env.persistence.etat().users.find((u) => u.email === 'a@agrimarket.ci');
    const b = env.persistence.etat().users.find((u) => u.email === 'b@agrimarket.ci');
    expect(a?.sel).not.toBe(b?.sel);
    expect(a?.empreinteMotDePasse).not.toBe(b?.empreinteMotDePasse);
  });

  it('utilise un sel aléatoire (deux appels donnent deux sels)', () => {
    expect(genererSel()).not.toBe(genererSel());
    expect(genererSel()).toMatch(/^[0-9a-f]{32}$/);
  });
});
