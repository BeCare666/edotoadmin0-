import Image from 'next/image';
// import { useTranslation } from 'next-i18next';
import Link from '@/components/ui/link';
// import Badge from '@/components/ui/badge/badge';
import { Shop, UserAddress } from '@/types';
import classNames from 'classnames';
import { formatAddress } from '@/utils/format-address';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import { MapPinIcon } from '@/components/icons/map-pin';
import { isNumber } from 'lodash';
import ShopAvatar from '@/components/shop/shop-avatar';
import { PhoneOutlineIcon } from '@/components/icons/phone';
// import { useShopQuery } from '@/data/shop';
import { useTranslation } from 'next-i18next';

type ShopCardProps = {
  shop: Shop;
};

export const ListItem = ({ title, info }: { title: string; info: number }) => {
  return (
    <>
      {isNumber(info) ? (
        <p className="text-sm font-semibold text-muted-black">{Number(info)}</p>
      ) : (
        ''
      )}
      {title ? <p className="text-xs text-[#666]">{title}</p> : ''}
    </>
  );
};

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const { t } = useTranslation();

  // const isNew = false;

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: shop?.contact as string,
  });
  console.log("balance", shop?.balance);
  return (
    <Link
      href={`/${shop?.slug}`}
      className="overflow-hidden rounded-lg bg-white"
    >
      <div
        className={classNames(
          'relative flex h-22 justify-end overflow-hidden'
          // shop?.cover_image?.original ? '' : 'flex justify-end'
        )}
      >
 
      </div>
      <div className="relative z-10 -mt-[4.25rem] ml-6 flex flex-wrap items-center gap-3">
        <ShopAvatar
          is_active={shop?.is_active}
          name={shop?.name}
          logo_image_url={shop?.logo_image_url}
        />
        <div className="relative max-w-[calc(100%-104px)] flex-auto pr-4 pt-2">
          {shop?.name ? (
            <h3 className="text-base font-medium leading-none text-muted-black">
              {shop?.name}
            </h3>
          ) : (
            ''
          )}

          <div className="mt-2 flex w-11/12 items-center gap-1 text-xs leading-none">
            <MapPinIcon className="shrink-0 text-[#666666]" />
            <p className="truncate text-base-dark">
              {shop?.country
                ? shop?.country
                : '???'}
              { /** {formatAddress(shop?.country as UserAddress)
                ? formatAddress(shop?.country as UserAddress)
                : '???'}**/}
            </p>
          </div>

          <div className="mt-2 flex w-11/12 items-center gap-1 text-xs leading-none">
            <PhoneOutlineIcon className="shrink-0 text-[#666666]" />
            <p className="truncate text-xs text-base-dark">
              {phoneNumber ?? '???'}
            </p>
          </div>
        </div>
      </div>

      <ul className="hidden mt-4 grid grid-cols-4 divide-x divide-[#E7E7E7] px-2 pb-7 text-center">
        <li>
          <ListItem
            title={t('text-title-commission')}
            info={shop?.balance?.admin_commission_rate ?? (0 as number)}
          />
        </li>
        <li>
          <ListItem
            title={t('text-title-sale')}
            info={shop?.balance?.total_earnings as number ?? (0 as number)}
          />
        </li>
        <li>
          <ListItem
            title={t('text-title-balance')}
            info={shop?.balance?.current_balance as number ?? (0 as number)}
          />
        </li>
        <li>
          <ListItem
            title={t('text-title-withdraw')}
            info={shop?.balance?.withdrawn_amount as number ?? (0 as number)}
          />
        </li>
      </ul>
    </Link>
  );
};

export default ShopCard;
