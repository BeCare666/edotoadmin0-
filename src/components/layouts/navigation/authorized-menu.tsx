import cn from 'classnames';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import Avatar from '@/components/common/avatar';
import Link from '@/components/ui/link';
import { siteSettings } from '@/settings/site.settings';
import { useTranslation } from 'next-i18next';
import { useMeQuery } from '@/data/user';
import { getIcon } from '@/utils/get-icon';
import { edotoNavIcons as sidebarIcons } from '@/components/icons/edoto-nav-icons';
import { useRouter } from 'next/router';
import { getAuthCredentials } from '@/utils/auth-utils';
import { initials } from '@/components/layouts/edoto-sidebar';

export default function AuthorizedMenu() {
  const { data } = useMeQuery(); // data peut être User ou null
  const { t } = useTranslation('common');
  const { pathname, query } = useRouter();
  const slug = pathname === '/[shop]' ? (query?.shop as string) || '' : '';
  const { role, permissions } = getAuthCredentials();
  console.log("me", data)
  // Pour éviter les erreurs TS, on déclare `user` en type any ici
  const user: any = data;

  return (
    <Menu
      as="div"
      className="relative inline-block shrink-0 grow-0 basis-auto text-left"
    >
      <Menu.Button className="flex max-w-[220px] items-center gap-3 rounded-2xl py-1 pl-1 pr-1 transition hover:bg-[#F6F1EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6EA9]/40 md:pr-3">
        {user?.profile?.avatar?.url ? (
          <img
            src={user.profile.avatar.url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6EA9] to-[#C2185B] text-sm font-semibold text-white">
            {initials(user?.name)}
          </span>
        )}
        <span className="hidden min-w-0 flex-col items-start text-sm ltr:text-left rtl:text-right md:flex">
          <span className="block w-full max-w-[160px] truncate text-[#1F1B16]">
            {user?.name ?? t('guest')}
          </span>
          <span className="block w-full truncate text-xs text-[#9A8E80]">
            {role === 'super_admin' ? 'Administrateur' : role ? role.replace(/_/g, ' ') : user?.email ?? ''}
          </span>
        </span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          as="ul"
          className="authorized-menu absolute end-0 mt-2 w-64 origin-top-end overflow-hidden rounded-2xl border border-[#EDE6DC] bg-[#FFFDF9] py-1 shadow-2xl focus:outline-none"
        >
          <Menu.Item>
            <li className="border-b border-[#F1ECE4] p-2 focus:outline-none">
              <div className="flex items-center gap-3 rounded-xl bg-[#F6F1EA] px-3 py-2.5">
                <Avatar
                  src={user?.profile?.avatar?.url ?? ''}
                  name={user?.name ?? 'avatar'}
                  className="shrink-0 grow-0 basis-auto drop-shadow"
                />
                <div className="flex w-[calc(100%-40px)] flex-col items-start space-y-0.5 text-sm">
                  <span className="w-full truncate font-medium text-[#1F1B16]">
                    {user?.name ?? t('guest')}
                  </span>
                  <span className="break-all text-xs text-[#9A8E80]">
                    {user?.email ?? ''}
                  </span>
                </div>
              </div>
            </li>
          </Menu.Item>

          <div className="space-y-0.5 py-2">
            {siteSettings.authorizedLinks?.map(({ href, labelTransKey, icon, permission }, index) => {
              const hasPermission = permission?.some((p) => permissions?.includes(p));
              if (!hasPermission) return null;
              return (
                <Menu.Item key={`${href}-${labelTransKey}-${index}`}>
                  {({ active }) => (
                    <li
                      className={cn(
                        'cursor-pointer border-[#F1ECE4] px-2 last:!mt-1.5 last:border-t last:pt-1.5',
                        active ? 'text-[#1F1B16]' : 'text-[#3B342D]'
                      )}
                    >
                      <Link
                        href={href}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200 hover:bg-[#F6F1EA] hover:text-[#1F1B16]"
                      >
                        <span className="text-[#7A6E62] group-hover:text-[#C2185B]">
                          {getIcon({
                            iconList: sidebarIcons,
                            iconName: icon,
                            className: 'w-[18px] h-[18px]',
                          })}
                        </span>
                        {t(labelTransKey)}
                      </Link>
                    </li>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
