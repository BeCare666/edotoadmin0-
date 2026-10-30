import {
  adminAndOwnerOnly,
  adminOnly,
  adminOwnerAndStaffOnly,
  ownerAndStaffOnly,
} from '@/utils/auth-utils';
import { Routes } from '@/config/routes';

// TODO : this area need to be checked in Pixer

export const siteSettings = {
  name: 'edotofamily',
  description: '',
  logo: {
    url: '/logo_red.png',
    alt: 'edotofamily',
    href: '/',
    width: 138,
    height: 34,
  },
  collapseLogo: {
    url: '/logo_red.png',
    alt: 'P',
    href: '/',
    width: 32,
    height: 32,
  },
  defaultLanguage: 'fr',
  author: {
    name: '',
    websiteUrl: 'http://localhost:3002',
    address: '',
  },
  headerLinks: [],
  authorizedLinks: [
    {
      href: Routes.profileUpdate || '#',
      labelTransKey: 'authorized-nav-item-profile',
      icon: 'UserIcon',
      permission: adminOwnerAndStaffOnly,
    },
    {
      href: Routes.settings || '#',
      labelTransKey: 'authorized-nav-item-settings',
      icon: 'SettingsIcon',
      permission: adminOnly,
    },
    {
      href: Routes.logout || '#',
      labelTransKey: 'authorized-nav-item-logout',
      icon: 'LogOutIcon',
      permission: adminOwnerAndStaffOnly,
    },
  ],
  currencyCode: 'USD',
  sidebarLinks: {
    admin: {
      root: {
        href: Routes.dashboard || '#',
        label: 'text-main',
        icon: 'DashboardIcon',
        childMenu: [
          {
            href: Routes.dashboard || '#',
            label: 'sidebar-nav-item-dashboard',
            icon: 'DashboardIcon',
          },
        ],
      },

      campaign: {
        href: '#',
        label: 'text-campaign-management',
        icon: 'CalendarScheduleIcon',
        childMenu: [
          {
            href: Routes.campaign?.list || '#',
            label: 'sidebar-nav-item-campaigns',
            icon: 'CalendarScheduleIcon',
          },
          {
            href: Routes.campaign?.create || '#',
            label: 'sidebar-nav-item-create-campaign',
            icon: 'CalendarPlusIcon',
          },
          {
            href: Routes.campaignRequests || '#',
            label: 'text-kit-requests-to-process',
            icon: 'OrdersIcon',
          },
          {
            href: Routes.campaignRequestsProcessed || '#',
            label: 'text-kit-requests-processed',
            icon: 'OrdersIcon',
          },
          {
            href: Routes.campaignRequestsWithdrawn || '#',
            label: 'text-kit-requests-withdrawn',
            icon: 'OrdersIcon',
          },
          {
            href: Routes.sponsors || '#',
            label: 'text-sponsors',
            icon: 'SponsorIcon',
          },
          {
            href: Routes.campaignProposals || '#',
            label: 'text-campaign-proposals',
            icon: 'CalendarPlusIcon',
          },
          {
            href: Routes.sponsorExports || '#',
            label: 'text-sponsor-exports',
            icon: 'DownloadIcon',
          },
        ],
      },
      // Téléconsultation (19/10/2026) : rendez-vous visio ou appel, médecins, centres, orientations par code QR
      teleconsultation: {
        href: '#',
        label: 'text-teleconsultation',
        icon: 'StethoscopeIcon',
        childMenu: [
          {
            href: Routes.teleconsultation || '#',
            label: 'text-tc-appointments',
            icon: 'VideoCallIcon',
          },
          {
            href: Routes.teleconsultationDoctors || '#',
            label: 'text-tc-doctors',
            icon: 'StethoscopeIcon',
          },
          {
            href: Routes.teleconsultationCenters || '#',
            label: 'text-tc-centers',
            icon: 'HospitalIcon',
          },
          {
            href: Routes.teleconsultationReferrals || '#',
            label: 'text-tc-referrals',
            icon: 'QrNavIcon',
          },
        ],
      },
      // Contraception (21/10/2026) : demandes d'adoption en 7 étapes et fiches des contraceptifs
      contraception: {
        href: '#',
        label: 'text-contraception',
        icon: 'ContraceptionIcon',
        childMenu: [
          {
            href: Routes.contraception || '#',
            label: 'text-contra-requests',
            icon: 'ContraceptionIcon',
          },
          {
            href: Routes.contraceptionMethods || '#',
            label: 'text-contra-methods',
            icon: 'ProductsIcon',
          },
        ],
      },
      shop: {
        href: '#',
        label: 'text-shop-management',
        icon: 'ShopIcon',
        childMenu: [
          {
            href: '#',
            label: 'sidebar-nav-item-shops',
            icon: 'ShopIcon',
            childMenu: [
              {
                href: Routes.shop?.list || '#',
                label: 'text-all-shops',
                icon: 'MyShopIcon',
              },

              {
                href: Routes.newShops || '#',
                label: 'text-inactive-shops',
                icon: 'MyShopIcon',
              },
            ],
          },
          {
            href: Routes.adminMyShops || '#',
            label: 'sidebar-nav-item-my-shops',
            icon: 'MyShopIcon',
          },
        ],
      },

      product: {
        href: '#',
        label: 'text-product-management',
        icon: 'ProductsIcon',
        childMenu: [
          {
            href: '#',
            label: 'sidebar-nav-item-products',
            icon: 'ProductsIcon',
            childMenu: [
              {
                href: Routes.product?.list || '#',
                label: 'text-all-products',
                icon: 'ProductsIcon',
              },
              {
                href: Routes.draftProducts || '#',
                label: 'text-my-draft-products',
                icon: 'ProductsIcon',
              },
              {
                href: Routes.outOfStockOrLowProducts || '#',
                label: 'text-all-out-of-stock',
                icon: 'ProductsIcon',
              },
            ],
          },

          {
            href: Routes.productInventory || '#',
            label: 'text-inventory',
            icon: 'InventoryIcon',
          },

          {
            href: Routes.tag?.list || '#',
            label: 'sidebar-nav-item-tags',
            icon: 'TagIcon',
          },

        ],
      },



      order: {
        href: Routes.order?.list || '#',
        label: 'text-order-management',
        icon: 'OrdersIcon',
        childMenu: [
          {
            href: Routes.order?.list || '#',
            label: 'text-orders-to-process',
            icon: 'OrdersIcon',
          },
          {
            href: Routes.ordersProcessed || '#',
            label: 'text-orders-processed',
            icon: 'OrdersIcon',
          },
          {
            href: Routes.ordersWithdrawn || '#',
            label: 'text-orders-withdrawn',
            icon: 'OrdersIcon',
          },
          {
            href: Routes.customDeliveries || '#',
            label: 'text-custom-deliveries',
            icon: 'TruckIcon',
          },
          {
            // B6 : le journal de l'argent réel (avant : ancienne page des retraits du modèle d'origine)
            href: Routes.transactions || '#',
            label: 'text-transactions',
            icon: 'TransactionsIcon',
          },
        ],
      },

      user: {
        href: '#',
        label: 'text-user-control',
        icon: 'SettingsIcon',
        childMenu: [
          {
            href: Routes.user?.list || '#',
            label: 'text-all-users',
            icon: 'UsersIcon',
          },
          {
            href: Routes.adminList || '#',
            label: 'text-admin-list',
            icon: 'AdminListIcon',
          },
          // B8 (30/10/2026) : « Vendeurs » retiré du menu : aucun compte vendeur et inscription des vendeurs fermée
          // (SELLER_SIGNUP_OPEN côté API). Pages gardées (users/vendors) ; remettre ce bloc à la réouverture.
          {
            href: Routes.customerList || '#',
            label: 'text-customers',
            icon: 'CustomersIcon',
          },
          {
            href: Routes.pickupPoints || '#',
            label: 'text-pickup-points',
            icon: 'MapPinIcon',
          },
          {
            href: Routes.commissions || '#',
            label: 'text-pickup-commissions',
            icon: 'WalletIcon',
          },
          {
            href: Routes.pickupWithdrawals || '#',
            label: 'text-pickup-withdrawals',
            icon: 'WalletIcon',
          },
        ],
      },

      feedback: {
        href: '#',
        label: 'text-feedback-control',
        icon: 'SettingsIcon',
        childMenu: [
          {
            href: Routes.reviews?.list || '#',
            label: 'sidebar-nav-item-reviews',
            icon: 'ReviewIcon',
          },
          {
            href: Routes.question?.list || '#',
            label: 'sidebar-nav-item-questions',
            icon: 'QuestionIcon',
          },
        ],
      },

      settings: {
        href: '#',
        label: 'text-site-management',
        icon: 'SettingsIcon',
        childMenu: [
          {
            href: Routes.siteFont || '#',
            label: 'text-site-font',
            icon: 'SettingsIcon',
          },
          // B5 (30/10/2026) : seuls les réglages qui ont un effet. Les pages du modèle d'origine (entreprise, paiement,
          // boutique, SEO, événements, maintenance, popup) écrivent dans la ligne settings que ni le site ni l'API ne
          // lisent ; elles sortent du menu (fichiers gardés). La maintenance réelle = variable MAINTENANCE_MODE sur Render.
          // Général : la devise sert à l'affichage des prix dans l'admin (use-price.ts).
          { href: Routes.settings || '#', label: 'text-general-settings', icon: 'SettingsIcon' },
        ],
      },
    },

    shop: {
      root: {
        href: '#',
        label: 'text-main',
        icon: 'DashboardIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `${Routes.dashboard}${shop}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-dashboard',
            icon: 'DashboardIcon',
            permissions: adminOwnerAndStaffOnly,
          },
        ],
      },

      product: {
        href: '#',
        label: 'text-product-management',
        icon: 'ProductsIcon',
        permissions: adminOwnerAndStaffOnly,
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.product?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-products',
            icon: 'ProductsIcon',
            childMenu: [
              {
                href: (shop: string) =>
                  `/${shop}${Routes.product?.list || ''}`.replace(/\/+/, '/'),
                label: 'text-all-products',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
              {
                href: (shop: string) =>
                  `/${shop}${Routes.product?.create || ''}`.replace(/\/+/, '/'),
                label: 'text-new-products',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
              {
                href: (shop: string) =>
                  `/${shop}${Routes.draftProducts || ''}`.replace(/\/+/, '/'),
                label: 'text-my-draft',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
              {
                href: (shop: string) =>
                  `/${shop}${Routes.outOfStockOrLowProducts || ''}`.replace(
                    /\/+/,
                    '/'
                  ),
                label: 'text-all-out-of-stock',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
            ],
          },
          {
            href: (shop: string) =>
              `/${shop}${Routes.productInventory || ''}`.replace(/\/+/, '/'),
            label: 'text-inventory',
            icon: 'InventoryIcon',
            permissions: adminOwnerAndStaffOnly,
          },
        ],
      },



      order: {
        href: '#',
        label: 'text-order-management',
        icon: 'OrdersIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.order?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-orders',
            icon: 'OrdersIcon',
            permissions: adminOwnerAndStaffOnly,
          },
          {
            href: (shop: string) =>
              `/${Routes.transaction || ''}`.replace(/\/+/, '/'),
            label: 'text-transactions',
            icon: 'CalendarScheduleIcon',
            permissions: adminAndOwnerOnly,
          },
        ],
      },

      feedback: {
        href: '#',
        label: 'text-feedback-control',
        icon: 'SettingsIcon',
        childMenu: [

          {
            href: (shop: string) =>
              `/${shop}${Routes.question?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-questions',
            icon: 'QuestionIcon',
            permissions: adminAndOwnerOnly,
          },
          {
            href: (shop: string) =>
              `/${shop}${Routes.reviews?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-reviews',
            icon: 'ReviewIcon',
            permissions: adminAndOwnerOnly,
          },
        ],
      },

    },


    ownerDashboard: [
      {
        href: Routes.dashboard || '#',
        label: 'sidebar-nav-item-dashboard',
        icon: 'DashboardIcon',
        permissions: ownerAndStaffOnly,
      },
      {
        href: Routes.ownerDashboardMyShop || '#',
        label: 'common:sidebar-nav-item-my-shops',
        icon: 'MyShopOwnerIcon',
        permissions: ownerAndStaffOnly,
      },
      {
        href: Routes.profileUpdate || '#',
        label: 'authorized-nav-item-profile',
        icon: 'UserIcon',
        permissions: ownerAndStaffOnly,
      },
      {
        href: Routes.userprofile || '#',
        label: 'visite-your-user-profile',
        icon: 'UserIcon',
        permissions: ownerAndStaffOnly,
      },
      {
        href: Routes.logout || '#',
        label: 'authorized-nav-item-logout',
        icon: 'LogOutIcon',
        permissions: ownerAndStaffOnly,
      },
    ],
  },
  product: {
    placeholder: '/product-placeholder.svg',
  },
  avatar: {
    placeholder: '/avatar-placeholder.svg',
  },
};

