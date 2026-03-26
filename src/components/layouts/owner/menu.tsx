import { siteSettings } from '@/settings/site.settings';
import Link from '@/components/ui/link';
import { useTranslation } from 'next-i18next';
import { getIcon } from '@/utils/get-icon';
import * as sidebarIcons from '@/components/icons/sidebar';
import cn from 'classnames';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { miniSidebarInitialValue } from '@/utils/constants';
import { useAtom } from 'jotai';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';
import { getAuthCredentials, hasAccess } from '@/utils/auth-utils';
interface NavLinkProps {
  href: string;
  title?: string;
  icon: React.ReactNode;
  isCollapse?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

function NavLink({
  href,
  icon,
  title,
  isCollapse,
  children,
  onClick,
}: NavLinkProps) {
  return (
    <div className="opacity-0 relative h-2">

      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-start',
          isCollapse ? 'w-8 xl:w-auto' : 'w-auto xl:w-8',
        )}
      >
        {icon}
      </span>

      {/* Si title existe, on l’affiche */}
      {title && (
        <span
          className={cn(
            'text-dark-100 dark:text-light-400',
            isCollapse ? 'inline-flex xl:hidden' : 'hidden xl:inline-flex',
          )}
        >
          {title}
        </span>
      )}

      {/* Si children existe, on l’affiche aussi */}
      {children && (
        <span
          className={cn(
            'text-dark-100 dark:text-light-400',
            isCollapse ? 'inline-flex xl:hidden' : 'hidden xl:inline-flex',
          )}
        >
          {children}
        </span>
      )}
    </div >
  );
}
const SideBarMenu = () => {
  const { t } = useTranslation();
  const { sidebarLinks } = siteSettings;
  console.log("sidebarLinks", sidebarLinks)
  const router = useRouter();
  const sanitizedPath = router?.asPath?.split('#')[0]?.split('?')[0];
  const { pathname } = router;
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const { width } = useWindowSize();
  const { permissions = [] } = getAuthCredentials(); // ✅ fallback [] 

  return (
    <>
      {!isEmpty(sidebarLinks?.ownerDashboard) ? (
        <div className="flex flex-col px-5 pt-10 pb-3">
          {miniSidebar && width >= RESPONSIVE_WIDTH ? (
            ''
          ) : (
            <h3 className="px-3 pb-5 text-xs font-semibold uppercase tracking-[0.05em] text-body/60">
              {t('text-nav-menu')}
            </h3>
          )}
          <div className="space-y-2">
            {sidebarLinks?.ownerDashboard?.map((item, index) => {
              if (!hasAccess(item?.permissions ?? [], permissions)) return null; // ✅ safe
              return (
                <>
                  <Link
                    href={item?.href ?? "#"} // ✅ fallback
                    key={index}
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-gray-700 text-start focus:text-accent',
                      miniSidebar && width >= RESPONSIVE_WIDTH
                        ? 'hover:text-accent-hover ltr:pl-3 rtl:pr-3'
                        : 'hover:bg-gray-100',
                      pathname === item?.href
                        ? `font-medium !text-accent-hover ${!miniSidebar
                          ? 'bg-accent/10 hover:!bg-accent/10'
                          : null
                        }`
                        : null,
                    )}
                    title={t(item?.label)}
                  >
                    <span
                      className={cn(
                        pathname === item?.href
                          ? 'text-accent'
                          : 'text-gray-600 group-focus:text-accent',
                        miniSidebar && width >= RESPONSIVE_WIDTH ? 'm-auto' : '',
                      )}
                    >
                      {getIcon({
                        iconList: sidebarIcons,
                        iconName: item?.icon ?? "", // ✅ fallback
                        className: 'w-5 h-5',
                      })}
                    </span>
                    {miniSidebar && width >= RESPONSIVE_WIDTH ? (
                      ''
                    ) : (
                      <>{t(item?.label)}</>
                    )}
                  </Link>
                  <NavLink
                    title="Terms & Conditions"
                    href="https://galileecommerce.com/termes_conditions"
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-pink-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    }
                  />
                </>
              );
            })}
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  );
};

export default SideBarMenu;
