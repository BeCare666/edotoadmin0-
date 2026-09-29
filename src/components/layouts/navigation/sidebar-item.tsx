import Link from '@/components/ui/link';
import { getIcon } from '@/utils/get-icon';
import { edotoNavIcons as sidebarIcons } from '@/components/icons/edoto-nav-icons';
import { useUI } from '@/contexts/ui.context';
import { useRouter } from 'next/router';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { ChevronRight } from '@/components/icons/chevron-right';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import AdvancePopover from '@/components/ui/advance-popover';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';

function getItemHref(item: any, shop: any): string {
  if (typeof item?.href === 'function') {
    if (shop != null && String(shop).trim() !== '') return item.href(String(shop));
    return '#';
  }
  return item?.href ?? '#';
}

function SidebarShortItem({
  childMenu,
  shop,
  label,
  currentUserPermissions,
  icon,
  miniSidebar,
}: {
  childMenu: any;
  shop: any;
  label: string;
  currentUserPermissions: any;
  icon: string;
  miniSidebar: boolean;
}) {
  const { closeSidebar } = useUI();
  const [dropdown, setDropdown] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const sanitizedPath = router.asPath.split('#')[0].split('?')[0];
  return (
    <AdvancePopover
      onMouseEnter={() => setDropdown(true)}
      onMouseLeave={() => setDropdown(false)}
      content={() => (
        <>
          {childMenu?.map((item: any, index: number) => {
            if (shop && !hasAccess(item?.permissions, currentUserPermissions))
              return null;
            const itemHref = getItemHref(item, shop);
            return (
              <div key={index}>
                <Link
                  passHref
                  as={itemHref}
                  href={{
                    pathname: itemHref,
                    query: { parents: label },
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-start transition-colors',
                    sanitizedPath === itemHref
                      ? 'bg-[#FCE8F0] font-medium text-[#C2185B]'
                      : 'text-[#3B342D] hover:bg-[#F6F1EA] hover:text-[#1F1B16]',
                  )}
                  title={t(item?.label)}
                  onClick={() => closeSidebar()}
                >
                  {t(item?.label)}
                </Link>
              </div>
            );
          })}
        </>
      )}
      isPopover={true}
      className="!w-60 !rounded-2xl border border-[#EDE6DC] !bg-[#FFFDF9] !p-2 text-start"
      isOpen={dropdown}
      placement="left"
    >
      <div
        className={cn(
          'relative flex w-full cursor-pointer items-center justify-center rounded-2xl py-3 text-sm text-[#D8CFC3] transition-colors duration-200 before:absolute before:-right-5 before:top-0 before:h-full before:w-5 before:content-[""] hover:bg-white/[0.06] hover:text-white',
          dropdown && 'bg-white/[0.06] text-white',
        )}
        aria-label={label}
      >
        {getIcon({
          iconList: sidebarIcons,
          iconName: icon,
          className: 'w-[18px] h-[18px]',
        })}
      </div>
    </AdvancePopover>
  );
}

