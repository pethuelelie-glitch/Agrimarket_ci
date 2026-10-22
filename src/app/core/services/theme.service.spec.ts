import { TestBed } from '@angular/core/testing';
import { CLE_THEME, ThemeService } from './theme.service';

function creer(): ThemeService {
  TestBed.configureTestingModule({});
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem(CLE_THEME);
    document.documentElement.removeAttribute('data-theme');
  });

  it('suit la préférence système par défaut, sans attribut forcé', () => {
    const theme = creer();

    expect(theme.choix()).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('bascule vers un thème explicite et le mémorise', () => {
    const theme = creer();
    const sombreAvant = theme.sombre();

    theme.basculer();

    expect(theme.sombre()).toBe(!sombreAvant);
    const attendu = sombreAvant ? 'light' : 'dark';
    expect(document.documentElement.getAttribute('data-theme')).toBe(attendu);
    expect(localStorage.getItem(CLE_THEME)).toBe(attendu);
  });

  it('relit le choix mémorisé au démarrage', () => {
    localStorage.setItem(CLE_THEME, 'dark');

    const theme = creer();

    expect(theme.choix()).toBe('dark');
    expect(theme.sombre()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ignore une valeur mémorisée inconnue', () => {
    localStorage.setItem(CLE_THEME, 'violet');

    expect(creer().choix()).toBe('system');
  });

  it('revient au système en effaçant la préférence', () => {
    const theme = creer();
    theme.definir('dark');

    theme.definir('system');

    expect(localStorage.getItem(CLE_THEME)).toBeNull();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
