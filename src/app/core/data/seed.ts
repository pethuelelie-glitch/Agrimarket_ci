import { SEED_VERSION, etatVide } from '../config';
import { Commande, EtatApplication, Livraison, Produit, Role, Utilisateur } from '../models';
import { genererSel, hacherMotDePasse } from '../services/hachage';

/**
 * Jeu de données de démonstration (task 1.6).
 *
 * Invariant de cohérence : la quantité de chaque produit correspond au stock
 * **après** réservation des commandes en cours du jeu. Les commandes `LIVREE`
 * ou `ANNULEE` ne réservent plus de stock.
 */

export interface CompteDemo {
  id: string;
  email: string;
  /** Mot de passe de démonstration, affiché sur la page de connexion. Jamais persisté. */
  motDePasse: string;
  role: Role;
  nom: string;
  localisation: string;
  telephone?: string;
}

export const IDS_DEMO = {
  admin: 'usr_admin',
  producteur1: 'usr_producteur_1',
  producteur2: 'usr_producteur_2',
  acheteur1: 'usr_acheteur_1',
  acheteur2: 'usr_acheteur_2',
  livreur1: 'usr_livreur_1',
  livreur2: 'usr_livreur_2',
} as const;

export const COMPTES_DEMO: readonly CompteDemo[] = [
  {
    id: IDS_DEMO.admin,
    email: 'admin@agrimarket.ci',
    motDePasse: 'Admin1234',
    role: 'ADMIN',
    nom: 'Aïcha Diomandé',
    localisation: 'Abidjan',
    telephone: '+225 07 00 00 00 01',
  },
  {
    id: IDS_DEMO.producteur1,
    email: 'awa.kone@agrimarket.ci',
    motDePasse: 'Produ1234',
    role: 'PRODUCTEUR',
    nom: 'Awa Koné',
    localisation: 'Abidjan',
    telephone: '+225 07 00 00 00 02',
  },
  {
    id: IDS_DEMO.producteur2,
    email: 'bakary.traore@agrimarket.ci',
    motDePasse: 'Produ1234',
    role: 'PRODUCTEUR',
    nom: 'Bakary Traoré',
    localisation: 'Bouaké',
    telephone: '+225 07 00 00 00 03',
  },
  {
    id: IDS_DEMO.acheteur1,
    email: 'koffi.yao@agrimarket.ci',
    motDePasse: 'Achete1234',
    role: 'ACHETEUR',
    nom: 'Koffi Yao',
    localisation: 'Abidjan',
    telephone: '+225 07 00 00 00 04',
  },
  {
    id: IDS_DEMO.acheteur2,
    email: 'adjoua.bamba@agrimarket.ci',
    motDePasse: 'Achete1234',
    role: 'ACHETEUR',
    nom: 'Adjoua Bamba',
    localisation: 'Yamoussoukro',
    telephone: '+225 07 00 00 00 05',
  },
  {
    id: IDS_DEMO.livreur1,
    email: 'ibrahim.diallo@agrimarket.ci',
    motDePasse: 'Livre1234',
    role: 'LIVREUR',
    nom: 'Ibrahim Diallo',
    localisation: 'Abidjan',
    telephone: '+225 07 00 00 00 06',
  },
  {
    id: IDS_DEMO.livreur2,
    email: 'sery.kouassi@agrimarket.ci',
    motDePasse: 'Livre1234',
    role: 'LIVREUR',
    nom: 'Sery Kouassi',
    localisation: 'Abidjan',
    telephone: '+225 07 00 00 00 07',
  },
];

/** Les quatre comptes montrés sur la page de connexion (un par rôle). */
export const COMPTES_DEMO_PRINCIPAUX: readonly CompteDemo[] = [
  IDS_DEMO.admin,
  IDS_DEMO.producteur1,
  IDS_DEMO.acheteur1,
  IDS_DEMO.livreur1,
].map((id) => {
  const compte = COMPTES_DEMO.find((candidat) => candidat.id === id);
  if (!compte) {
    throw new Error(`Compte de démonstration introuvable : ${id}`);
  }
  return compte;
});

/** Image de secours utilisée lorsqu'un produit n'a pas d'illustration valide. */
export const IMAGE_SECOURS =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">' +
      '<rect width="320" height="200" fill="#e8f5e9"/>' +
      '<text x="160" y="110" font-size="18" text-anchor="middle" fill="#2e7d32">AgriMarket CI</text>' +
      '</svg>',
  );

function decaler(reference: Date, jours: number, heures = 9): string {
  const date = new Date(reference.getTime());
  date.setDate(date.getDate() + jours);
  date.setHours(heures, 0, 0, 0);
  return date.toISOString();
}

