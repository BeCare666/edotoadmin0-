import Navbar from '@/components/layouts/navigation/top-navbar';
import { miniSidebarInitialValue } from '@/utils/constants';
import Footer from '@/components/layouts/footer/footer-bar';
import MobileNavigation from '@/components/layouts/navigation/mobile-navigation';
import { siteSettings } from '@/settings/site.settings';
import { useTranslation } from 'next-i18next';
import SidebarItem from '@/components/layouts/navigation/sidebar-item';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import cn from 'classnames';
import EdotoSidebar, { useShellOffsets } from '@/components/layouts/edoto-sidebar';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';
import {
  checkIsMaintenanceModeComing,
  checkIsMaintenanceModeStart,
} from '@/utils/constants';

interface MenuItemsProps {
  [key: string]: {
    href: string;
    label: string;
    icon: string;
    childMenu: {
      href: string;
      label: string;
      icon: string;
    }[];
  };
}

const SidebarItemMap = ({ menuItems }: any) => {
  const { t } = useTranslation();
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const { childMenu } = menuItems;
  const { width } = useWindowSize();
  return (
    <div className="space-y-1">
      {childMenu?.map(
        ({
          href,
          label,
          icon,
          childMenu,
        }: {
          href: string;
          label: string;
          icon: string;
          childMenu: any;
        }) => (
          <SidebarItem
            href={href}
            key={label}
            label={t(label)}
            icon={icon}
            childMenu={childMenu}
            miniSidebar={miniSidebar && width >= RESPONSIVE_WIDTH}
          />
        )
      )}
    </div>
  );
};

const SideBarGroup = () => {
  const { t } = useTranslation();
  // @ts-ignore
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const menuItems: MenuItemsProps = siteSettings?.sidebarLinks?.admin;
  const menuKeys = Object.keys(menuItems);
  const { width } = useWindowSize();

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

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { locale, pathname } = useRouter();

  const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';
  const { padding } = useShellOffsets();
  const [underMaintenance] = useAtom(checkIsMaintenanceModeComing);
  const [underMaintenanceStart] = useAtom(checkIsMaintenanceModeStart);
  const { width } = useWindowSize();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FAF7F2] transition-colors duration-200"
      dir={dir}
    >
      <Navbar />
      <MobileNavigation>
        <SideBarGroup />
      </MobileNavigation>

      {/* Barre latérale sombre sur toute la hauteur, logo compris (même cadre que le dashboard des points de retrait) */}
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
export default AdminLayout;
