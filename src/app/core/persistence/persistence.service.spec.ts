import { TestBed } from '@angular/core/testing';
import { SCHEMA_VERSION, etatVide } from '../config';
import { EtatApplication } from '../models';
import { InMemoryAdapter } from './in-memory-adapter';
import { PersistenceService } from './persistence.service';
import { STORAGE_ADAPTER, StorageAdapter } from './storage-adapter';

function creerService(adaptateur: StorageAdapter): PersistenceService {
  TestBed.configureTestingModule({
    providers: [{ provide: STORAGE_ADAPTER, useValue: adaptateur }],
  });
  return TestBed.inject(PersistenceService);
}

function etatValide(): EtatApplication {
  const etat = etatVide();
  etat.meta = { initialized: true, seedVersion: 1, revision: 3 };
  etat.users = [
    {
      id: 'usr_test',
      nom: 'Test',
      email: 'test@agrimarket.ci',
      empreinteMotDePasse: 'empreinte',
      sel: 'sel',
      role: 'ACHETEUR',
      localisation: 'Abidjan',
      actif: true,
      dateCreation: '2026-01-01T08:00:00.000Z',
    },
  ];
  return etat;
}

describe('PersistenceService', () => {
  describe('lecture de données valides', () => {
    it('restaure l’état enregistré à l’identique', () => {
      const adaptateur = new InMemoryAdapter(JSON.stringify(etatValide()));
      const service = creerService(adaptateur);

      expect(service.etat().users).toHaveLength(1);
      expect(service.etat().users[0].email).toBe('test@agrimarket.ci');
      expect(service.etat().meta.initialized).toBe(true);
      expect(service.avertissement()).toBeNull();
    });

    it('démarre sur un état vide quand rien n’est enregistré', () => {
      const service = creerService(new InMemoryAdapter(null));

      expect(service.etat().users).toEqual([]);
      expect(service.etat().meta.initialized).toBe(false);
      expect(service.avertissement()).toBeNull();
    });
  });

  describe('données corrompues', () => {
    it('ignore un contenu illisible et avertit sans planter', () => {
      const adaptateur = new InMemoryAdapter('{ ceci n’est pas du JSON');
      const service = creerService(adaptateur);

      expect(service.etat().users).toEqual([]);
      expect(service.etat().meta.initialized).toBe(false);
      expect(service.avertissement()).toContain('illisibles');
      // Le stockage corrompu est nettoyé.
      expect(adaptateur.brut).toBeNull();
    });

    it('ignore une structure invalide', () => {
      const adaptateur = new InMemoryAdapter(
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, meta: { initialized: true } }),
      );
      const service = creerService(adaptateur);

      expect(service.etat().meta.initialized).toBe(false);
      expect(service.avertissement()).toContain('invalide');
    });

    it('ignore une version de schéma inconnue sans l’interpréter', () => {
      const etat = etatValide();
      const inconnu = { ...etat, schemaVersion: 99 };
      const adaptateur = new InMemoryAdapter(JSON.stringify(inconnu));
      const service = creerService(adaptateur);

      expect(service.etat().users).toEqual([]);
      expect(service.avertissement()).toContain('99');
      expect(service.avertissement()).toContain('pas reconnue');
      expect(adaptateur.brut).toBeNull();
    });

    it('avertit quand le stockage est inaccessible', () => {
      const adaptateur: StorageAdapter = {
        read: () => {
          throw new Error('SecurityError');
        },
        write: () => undefined,
        clear: () => undefined,
      };
      const service = creerService(adaptateur);

      expect(service.etat().users).toEqual([]);
      expect(service.avertissement()).toContain('inaccessible');
    });
  });

  describe('transaction', () => {
    it('applique la modification et enregistre en une seule écriture', () => {
      const adaptateur = new InMemoryAdapter(JSON.stringify(etatValide()));
      const service = creerService(adaptateur);
      const ecrituresAvant = adaptateur.ecritures;

      service.transaction((brouillon) => {
        brouillon.users.push({ ...brouillon.users[0], id: 'usr_test_2' });
      });

      expect(service.etat().users).toHaveLength(2);
      expect(adaptateur.ecritures).toBe(ecrituresAvant + 1);

      const relu = JSON.parse(adaptateur.brut ?? '{}') as EtatApplication;
      expect(relu.users).toHaveLength(2);
      expect(relu.meta.revision).toBe(4);
    });

    it('incrémente la révision à chaque écriture', () => {
      const service = creerService(new InMemoryAdapter(JSON.stringify(etatValide())));

      service.transaction(() => undefined);
      service.transaction(() => undefined);

      expect(service.etat().meta.revision).toBe(5);
    });
  });

  describe('erreur d’écriture', () => {
    it('conserve la modification en mémoire et avertit', () => {
      const adaptateur = new InMemoryAdapter(JSON.stringify(etatValide()));
      const service = creerService(adaptateur);
      adaptateur.echecEcriture = true;

      service.transaction((brouillon) => {
        brouillon.users.push({ ...brouillon.users[0], id: 'usr_test_2' });
      });

      // La saisie en cours n'est pas perdue, l'utilisateur est averti.
      expect(service.etat().users).toHaveLength(2);
      expect(service.avertissement()).toContain('enregistrement local a échoué');
    });
  });

  describe('remplacer et réinitialiser', () => {
    it('remplace l’état entier', () => {
      const service = creerService(new InMemoryAdapter(null));

      service.remplacer(etatValide());

      expect(service.etat().users).toHaveLength(1);
      expect(service.etat().meta.initialized).toBe(true);
    });

    it('efface le stockage et revient à un état vide', () => {
      const adaptateur = new InMemoryAdapter(JSON.stringify(etatValide()));
      const service = creerService(adaptateur);

      service.reinitialiserStockage();

      expect(service.etat()).toEqual(etatVide());
      expect(adaptateur.brut).toBeNull();
    });
  });
});
