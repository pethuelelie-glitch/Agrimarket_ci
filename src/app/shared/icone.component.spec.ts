import { TestBed } from '@angular/core/testing';
import { IconeComponent } from './icone.component';

describe('IconeComponent', () => {
  it('rend une icône décorative masquée aux technologies d’assistance', () => {
    const fixture = TestBed.createComponent(IconeComponent);
    fixture.componentRef.setInput('nom', 'panier');
    fixture.detectChanges();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBeTruthy();
  });

  it('expose un libellé accessible quand il est fourni', () => {
    const fixture = TestBed.createComponent(IconeComponent);
    fixture.componentRef.setInput('nom', 'soleil');
    fixture.componentRef.setInput('libelle', 'Thème clair');
    fixture.componentRef.setInput('taille', 24);
    fixture.detectChanges();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBeNull();
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Thème clair');
    expect(svg?.getAttribute('width')).toBe('24');
  });
});
