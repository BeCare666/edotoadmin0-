import { SearchIcon } from '@/components/icons/search-icon';
import { TermsIcon } from '@/components/icons/sidebar';
import { searchModalInitialValues } from '@/utils/constants';
import Link from '@/components/ui/link';
import Scrollbar from '@/components/ui/scrollbar';
import { useMeQuery } from '@/data/user';
import { siteSettings } from '@/settings/site.settings';
import {
  adminOnly,
  getAuthCredentials,
  hasAccess,
  ownerOnly,
} from '@/utils/auth-utils';
import { STAFF } from '@/utils/constants';
import {
  ChildMenu,
  extractHrefObjects,
  formatOwnerLinks,
  getUrlLinks,
} from '@/utils/searched-url';
import cn from 'classnames';
import { useAtom } from 'jotai';
import { isEmpty } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

type IProps = {};

const SearchBar: React.FC<IProps> = ({ }: IProps) => {
  const { t } = useTranslation();
  const initialItem: ChildMenu[] = [];
  const [searchText, setSearchText] = useState('');
  const [searchItem, setSearchItem] = useState(initialItem);
  const [searchModal] = useAtom(searchModalInitialValues);
  let {
    query: { shop },
    locale,
  } = useRouter();
  const { permissions: currentUserPermissions } = getAuthCredentials();
  const { data: me } = useMeQuery();

  const getAuthorizedURL = (links: any[]): any[] => {
    return [...links].filter((link) =>
      hasAccess(link?.permissions!, currentUserPermissions)
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text || text.length < 1) {
      setSearchItem([]);
      return;
    }

    const {
      sidebarLinks: { admin, shop: shopSideLink, ownerDashboard },
    } = siteSettings;

    const adminLinks = extractHrefObjects(Object.values(admin));
    const shopLinks = extractHrefObjects(Object.values(shopSideLink));
    const ownerDashboardLinks = extractHrefObjects(
      Object.values(ownerDashboard)
    );
    let searchAbleLinks = [];
    let flattenShop = [];

    if (hasAccess([STAFF], currentUserPermissions)) {
      shop = me?.managed_shop?.slug!;
    }

    switch (true) {
      case !isEmpty(shop): // This execute when user under a shop route
        text = `${shop}/${text}`;
        flattenShop = formatOwnerLinks(shopLinks, shop as string);
        searchAbleLinks = getAuthorizedURL(flattenShop);
        break;

      case isEmpty(shop) && hasAccess(adminOnly, currentUserPermissions): // This execute when user is and admin but not under a shop route
        searchAbleLinks = adminLinks;
        break;

      case isEmpty(shop) && hasAccess(ownerOnly, currentUserPermissions): // This execute when user is and vendor but not under a shop route
        flattenShop = [...ownerDashboardLinks];
        me?.shops.map((s) =>
          flattenShop.push(...formatOwnerLinks(shopLinks, s.slug as string))
        );
        searchAbleLinks = getAuthorizedURL(flattenShop);
        break;

      default:
        searchAbleLinks = getAuthorizedURL(adminLinks);
        break;
    }

    const allLinks = getUrlLinks(searchAbleLinks, text);
    setSearchItem([...allLinks]);
  };

  useEffect(() => {
    if (searchText === '') {
      setSearchItem(initialItem);
    } else {
      handleSearch(searchText);
    }
  }, [searchText]);

  return (
    <Fragment>
      <div
        className={cn('fixed inset-0', searchText === '' && 'hidden')}
        onClick={() => setSearchText('')}
      />
      <div className="relative w-full">
        <SearchIcon className="pointer-events-none absolute inset-y-0 my-auto h-[17px] w-[17px] text-[#9A8E80] ltr:left-4 rtl:right-4" />
        <input
          type="text"
          className="w-full rounded-2xl border border-transparent bg-[#F6F1EA] py-3 text-sm text-[#1F1B16] placeholder:text-[#9A8E80] transition focus:border-[#E4DBCE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6EA9]/25 ltr:pl-11 ltr:pr-20 rtl:pr-11 rtl:pl-20"
          placeholder={t('text-top-bar-search-placeholder')}
          aria-label={t('text-top-bar-search-placeholder')}
          value={searchText}
          onChange={(e) => handleSearch(e?.target?.value)}
        />
        {!isEmpty(searchItem) && (
          <button
            className="absolute top-1/2 h-auto w-auto -translate-y-1/2 px-0 text-xs font-medium text-[#9A8E80] hover:text-[#C2185B] ltr:right-4 rtl:left-4"
            onClick={(e) => {
              e.preventDefault();
              setSearchText('');
            }}
          >
            {t('text-clear')}
          </button>
        )}
      </div>

      {!isEmpty(searchItem) ? (
        <div className="sidebar-scrollbar absolute top-full z-30 mt-2 h-[418px] max-h-[418px] w-full overflow-hidden rounded-2xl border border-[#EDE6DC] bg-[#FFFDF9] py-3 shadow-2xl">
          <Scrollbar
            className="max-h-full w-full"
            options={{
              scrollbars: {
                autoHide: 'never',
              },
            }}
          >
            <div className="flex flex-col">
              <h4 className="edoto-serif px-5 pb-2 text-base text-[#1F1B16]">
                {t('text-quick-page-links')}
              </h4>
              <div className="mx-3">
                {searchItem?.map((item) => {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setSearchItem([]);
                        setSearchText('');
                      }}
                      className="group flex items-center rounded-xl px-3 py-2.5 text-sm text-[#3B342D] transition duration-200 ease-in-out hover:bg-[#F6F1EA] hover:text-[#1F1B16]"
                    >
                      <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#F3EEE7] p-2 text-[#7A6E62] group-hover:text-[#C2185B]">
                        <TermsIcon className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col ltr:pl-3 rtl:pr-3">
                        <span className="whitespace-nowrap font-medium capitalize">
                          {isEmpty(shop) ? t(item.customLabel) : t(item.label)}
                        </span>
                        <span className="text-xs text-[#9A8E80]">{item?.href}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Scrollbar>
        </div>
      ) : null}
    </Fragment>
  );
};

export default SearchBar;
