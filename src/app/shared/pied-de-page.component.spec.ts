import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AideComponent } from '../features/aide/aide.component';
import { PiedDePageComponent } from './pied-de-page.component';

describe('PiedDePageComponent (task 3.4)', () => {
  it('mentionne les limites du contrôle d’accès local', async () => {
    TestBed.configureTestingModule({
      imports: [PiedDePageComponent],
      providers: [provideRouter([{ path: 'aide', component: AideComponent }])],
    });
    const fixture = TestBed.createComponent(PiedDePageComponent);
    await fixture.whenStable();

    const contenu = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(contenu).toContain('protection');
    expect(contenu).toContain('interface');
    expect(contenu).toContain('côté client');
    expect(contenu).toContain('stockage local');
    expect(contenu).toContain('côté serveur');
  });

  it('rappelle l’absence de backend et la simulation de l’authentification', async () => {
    TestBed.configureTestingModule({
      imports: [PiedDePageComponent],
      providers: [provideRouter([{ path: 'aide', component: AideComponent }])],
    });
    const fixture = TestBed.createComponent(PiedDePageComponent);
    await fixture.whenStable();

    const contenu = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(contenu).toContain('sans backend');
    expect(contenu).toContain('simulée');
  });
});
