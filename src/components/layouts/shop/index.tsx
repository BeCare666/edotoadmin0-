import Navbar from '@/components/layouts/navigation/top-navbar';
import { miniSidebarInitialValue } from '@/utils/constants';
import { useRouter } from 'next/router';
import { getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import SidebarItem from '@/components/layouts/navigation/sidebar-item';
import { siteSettings } from '@/settings/site.settings';
import { useTranslation } from 'next-i18next';
import MobileNavigation from '@/components/layouts/navigation/mobile-navigation';
import Footer from '@/components/layouts/footer/footer-bar';
import { useSettingsQuery } from '@/data/settings';
import { useAtom } from 'jotai';
import cn from 'classnames';
import EdotoSidebar, { useShellOffsets } from '@/components/layouts/edoto-sidebar';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';
import {
  checkIsMaintenanceModeComing,
  checkIsMaintenanceModeStart,
} from '@/utils/constants';
import { adminOnly } from '@/utils/auth-utils';

interface MenuItemsProps {
  [key: string]: {
    href: string;
    label: string;
    icon: string;
    permissions?: string[];
    childMenu: {
      href: string | any;
      label: string;
      icon: string;
      permissions?: string[];
    }[];
  };
}

const SidebarItemMap = ({ menuItems }: any) => {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettingsQuery({
    language: locale!,
  });
  const { childMenu } = menuItems;

  const isEnableTermsRoute = settings?.options?.enableTerms;
  const isEnableCouponsRoute = settings?.options?.enableCoupons;
  const { permissions: currentUserPermissions } = getAuthCredentials();
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const { width } = useWindowSize();
  const {
    query: { shop },
  } = useRouter();

  let termsAndConditions;
  let coupons;

  if (!Boolean(isEnableTermsRoute)) {
    termsAndConditions = menuItems?.childMenu.find(
      (item: any) => item?.label === 'Terms And Conditions',
    );
    if (termsAndConditions) termsAndConditions.permissions = adminOnly;
  }

  if (!isEnableCouponsRoute) {
    coupons = menuItems?.childMenu.find(
      (item: any) => item.label === 'Coupons',
    );
    if (coupons) coupons.permissions = adminOnly;
  }

  return (
    <div className="space-y-1">
      {childMenu?.map(
        ({
          href,
          label,
          icon,
          permissions,
          childMenu,
        }: {
          href: string;
          label: string;
          icon: string;
          childMenu: any;
          permissions: any;
        }) => {
          if (!childMenu && !hasAccess(permissions, currentUserPermissions)) {
            return null;
          }

          const resolvedHref =
            typeof href === 'function'
              ? shop != null && String(shop).trim() !== ''
                ? href(String(shop))
                : '#'
              : href;
          return (
            <SidebarItem
              key={label}
              href={resolvedHref}
              label={t(label)}
              icon={icon}
              childMenu={childMenu}
              miniSidebar={miniSidebar && width >= RESPONSIVE_WIDTH}
            />
          );
        },
      )}
    </div>
  );
};

const SideBarGroup = () => {
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const { role } = getAuthCredentials();
  const menuItems: MenuItemsProps =
    role === 'staff'
      ? siteSettings?.sidebarLinks?.staff
      : siteSettings?.sidebarLinks?.shop;
  const menuKeys = Object.keys(menuItems);
  const { width } = useWindowSize();
  const { t } = useTranslation();

  return (
    <>
      {menuKeys?.map((menu, index) => (
        <div
          className={cn(
            'flex flex-col',
            miniSidebar && width >= RESPONSIVE_WIDTH ? 'px-3 py-2' : 'px-4 pt-5',
          )}
          key={index}
        >
          <div
            className={cn(
              'px-4 pb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#9A8E80]',
              miniSidebar && width >= RESPONSIVE_WIDTH ? 'hidden' : '',
            )}
          >
            {t(menuItems[menu]?.label)}
          </div>
          <SidebarItemMap menuItems={menuItems[menu]} />
        </div>
      ))}
    </>
  );
};

const ShopLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { padding } = useShellOffsets();
  const { locale, pathname } = useRouter();
  const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';
  const { width } = useWindowSize();
  const [underMaintenance] = useAtom(checkIsMaintenanceModeComing);
  const [underMaintenanceStart] = useAtom(checkIsMaintenanceModeStart);

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FAF7F2] transition-colors duration-150"
      dir={dir}
    >
      <Navbar />
      <MobileNavigation>
        <SideBarGroup />
      </MobileNavigation>

      {/* Barre latérale sombre sur toute la hauteur, logo compris */}
      <EdotoSidebar>
        <SideBarGroup />
      </EdotoSidebar>

      <main
        className={cn(
          'relative flex min-h-screen w-full flex-col justify-start transition-[padding] duration-300 ease-out',
          width >= RESPONSIVE_WIDTH && (underMaintenance || underMaintenanceStart)
            ? 'lg:pt-[8.75rem]'
            : 'pt-16 lg:pt-20',
          padding,
        )}
      >
        <div key={pathname} className="edoto-page h-full flex-1 px-4 pb-10 pt-6 sm:px-8 sm:pt-8">{children}</div>
        <Footer />
      </main>
    </div>
  );
};
export default ShopLayout;
