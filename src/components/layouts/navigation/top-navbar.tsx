import { useState } from 'react';
import { SearchIcon } from '@/components/icons/search-icon';
import LanguageSwitcher from '@/components/layouts/navigation/language-switcher';
import MessageBar from '@/components/layouts/topbar/message-bar';
import RecentOrderBar from '@/components/layouts/topbar/recent-order-bar';
import SearchBar from '@/components/layouts/topbar/search-bar';
import StoreNoticeBar from '@/components/layouts/topbar/store-notice-bar';
import VisitStore from '@/components/layouts/topbar/visit-store';
import Alert from '@/components/ui/alert';
import CountdownTimer from '@/components/ui/countdown-timer';
import LinkButton from '@/components/ui/link-button';
import Loader from '@/components/ui/loader/loader';
import Link from '@/components/ui/link';
import Image from 'next/image';
import emblem from '../../../../public/logo/edoto-emblem.png';
import { MenuNavIcon, SearchNavIcon } from '@/components/icons/edoto-nav-icons';
import { useShellOffsets } from '@/components/layouts/edoto-sidebar';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import { useUI } from '@/contexts/ui.context';
import { useSettingsQuery } from '@/data/settings';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';
import { getNotifications } from "@/lib/fetcher";
import Notifications from "@/components/notifications/notifications";
import {
  adminAndOwnerOnly,
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import {
  RESPONSIVE_WIDTH,
  checkIsMaintenanceModeComing,
  checkIsMaintenanceModeStart,
  miniSidebarInitialValue,
  searchModalInitialValues,
} from '@/utils/constants';
import cn from 'classnames';
import { isBefore } from 'date-fns';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useWindowSize } from 'react-use';
import AuthorizedMenu from './authorized-menu';
import EdotoNotificationBell from './edoto-notification-bell';

export const isInArray = (array: Date[], value: Date) => {
  return !!array?.find((item) => {
    return item?.getDate() == value?.getDate();
  });
};

