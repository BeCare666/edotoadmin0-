import * as legacyIcons from '@/components/icons/sidebar';

// Icônes de navigation E.doto (28/09/2026) : un seul style de trait (24 px, trait 1,75, bouts arrondis).
// Les noms reprennent ceux de site.settings ; un nom absent retombe sur l'ancienne icône.
type IconProps = React.SVGAttributes<SVGElement> & { className?: string };

const make = (name: string, body: React.ReactNode) => {
  const Icon = ({ className, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {body}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
};

export const DashboardIcon = make('DashboardIcon', <>
  <rect x="3" y="3" width="7" height="9" rx="1.5" />
  <rect x="14" y="3" width="7" height="5" rx="1.5" />
  <rect x="14" y="12" width="7" height="9" rx="1.5" />
  <rect x="3" y="16" width="7" height="5" rx="1.5" />
</>);

export const CalendarScheduleIcon = make('CalendarScheduleIcon', <>
  <path d="M8 2v4M16 2v4" />
  <rect x="3" y="4" width="18" height="18" rx="2" />
  <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
</>);

export const CalendarPlusIcon = make('CalendarPlusIcon', <>
  <path d="M8 2v4M16 2v4" />
  <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
  <path d="M3 10h18M16 19h6M19 16v6" />
</>);

export const SponsorIcon = make('SponsorIcon', <>
  <circle cx="12" cy="8" r="6" />
  <path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11" />
</>);

export const DownloadIcon = make('DownloadIcon', <>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <path d="m7 10 5 5 5-5M12 15V3" />
</>);

export const ShopIcon = make('ShopIcon', <>
  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
  <path d="M2 7h20v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-2-.9 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-4 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2Z" />
</>);

export const MyShopIcon = make('MyShopIcon', <>
  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
  <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
</>);

export const MyShopOwnerIcon = MyShopIcon;

export const ProductsIcon = make('ProductsIcon', <>
  <path d="m7.5 4.27 9 5.15" />
  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
  <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
</>);

export const InventoryIcon = make('InventoryIcon', <>
  <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
  <path d="M6 18h12M6 14h12" />
  <path d="M6 22V10h12v12" />
</>);

export const TagIcon = make('TagIcon', <>
  <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z" />
  <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
</>);

export const OrdersIcon = make('OrdersIcon', <>
  <rect x="8" y="2" width="8" height="4" rx="1" />
  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
</>);

export const TruckIcon = make('TruckIcon', <>
  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
  <path d="M15 18H9" />
  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
  <circle cx="17" cy="18" r="2" />
  <circle cx="7" cy="18" r="2" />
</>);

export const TransactionsIcon = make('TransactionsIcon', <>
  <path d="M8 3 4 7l4 4M4 7h16" />
  <path d="m16 21 4-4-4-4M20 17H4" />
</>);

export const SettingsIcon = make('SettingsIcon', <>
  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
  <circle cx="12" cy="12" r="3" />
</>);

export const UsersIcon = make('UsersIcon', <>
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
</>);

export const UserIcon = make('UserIcon', <>
  <circle cx="12" cy="8" r="4.5" />
  <path d="M20 21a8 8 0 0 0-16 0" />
</>);

export const CustomersIcon = make('CustomersIcon', <>
  <circle cx="10" cy="8" r="4.5" />
  <path d="M2 21a8 8 0 0 1 13.29-6" />
  <path d="M19.5 14.5c-.9-.9-2.4-.9-3.3 0-.9.9-.9 2.3 0 3.2L19.5 21l3.3-3.3c.9-.9.9-2.3 0-3.2-.9-.9-2.4-.9-3.3 0Z" />
</>);

export const AdminListIcon = make('AdminListIcon', <>
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  <path d="m9 12 2 2 4-4" />
</>);

export const VendorsIcon = make('VendorsIcon', <>
  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  <rect x="2" y="6" width="20" height="14" rx="2" />
</>);

export const MapPinIcon = make('MapPinIcon', <>
  <path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0" />
  <circle cx="12" cy="10" r="3" />
</>);

export const WalletIcon = make('WalletIcon', <>
  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
</>);

export const ReviewIcon = make('ReviewIcon', <>
  <path d="M11.53 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.91l5.16-.75a2.12 2.12 0 0 0 1.6-1.16z" />
</>);

export const QuestionIcon = make('QuestionIcon', <>
  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
</>);

export const FaqIcon = make('FaqIcon', <>
  <circle cx="12" cy="12" r="10" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
</>);

export const HomeIcon = make('HomeIcon', <>
  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
  <path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
</>);

export const TypesIcon = make('TypesIcon', <>
  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
  <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
</>);

export const CategoriesIcon = make('CategoriesIcon', <>
  <rect x="3" y="3" width="7" height="7" rx="1.5" />
  <rect x="14" y="3" width="7" height="7" rx="1.5" />
  <rect x="14" y="14" width="7" height="7" rx="1.5" />
  <rect x="3" y="14" width="7" height="7" rx="1.5" />
</>);

export const WithdrawIcon = make('WithdrawIcon', <>
  <rect x="2" y="6" width="20" height="12" rx="2" />
  <circle cx="12" cy="12" r="2" />
  <path d="M6 12h.01M18 12h.01" />
</>);

export const AttributeIcon = make('AttributeIcon', <>
  <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
</>);

export const LogOutIcon = make('LogOutIcon', <>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  <path d="m16 17 5-5-5-5M21 12H9" />
</>);

// Icônes de l'habillage (en-tête, barre latérale, statistiques)
export const SearchNavIcon = make('SearchNavIcon', <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const MenuNavIcon = make('MenuNavIcon', <path d="M4 6h16M4 12h16M4 18h16" />);
export const CloseNavIcon = make('CloseNavIcon', <path d="M18 6 6 18M6 6l12 12" />);
export const ChevronNavIcon = make('ChevronNavIcon', <path d="m9 18 6-6-6-6" />);
export const PanelCloseIcon = make('PanelCloseIcon', <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M16 15l-3-3 3-3" /></>);
export const PanelOpenIcon = make('PanelOpenIcon', <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M14 9l3 3-3 3" /></>);
export const ExternalNavIcon = make('ExternalNavIcon', <path d="M7 7h10v10M7 17 17 7" />);
export const TrendingIcon = make('TrendingIcon', <path d="M22 7 13.5 15.5l-5-5L2 17M16 7h6v6" />);
export const RefundIcon = make('RefundIcon', <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>);
export const SunIcon = make('SunIcon', <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>);
export const MoonIcon = make('MoonIcon', <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);

const navIcons: Record<string, React.ComponentType<IconProps>> = {
  DashboardIcon, CalendarScheduleIcon, CalendarPlusIcon, SponsorIcon, DownloadIcon,
  ShopIcon, MyShopIcon, MyShopOwnerIcon, ProductsIcon, InventoryIcon, TagIcon,
  OrdersIcon, TruckIcon, TransactionsIcon, SettingsIcon, UsersIcon, UserIcon,
  CustomersIcon, AdminListIcon, VendorsIcon, MapPinIcon, WalletIcon, ReviewIcon,
  QuestionIcon, FaqIcon, HomeIcon, TypesIcon, CategoriesIcon, WithdrawIcon,
  AttributeIcon, LogOutIcon,
};

// Liste utilisée par getIcon : nouvelles icônes d'abord, anciennes en secours
export const edotoNavIcons: Record<string, any> = { ...legacyIcons, ...navIcons };
export const BellNavIcon = make('BellNavIcon', <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>);
export const BoxAlertIcon = make('BoxAlertIcon', <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M12 9v4M12 16.5h.01" /></>);
export const CheckCircleNavIcon = make('CheckCircleNavIcon', <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>);