function jourCompact(iso: string): string {
  const date = new Date(iso);
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${annee}${mois}${jour}`;
}

function creerUtilisateurs(maintenant: Date): Promise<Utilisateur[]> {
  return Promise.all(
    COMPTES_DEMO.map(async (compte) => {
      const sel = genererSel();
      const utilisateur: Utilisateur = {
        id: compte.id,
        nom: compte.nom,
        email: compte.email,
        empreinteMotDePasse: await hacherMotDePasse(compte.motDePasse, sel),
        sel,
        role: compte.role,
        localisation: compte.localisation,
        actif: true,
        dateCreation: decaler(maintenant, -30),
        ...(compte.telephone ? { telephone: compte.telephone } : {}),
      };
      return utilisateur;
    }),
  );
}

interface ProduitDemo {
  id: string;
  producteurId: string;
  nom: string;
  description: string;
  categorie: Produit['categorie'];
  prix: number;
  unite: Produit['unite'];
  quantiteDisponible: number;
  localisation: string;
  imageUrl: string;
  actif: boolean;
  joursCreation: number;
}

const PRODUITS_DEMO: readonly ProduitDemo[] = [
  {
    id: 'prd_riz',
    producteurId: IDS_DEMO.producteur1,
    nom: 'Riz local de Gagnoa',
    description:
      'Riz blanc parfumé produit dans la région du Gôh, idéal pour les plats quotidiens.',
    categorie: 'CEREALES',
    prix: 450,
    unite: 'SAC',
    quantiteDisponible: 195,
    localisation: 'Abidjan',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=640&q=60',
    actif: true,
    joursCreation: -25,
  },
  {
    id: 'prd_tomate',
    producteurId: IDS_DEMO.producteur1,
    nom: 'Tomates fraîches',
    description: 'Tomates rondes cueillies à maturité, calibrées pour la vente au marché.',
    categorie: 'LEGUMES',
    prix: 600,
    unite: 'KG',
    quantiteDisponible: 70,
    localisation: 'Abidjan',
    imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=640&q=60',
    actif: true,
    joursCreation: -22,
  },
  {
    id: 'prd_igname',
    producteurId: IDS_DEMO.producteur1,
    nom: 'Igname Kponan',
    description: 'Igname Kponan de qualité supérieure, conservée à l’abri de l’humidité.',
    categorie: 'TUBERCULES',
    prix: 800,
    unite: 'KG',
    quantiteDisponible: 120,
    localisation: 'Abidjan',
    imageUrl: 'https://images.unsplash.com/photo-1596124729356-1c4c2f2a1a7a?w=640&q=60',
    actif: true,
    joursCreation: -18,
  },
  {
    id: 'prd_haricot',
    producteurId: IDS_DEMO.producteur1,
    nom: 'Haricot niébé',
    description: 'Niébé trié et séché, disponible en sacs de 50 kg.',
    categorie: 'LEGUMINEUSES',
    prix: 900,
    unite: 'KG',
    quantiteDisponible: 60,
    localisation: 'Abidjan',
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=640&q=60',
    actif: false,
    joursCreation: -15,
  },
  {
    id: 'prd_mangue',
    producteurId: IDS_DEMO.producteur2,
    nom: 'Mangues Kent',
    description: 'Mangues Kent sucrées du nord de la Côte d’Ivoire, calibre export.',
    categorie: 'FRUITS',
    prix: 500,
    unite: 'KG',
    quantiteDisponible: 130,
    localisation: 'Bouaké',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=640&q=60',
    actif: true,
    joursCreation: -12,
  },
  {
    id: 'prd_mais',
    producteurId: IDS_DEMO.producteur2,
    nom: 'Maïs jaune',
    description: 'Maïs jaune grain sec, destiné à la consommation ou à l’alimentation animale.',
    categorie: 'CEREALES',
    prix: 300,
    unite: 'KG',
    quantiteDisponible: 250,
    localisation: 'Bouaké',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=640&q=60',
    actif: true,
    joursCreation: -10,
  },
  {
    id: 'prd_huile',
    producteurId: IDS_DEMO.producteur2,
    nom: 'Huile de palme artisanale',
    description: 'Huile de palme rouge pressée artisanalement, conditionnée en bidons.',
    categorie: 'TRANSFORMES',
    prix: 1500,
    unite: 'LITRE',
    quantiteDisponible: 90,
    localisation: 'Bouaké',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=640&q=60',
    actif: true,
    joursCreation: -8,
  },
  {
    id: 'prd_gombo',
    producteurId: IDS_DEMO.producteur2,
    nom: 'Gombo frais',
    description: 'Gombo frais du jour, vendu à la botte ou au kilogramme.',
    categorie: 'LEGUMES',
    prix: 700,
    unite: 'KG',
    quantiteDisponible: 0,
    localisation: 'Bouaké',
    imageUrl: 'https://images.unsplash.com/photo-1587334207440-f1a1b9f0c0e8?w=640&q=60',
    actif: true,
    joursCreation: -5,
  },
];

function creerProduits(maintenant: Date, producteurs: Utilisateur[]): Produit[] {
  return PRODUITS_DEMO.map((produit) => {
    const producteur = producteurs.find((utilisateur) => utilisateur.id === produit.producteurId);
    if (!producteur) {
      throw new Error(`Producteur de démonstration introuvable : ${produit.producteurId}`);
    }
    const resultat: Produit = {
      id: produit.id,
      producteurId: produit.producteurId,
      nom: produit.nom,
      description: produit.description,
      categorie: produit.categorie,
      prix: produit.prix,
      unite: produit.unite,
      quantiteDisponible: produit.quantiteDisponible,
      localisation: produit.localisation,
      imageUrl: produit.imageUrl,
      actif: produit.actif,
      dateCreation: decaler(maintenant, produit.joursCreation),
    };
    return resultat;
  });
}

export async function creerEtatDemo(maintenant: Date = new Date()): Promise<EtatApplication> {
  const users = await creerUtilisateurs(maintenant);
  const products = creerProduits(maintenant, users);

  const dateCmd1 = decaler(maintenant, -1, 10);
  const dateCmd2 = decaler(maintenant, -3, 8);
  const dateCmd3 = decaler(maintenant, -10, 11);

  const commandes: Commande[] = [
    {
      id: 'cmd_demo_1',
      reference: `CMD-${jourCompact(dateCmd1)}-1001`,
      acheteurId: IDS_DEMO.acheteur1,
      producteurId: IDS_DEMO.producteur1,
      lignes: [
        {
          produitId: 'prd_riz',
          nomProduit: 'Riz local de Gagnoa',
          unite: 'SAC',
          quantite: 5,
          prixUnitaire: 450,
          sousTotal: 2250,
        },
        {
          produitId: 'prd_tomate',
          nomProduit: 'Tomates fraîches',
          unite: 'KG',
          quantite: 10,
          prixUnitaire: 600,
          sousTotal: 6000,
        },
      ],
      montantProduits: 8250,
      fraisLivraison: 1500,
      montantTotal: 9750,
      adresseLivraison: 'Cocody, Abidjan',
      statut: 'EN_ATTENTE',
      dateCreation: dateCmd1,
      historique: [
        {
          le: dateCmd1,
          statutPrecedent: null,
          statut: 'EN_ATTENTE',
          acteurId: IDS_DEMO.acheteur1,
          commentaire: 'Commande créée depuis le panier.',
        },
      ],
    },
    {
      id: 'cmd_demo_2',
      reference: `CMD-${jourCompact(dateCmd2)}-1002`,
      acheteurId: IDS_DEMO.acheteur2,
      producteurId: IDS_DEMO.producteur2,
      lignes: [
        {
          produitId: 'prd_mangue',
          nomProduit: 'Mangues Kent',
          unite: 'KG',
          quantite: 20,
          prixUnitaire: 500,
          sousTotal: 10000,
        },
      ],
      montantProduits: 10000,
      fraisLivraison: 2000,
      montantTotal: 12000,
      adresseLivraison: 'Quartier Commerce, Bouaké',
      statut: 'EN_LIVRAISON',
      dateCreation: dateCmd2,
      historique: [
        {
          le: dateCmd2,
          statutPrecedent: null,
          statut: 'EN_ATTENTE',
          acteurId: IDS_DEMO.acheteur2,
          commentaire: 'Commande créée depuis le panier.',
        },
        {
          le: dateCmd2,
          statutPrecedent: 'EN_ATTENTE',
          statut: 'CONFIRMEE',
          acteurId: IDS_DEMO.producteur2,
        },
        {
          le: decaler(maintenant, -2, 9),
          statutPrecedent: 'CONFIRMEE',
          statut: 'EN_PREPARATION',
          acteurId: IDS_DEMO.producteur2,
        },
        {
          le: decaler(maintenant, -2, 15),
          statutPrecedent: 'EN_PREPARATION',
          statut: 'PRETE',
          acteurId: IDS_DEMO.producteur2,
        },
        {
          le: decaler(maintenant, -1, 8),
          statutPrecedent: 'PRETE',
          statut: 'EN_LIVRAISON',
          acteurId: IDS_DEMO.admin,
          commentaire: 'Livreur affecté.',
        },
      ],
    },
    {
      id: 'cmd_demo_3',
      reference: `CMD-${jourCompact(dateCmd3)}-1003`,
      acheteurId: IDS_DEMO.acheteur1,
      producteurId: IDS_DEMO.producteur2,
      lignes: [
        {
          produitId: 'prd_mais',
          nomProduit: 'Maïs jaune',
          unite: 'KG',
          quantite: 50,
          prixUnitaire: 300,
          sousTotal: 15000,
        },
      ],
      montantProduits: 15000,
      fraisLivraison: 2000,
      montantTotal: 17000,
      adresseLivraison: 'Cocody, Abidjan',
      statut: 'LIVREE',
      dateCreation: dateCmd3,
      historique: [
        {
          le: dateCmd3,
          statutPrecedent: null,
          statut: 'EN_ATTENTE',
          acteurId: IDS_DEMO.acheteur1,
          commentaire: 'Commande créée depuis le panier.',
        },
        {
          le: decaler(maintenant, -10, 12),
          statutPrecedent: 'EN_ATTENTE',
          statut: 'CONFIRMEE',
          acteurId: IDS_DEMO.producteur2,
        },
        {
          le: decaler(maintenant, -9, 8),
          statutPrecedent: 'CONFIRMEE',
          statut: 'EN_PREPARATION',
          acteurId: IDS_DEMO.producteur2,
        },
        {
          le: decaler(maintenant, -9, 11),
          statutPrecedent: 'EN_PREPARATION',
          statut: 'PRETE',
          acteurId: IDS_DEMO.producteur2,
        },
        {
          le: decaler(maintenant, -9, 14),
          statutPrecedent: 'PRETE',
          statut: 'EN_LIVRAISON',
          acteurId: IDS_DEMO.admin,
          commentaire: 'Livreur affecté.',
        },
        {
          le: decaler(maintenant, -8, 16),
          statutPrecedent: 'EN_LIVRAISON',
          statut: 'LIVREE',
          acteurId: IDS_DEMO.livreur2,
        },
      ],
    },
  ];

  const dateLiv1 = decaler(maintenant, -2, 16);
  const dateLiv2 = decaler(maintenant, -9, 14);

  const livraisons: Livraison[] = [
    {
      id: 'liv_demo_1',
      reference: `LIV-${jourCompact(dateLiv1)}-2001`,
      commandeId: 'cmd_demo_2',
      commandeReference: commandes[1].reference,
      livreurId: IDS_DEMO.livreur1,
      adresseDestination: 'Quartier Commerce, Bouaké',
      statut: 'ASSIGNEE',
      dateCreation: dateLiv1,
      dateAffectation: decaler(maintenant, -1, 8),
      dateLivraison: null,
      commentaire: '',
      historique: [
        {
          le: dateLiv1,
          ancienStatut: 'EN_ATTENTE',
          nouveauStatut: 'EN_ATTENTE',
          acteurId: IDS_DEMO.admin,
          commentaire: 'Livraison créée.',
        },
        {
          le: decaler(maintenant, -1, 8),
          ancienStatut: 'EN_ATTENTE',
          nouveauStatut: 'ASSIGNEE',
          acteurId: IDS_DEMO.admin,
          commentaire: 'Livreur Ibrahim Diallo affecté.',
        },
      ],
    },
    {
      id: 'liv_demo_2',
      reference: `LIV-${jourCompact(dateLiv2)}-2002`,
      commandeId: 'cmd_demo_3',
      commandeReference: commandes[2].reference,
      livreurId: IDS_DEMO.livreur2,
      adresseDestination: 'Cocody, Abidjan',
      statut: 'LIVREE',
      dateCreation: dateLiv2,
      dateAffectation: decaler(maintenant, -9, 14),
      dateLivraison: decaler(maintenant, -8, 16),
      commentaire: 'Livraison remise en main propre.',
      historique: [
        {
          le: dateLiv2,
          ancienStatut: 'EN_ATTENTE',
          nouveauStatut: 'EN_ATTENTE',
          acteurId: IDS_DEMO.admin,
          commentaire: 'Livraison créée.',
        },
        {
          le: decaler(maintenant, -9, 14),
          ancienStatut: 'EN_ATTENTE',
          nouveauStatut: 'ASSIGNEE',
          acteurId: IDS_DEMO.admin,
          commentaire: 'Livreur Sery Kouassi affecté.',
        },
        {
          le: decaler(maintenant, -9, 15),
          ancienStatut: 'ASSIGNEE',
          nouveauStatut: 'EN_COURS',
          acteurId: IDS_DEMO.livreur2,
        },
        {
          le: decaler(maintenant, -8, 16),
          ancienStatut: 'EN_COURS',
          nouveauStatut: 'LIVREE',
          acteurId: IDS_DEMO.livreur2,
          commentaire: 'Livraison remise en main propre.',
        },
      ],
    },
  ];

  return {
    ...etatVide(),
    meta: { initialized: true, seedVersion: SEED_VERSION, revision: 0 },
    users,
    products,
    orders: commandes,
    deliveries: livraisons,
  };
}