const Navbar = () => {
  const { t } = useTranslation();
  const { toggleSidebar } = useUI();
  const { permissions } = getAuthCredentials();
  const { enableMultiLang } = Config;
  const { locale, query } = useRouter();
  const { data } = useMeQuery();
  const { openModal } = useModalAction();
  const [searchModal, setSearchModal] = useAtom(searchModalInitialValues);
  const [miniSidebar, setMiniSidebar] = useAtom(miniSidebarInitialValue);
  const [isMaintenanceMode, setUnderMaintenance] = useAtom(
    checkIsMaintenanceModeComing,
  );
  const [isMaintenanceModeStart, setUnderMaintenanceStart] = useAtom(
    checkIsMaintenanceModeStart,
  );
  const { width } = useWindowSize();
  const { left: shellLeft } = useShellOffsets();
  const { settings, loading } = useSettingsQuery({ language: locale! });
  const [notifications, setNotifications] = useState({
    data: [],
    total: 0,
    current_page: 1,
    per_page: 20,
  });

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const {
    data: shop,
    isLoading: shopLoading,
    error,
  } = useShopQuery(
    {
      slug: query?.shop as string,
    },
    { enabled: Boolean(query?.shop) },
  );

  useEffect(() => {
    if (
      settings?.options?.maintenance?.start &&
      settings?.options?.maintenance?.until &&
      settings?.options?.isUnderMaintenance
    ) {
      const beforeDay = isBefore(
        new Date(),
        new Date(settings?.options?.maintenance?.start as string),
      );
      // Calculate maintenance start time
      const maintenanceStartTime = new Date(
        settings?.options?.maintenance?.start as string,
      );
      const maintenanceEndTime = new Date(
        settings?.options?.maintenance?.until as string,
      );
      maintenanceStartTime.setMinutes(maintenanceStartTime.getMinutes());

      // Check if the current time has passed the maintenance start time
      const currentTime = new Date();
      const checkIsMaintenanceStart =
        currentTime >= maintenanceStartTime &&
        currentTime < maintenanceEndTime &&
        settings?.options?.isUnderMaintenance;
      const checkIsMaintenance =
        beforeDay && settings?.options?.isUnderMaintenance;
      setUnderMaintenance(checkIsMaintenance as boolean);
      setUnderMaintenanceStart(checkIsMaintenanceStart as boolean);
    }
  }, [
    settings?.options?.maintenance?.start,
    settings?.options?.maintenance?.until,
    settings?.options?.isUnderMaintenance,
  ]);

  useEffect(() => {
    if (
      query?.shop &&
      shop?.settings?.shopMaintenance?.start &&
      shop?.settings?.shopMaintenance?.until &&
      shop?.settings?.isShopUnderMaintenance
    ) {
      const beforeDay = isBefore(
        new Date(),
        new Date(shop?.settings?.shopMaintenance?.start as Date),
      );
      // Calculate maintenance start time
      const maintenanceStartTime = new Date(
        shop?.settings?.shopMaintenance?.start as Date,
      );
      const maintenanceEndTime = new Date(
        shop?.settings?.shopMaintenance?.until as Date,
      );
      maintenanceStartTime.setMinutes(maintenanceStartTime.getMinutes());

      // Check if the current time has passed the maintenance start time
      const currentTime = new Date();
      const checkIsMaintenanceStart =
        currentTime >= maintenanceStartTime &&
        currentTime < maintenanceEndTime &&
        shop?.settings?.isShopUnderMaintenance;
      const checkIsMaintenance =
        beforeDay && shop?.settings?.isShopUnderMaintenance;
      setUnderMaintenance(checkIsMaintenance as boolean);
      setUnderMaintenanceStart(checkIsMaintenanceStart as boolean);
    }
  }, [
    query?.shop,
    shop?.settings?.shopMaintenance?.start,
    shop?.settings?.shopMaintenance?.until,
    shop?.settings?.isShopUnderMaintenance,
  ]);

  if (loading || shopLoading) {
    return <Loader showText={false} />;
  }

  const { options } = settings!;

  function handleClick() {
    openModal('SEARCH_VIEW');
    setSearchModal(true);
  }

  return (
    <header
      className={cn(
        'edoto-topbar fixed top-0 right-0 left-0 z-40 transition-[left,right] duration-300 ease-out',
        shellLeft,
      )}
    >
      {width >= RESPONSIVE_WIDTH && isMaintenanceMode ? (
        <Alert
          message={
            (settings?.options?.isUnderMaintenance &&
              `Site ${t('text-maintenance-mode-title')}`) ||
            (shop?.settings?.isShopUnderMaintenance &&
              `${shop?.name} ${t('text-maintenance-mode-title')}`)
          }
          variant="info"
          className="sticky top-0 left-0 z-50"
          childClassName="flex justify-center items-center w-full gap-4 font-bold"
        >
          <CountdownTimer
            date={
              (settings?.options?.isUnderMaintenance &&
                new Date(options?.maintenance?.start)) ||
              (shop?.settings?.isShopUnderMaintenance &&
                new Date(shop?.settings?.shopMaintenance?.start as Date))
            }
            className="text-blue-600 [&>p]:bg-blue-200 [&>p]:p-2 [&>p]:text-xs [&>p]:text-blue-600"
          />
        </Alert>
      ) : (
        ''
      )}
      {width >= RESPONSIVE_WIDTH && isMaintenanceModeStart ? (
        <Alert
          message={t('text-maintenance-mode-start-title')}
          className="py-[1.375rem]"
          childClassName="text-center w-full font-bold"
        />
      ) : (
        ''
      )}
      {/* En-tête E.doto : même présentation que le dashboard des points de retrait */}
      <nav className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-8 lg:h-20">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleSidebar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6F1EA] text-[#3B342D] transition hover:bg-[#EFE7DC] lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <MenuNavIcon className="h-5 w-5" />
        </motion.button>
        <Link href={Routes.dashboard} className="flex min-w-0 items-center gap-2 lg:hidden">
          <span className="relative h-8 w-8 shrink-0">
            <Image src={emblem} alt="E.doto family" fill sizes="32px" className="object-contain" priority />
          </span>
          <span className="edoto-serif hidden truncate text-lg text-[#1F1B16] sm:block">
            E.doto <span className="text-[#C2185B]">family</span>
          </span>
        </Link>

        <div className="relative hidden min-w-0 max-w-xl flex-1 lg:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6F1EA] text-[#3B342D] transition hover:bg-[#EFE7DC] lg:hidden"
            onClick={handleClick}
            aria-label={t('common:text-search')}
          >
            <SearchNavIcon className="h-[18px] w-[18px]" />
          </button>
          {hasAccess(adminAndOwnerOnly, permissions) && (
            <>
              <div className="hidden 2xl:block">
                <VisitStore />
              </div>
              <div className="hidden">
                <Notifications />
              </div>
            </>
          )}

          {/* Notifications calculées à partir des données réelles (super admin) */}
          {hasAccess(adminOnly, permissions) && <EdotoNotificationBell />}

          {/* Admin uniquement en français : plus de sélecteur de langue */}
          {enableMultiLang ? <LanguageSwitcher /> : null}

          <AuthorizedMenu />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