const SidebarItem = ({
  href,
  icon,
  label,
  childMenu,
  miniSidebar,
}: {
  href: any;
  icon: any;
  label: string;
  childMenu: [];
  miniSidebar?: boolean;
}) => {
  const { closeSidebar } = useUI();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowSize();

  const {
    query: { shop },
    locale,
    pathname,
  } = useRouter();
  const sanitizedPath = router?.asPath?.split('#')[0]?.split('?')[0];

  const isParents = router?.query?.parents;
  const isActive = useMemo(() => {
    if (isParents) {
      return isParents === label;
    }
    let lastIndex = router?.asPath?.lastIndexOf('/');
    if (label !== 'Settings') {
      return (
        router?.asPath
          ?.substring(lastIndex + 1)
          ?.replace(/[^a-zA-Z ]/g, ' ')
          ?.trim()
          ?.toUpperCase() === label?.trim()?.toUpperCase()
      );
    }
    return router?.asPath
      ?.trim()
      ?.toUpperCase()
      ?.includes(label?.trim()?.toUpperCase());
  }, [router?.asPath, isParents]);

  href =
    href && href !== '/' && href?.endsWith('/') ? href?.slice(0, -1) : href;
  const [isOpen, setOpen] = useState<boolean>(isActive);

  useEffect(() => {
    setOpen(isActive);
  }, [isActive]);

  const toggleCollapse = useCallback(() => {
    setOpen((prevValue) => !prevValue);
  }, [isOpen]);

  const onClick = useCallback(() => {
    if (Array.isArray(childMenu) && !!childMenu.length) {
      toggleCollapse();
    }
  }, [isOpen]);

  const { permissions: currentUserPermissions } = getAuthCredentials();
  return childMenu && childMenu?.length ? (
    miniSidebar && width >= RESPONSIVE_WIDTH ? (
      <SidebarShortItem
        currentUserPermissions={currentUserPermissions}
        shop={shop}
        label={label}
        childMenu={childMenu}
        icon={icon}
        miniSidebar={miniSidebar && width >= RESPONSIVE_WIDTH}
      />
    ) : (
      <>
        <motion.div
          initial={false}
          className={cn(
            'group cursor-pointer rounded-2xl px-4 py-3 transition-colors duration-200',
            isOpen
              ? 'bg-white/[0.08] text-white'
              : 'text-[#D8CFC3] hover:bg-white/[0.06] hover:text-white',
          )}
          onClick={onClick}
        >
          <div className={cn('flex w-full items-center gap-3 text-sm')}>
            <span className={cn('shrink-0', isOpen ? 'text-[#FF6EA9]' : '')}>
              {getIcon({
                iconList: sidebarIcons,
                iconName: icon,
                className: 'w-[18px] h-[18px]',
              })}
            </span>
            <span
              className={
                width >= RESPONSIVE_WIDTH && miniSidebar ? 'hidden' : ''
              }
            >
              {label}
            </span>

            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 shrink-0 opacity-75 transition-transform duration-300 ltr:ml-auto ltr:mr-0 rtl:mr-auto rtl:ml-0',
                isOpen ? 'rotate-90 transform' : '',
                width >= RESPONSIVE_WIDTH && miniSidebar ? 'hidden' : '',
              )}
            />
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 },
              }}
              transition={{
                duration: 0.35,
                ease: [0.33, 1, 0.68, 1],
              }}
              className={miniSidebar ? 'relative' : '!mt-0'}
            >
              <div className="pb-1 pt-1.5 ltr:pl-[26px] rtl:pr-[26px]">
                <div className="space-y-0.5 border-0 border-white/10 ltr:border-l ltr:pl-2 rtl:border-r rtl:pr-2">
                  {childMenu?.map((item: any, index: number) => {
                    if (
                      shop &&
                      !hasAccess(item?.permissions, currentUserPermissions)
                    )
                      return null;
                    const itemHref = getItemHref(item, shop);
                    return (
                      <div key={index}>
                        <Link
                          passHref
                          href={{
                            pathname: itemHref,
                            query: {
                              parents: label,
                            },
                          }}
                          as={itemHref}
                          className={cn(
                            'relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-start transition-colors duration-200',
                            sanitizedPath === itemHref
                              ? 'bg-[#FFFDF9] font-medium text-[#1F1B16] shadow-lg'
                              : 'text-[#B8AC9E] hover:bg-white/[0.06] hover:text-white',
                          )}
                          title={t(item.label)}
                          onClick={() => closeSidebar()}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              sanitizedPath === itemHref ? 'bg-[#C2185B]' : 'bg-white/20',
                            )}
                          />
                          <span className="truncate">{t(item.label)}</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </>
    )
  ) : (
    <Link
      href={href}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-start transition-colors duration-200',
        miniSidebar && width >= RESPONSIVE_WIDTH ? 'justify-center !px-0' : '',
        sanitizedPath === href
          ? 'bg-[#FFFDF9] font-medium text-[#1F1B16] shadow-lg'
          : 'text-[#D8CFC3] hover:bg-white/[0.06] hover:text-white',
      )}
      title={label}
      aria-label={miniSidebar && width >= RESPONSIVE_WIDTH ? label : undefined}
      aria-current={sanitizedPath === href ? 'page' : undefined}
      onClick={() => closeSidebar()}
    >
      {icon ? (
        <span
          className={cn(
            'shrink-0 transition-colors',
            sanitizedPath === href ? 'text-[#C2185B]' : '',
          )}
        >
          {getIcon({
            iconList: sidebarIcons,
            iconName: icon,
            className: 'w-[18px] h-[18px]',
          })}
        </span>
      ) : null}
      <span
        className={cn(
          'flex-1 truncate',
          miniSidebar && width >= RESPONSIVE_WIDTH ? 'hidden' : '',
        )}
      >
        {label}
      </span>
    </Link>
  );
};

export default SidebarItem;