export const socialIcon = [
  {
    value: 'FacebookIcon',
    label: 'Facebook',
  },
  {
    value: 'InstagramIcon',
    label: 'Instagram',
  },
  {
    value: 'TwitterIcon',
    label: 'Twitter',
  },
  {
    value: 'YouTubeIcon',
    label: 'Youtube',
  },
];

{/***      {
        href: Routes.shop?.create || '#',
        label: 'common:text-create-shop',
        icon: 'ShopIcon',
        permissions: ownerAndStaffOnly,
      },
          {
      href: Routes.shop?.create || '#',
      labelTransKey: 'common:text-create-shop',
      icon: 'ShopIcon',
      permission: adminAndOwnerOnly,
    },
    
              {
            href: Routes.category?.list || '#',
            label: 'sidebar-nav-item-categories',
            icon: 'CategoriesIcon',
          },
    
    staff: {
      root: {
        href: '#',
        label: 'text-main',
        icon: 'DashboardIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `${Routes.dashboard}${shop}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-dashboard',
            icon: 'DashboardIcon',
            permissions: adminOwnerAndStaffOnly,
          },
        ],
      },

      product: {
        href: '#',
        label: 'text-product-management',
        icon: 'ProductsIcon',
        permissions: adminOwnerAndStaffOnly,
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.product?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-products',
            icon: 'ProductsIcon',
            childMenu: [
              {
                href: (shop: string) =>
                  `/${shop}${Routes.product?.list || ''}`.replace(/\/+/, '/'),
                label: 'text-all-products',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
              {
                href: (shop: string) =>
                  `/${shop}${Routes.product?.create || ''}`.replace(/\/+/, '/'),
                label: 'text-new-products',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
              {
                href: (shop: string) =>
                  `/${shop}${Routes.draftProducts || ''}`.replace(/\/+/, '/'),
                label: 'text-my-draft',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
              {
                href: (shop: string) =>
                  `/${shop}${Routes.outOfStockOrLowProducts || ''}`.replace(
                    /\/+/,
                    '/'
                  ),
                label: 'text-low-out-of-stock',
                icon: 'ProductsIcon',
                permissions: adminOwnerAndStaffOnly,
              },
            ],
          },
          {
            href: (shop: string) =>
              `/${shop}${Routes.productInventory || ''}`.replace(/\/+/, '/'),
            label: 'text-inventory',
            icon: 'InventoryIcon',
            permissions: adminOwnerAndStaffOnly,
          },
        ],
      },

      order: {
        href: '#',
        label: 'text-order-management',
        icon: 'OrdersIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.order?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-orders',
            icon: 'OrdersIcon',
            permissions: adminOwnerAndStaffOnly,
          },
        ],
      },
    },

          {
            href: Routes.type?.list || '#',
            label: 'text-groups',
            icon: 'HomeIcon',
          },


           {
            href: (shop: string) =>
              `/${shop}${Routes.reviews?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-reviews',
            icon: 'ReviewIcon',
            permissions: adminAndOwnerOnly,
          },





      financial: {
        href: '#',
        label: 'text-financial-management',
        icon: 'WithdrawIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.withdraw?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-withdraws',
            icon: 'AttributeIcon',
            permissions: adminAndOwnerOnly,
          },
        ],
      },



              {
                href: Routes.shop?.create || '#',
                label: 'text-add-all-shops',
                icon: 'ShopIcon',
              },

      layout: {
        href: '#',
        label: 'text-page-control',
        icon: 'SettingsIcon',
        childMenu: [
          {
            href: '#',
            label: 'text-faqs',
            icon: 'FaqIcon',
            childMenu: [
              {
                href: Routes.faqs?.list || '#',
                label: 'text-all-faqs',
                icon: 'FaqIcon',
              },
              {
                href: Routes.faqs?.create || '#',
                label: 'text-new-faq',
                icon: 'TypesIcon',
              },
            ],
          },

        ],
      },
      layout: {
        href: '#',
        label: 'text-page-management',
        icon: 'SettingsIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.faqs?.list || ''}`.replace(/\/+/, '/'),
            label: 'text-faqs',
            icon: 'TypesIcon',
            permissions: adminOwnerAndStaffOnly,
          },
          {
            href: (shop: string) =>
              `/${shop}${Routes.termsAndCondition?.list || ''}`.replace(
                /\/+/,
                '/'
              ),
            label: 'Terms And Conditions',
            icon: 'TypesIcon',
            permissions: adminAndOwnerOnly,
          },
        ],
      },
      // à remettre après le deedback dans sidebarlinks
            user: {
        href: '#',
        label: 'text-user-control',
        icon: 'SettingsIcon',
        childMenu: [
          {
            href: (shop: string) =>
              `/${shop}${Routes.staff?.list || ''}`.replace(/\/+/, '/'),
            label: 'sidebar-nav-item-staffs',
            icon: 'UsersIcon',
            permissions: adminAndOwnerOnly,
          },
        ],
      },
    ***/}