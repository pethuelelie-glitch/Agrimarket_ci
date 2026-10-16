import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CHEMINS } from '../navigation';
import { configurerTestBedAmorce, EnvironnementTest } from '../../testing/environnement';
import { AjoutPanierService } from './ajout-panier.service';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { NotificationsService } from '../services/notifications.service';

const ACHETEUR_1 = ['koffi.yao@agrimarket.ci', 'Achete1234'] as const;
const PRODUCTEUR_1 = ['awa.kone@agrimarket.ci', 'Produ1234'] as const;

interface Contexte {
  ajout: AjoutPanierService;
  cart: CartService;
  router: Router;
  notifications: NotificationsService;
  auth: AuthService;
  env: EnvironnementTest;
}

async function preparer(): Promise<Contexte> {
  const env = await configurerTestBedAmorce({ providers: [provideRouter([])] });
  return {
    ajout: TestBed.inject(AjoutPanierService),
    cart: TestBed.inject(CartService),
    router: TestBed.inject(Router),
    notifications: TestBed.inject(NotificationsService),
    auth: TestBed.inject(AuthService),
    env,
  };
}

describe('AjoutPanierService (task 6.8)', () => {
  it('redirige un visiteur non connecté vers la connexion sans modifier le panier', async () => {
    const contexte = await preparer();
    const navigation = vi.spyOn(contexte.router, 'navigate');

    contexte.ajout.ajouter('prd_riz');

    expect(navigation).toHaveBeenCalledWith([CHEMINS.connexion]);
    expect(contexte.cart.items()).toEqual([]);
    expect(contexte.notifications.message()).toContain('Connectez');
  });

  it('refuse l’ajout à un producteur sans redirection', async () => {
    const contexte = await preparer();
    await contexte.auth.connecter(...PRODUCTEUR_1);
    const navigation = vi.spyOn(contexte.router, 'navigate');

    contexte.ajout.ajouter('prd_riz');

    expect(navigation).not.toHaveBeenCalled();
    expect(contexte.cart.items()).toEqual([]);
    expect(contexte.notifications.message()?.toLowerCase()).toContain('réservé aux acheteurs');
  });

  it('ajoute le produit au panier pour un acheteur connecté', async () => {
    const contexte = await preparer();
    await contexte.auth.connecter(...ACHETEUR_1);

    contexte.ajout.ajouter('prd_riz', 2);

    expect(contexte.cart.items()).toEqual([{ produitId: 'prd_riz', quantite: 2 }]);
    expect(contexte.notifications.message()?.toLowerCase()).toContain('ajouté');
  });
});
