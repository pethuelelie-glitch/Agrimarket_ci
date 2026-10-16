import { StatutCommande } from '../models';
import {
  ciblesManuelles,
  listerStatuts,
  statutCibleExiste,
  transitionAutorisee,
  transitionsPossibles,
} from './transitions';

describe('Transitions de commande (task 7.4, décision D5)', () => {
  it('autorise les progressions du producteur', () => {
    expect(transitionAutorisee('EN_ATTENTE', 'CONFIRMEE', 'PRODUCTEUR')).toBe(true);
    expect(transitionAutorisee('CONFIRMEE', 'EN_PREPARATION', 'PRODUCTEUR')).toBe(true);
    expect(transitionAutorisee('EN_PREPARATION', 'PRETE', 'PRODUCTEUR')).toBe(true);
  });

  it('refuse une progression à un rôle non producteur', () => {
    expect(transitionAutorisee('EN_ATTENTE', 'CONFIRMEE', 'ACHETEUR')).toBe(false);
    expect(transitionAutorisee('CONFIRMEE', 'EN_PREPARATION', 'ADMIN')).toBe(false);
    expect(transitionAutorisee('EN_PREPARATION', 'PRETE', 'LIVREUR')).toBe(false);
  });

  it('refuse la transition EN_ATTENTE → PRETE', () => {
    expect(statutCibleExiste('EN_ATTENTE', 'PRETE')).toBe(false);
    expect(transitionAutorisee('EN_ATTENTE', 'PRETE', 'PRODUCTEUR')).toBe(false);
  });

  it('refuse toute transition depuis un statut final', () => {
    for (const final of ['LIVREE', 'ANNULEE'] as const) {
      expect(transitionsPossibles(final)).toEqual([]);
      expect(ciblesManuelles(final, 'ADMIN')).toEqual([]);
      expect(transitionAutorisee(final, 'EN_PREPARATION', 'ADMIN')).toBe(false);
    }
  });

  it('réserve PRETE → EN_LIVRAISON et EN_LIVRAISON → LIVREE au système', () => {
    expect(statutCibleExiste('PRETE', 'EN_LIVRAISON')).toBe(true);
    expect(transitionAutorisee('PRETE', 'EN_LIVRAISON', 'PRODUCTEUR')).toBe(false);
    expect(transitionAutorisee('PRETE', 'EN_LIVRAISON', 'ADMIN')).toBe(false);
    expect(ciblesManuelles('PRETE', 'ADMIN')).toEqual(['ANNULEE']);

    expect(statutCibleExiste('EN_LIVRAISON', 'LIVREE')).toBe(true);
    expect(transitionAutorisee('EN_LIVRAISON', 'LIVREE', 'LIVREUR')).toBe(false);
    expect(ciblesManuelles('EN_LIVRAISON', 'ADMIN')).toEqual(['ANNULEE']);
  });

  it('applique les règles d’annulation par rôle', () => {
    expect(transitionAutorisee('EN_ATTENTE', 'ANNULEE', 'ACHETEUR')).toBe(true);
    expect(transitionAutorisee('EN_ATTENTE', 'ANNULEE', 'PRODUCTEUR')).toBe(true);
    expect(transitionAutorisee('CONFIRMEE', 'ANNULEE', 'ACHETEUR')).toBe(true);
    // Après préparation, seul l'administrateur peut annuler.
    expect(transitionAutorisee('EN_PREPARATION', 'ANNULEE', 'ACHETEUR')).toBe(false);
    expect(transitionAutorisee('EN_PREPARATION', 'ANNULEE', 'PRODUCTEUR')).toBe(false);
    expect(transitionAutorisee('EN_PREPARATION', 'ANNULEE', 'ADMIN')).toBe(true);
    expect(transitionAutorisee('PRETE', 'ANNULEE', 'ADMIN')).toBe(true);
    expect(transitionAutorisee('EN_LIVRAISON', 'ANNULEE', 'ADMIN')).toBe(true);
  });

  it('liste les transitions possibles pour le message d’erreur', () => {
    const statuts: readonly StatutCommande[] = transitionsPossibles('EN_ATTENTE');
    expect(statuts).toContain('CONFIRMEE');
    expect(statuts).toContain('ANNULEE');
    expect(listerStatuts(statuts)).toContain('CONFIRMEE');
  });
});
