import Navbar from '@/components/layouts/navigation/top-navbar';
import { miniSidebarInitialValue } from '@/utils/constants';
import Footer from '@/components/layouts/footer/footer-bar';
import OwnerInformation from '@/components/user/user-details';
import MobileNavigation from '@/components/layouts/navigation/mobile-navigation';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import cn from 'classnames';
import SideBarMenu from '@/components/layouts/owner/menu';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import EdotoSidebar, { useShellOffsets } from '@/components/layouts/edoto-sidebar';
import {
  checkIsMaintenanceModeComing,
  checkIsMaintenanceModeStart,
} from '@/utils/constants';

const OwnerLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { padding } = useShellOffsets();
  const { locale, pathname } = useRouter();
  const router = useRouter();
  const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';
  const { width } = useWindowSize();
  const { permissions } = getAuthCredentials();
  let permission = hasAccess(adminOnly, permissions);
  const [underMaintenance] = useAtom(checkIsMaintenanceModeComing);
  const [underMaintenanceStart] = useAtom(checkIsMaintenanceModeStart);

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FAF7F2] transition-colors duration-150"
      dir={dir}
    >
      <Navbar />
      <MobileNavigation>
        {/** <OwnerInformation />**/}
        {!permission ? <SideBarMenu /> : null}
      </MobileNavigation>

      {/* Barre latérale sombre sur toute la hauteur, logo compris */}
      <EdotoSidebar>
        {/** <OwnerInformation />**/}
        {!permission ? <SideBarMenu /> : null}
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
export default OwnerLayout;
