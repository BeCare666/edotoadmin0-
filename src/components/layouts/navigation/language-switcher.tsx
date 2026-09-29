import { useState, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { LangSwitcherIcon } from '@/components/icons/lang-switcher-icon';
import { languageMenu } from '@/utils/locals';
import { useCart } from '@/contexts/quick-cart/cart.context';
import Cookies from 'js-cookie';
import { WorldIcon } from '@/components/icons/worldIcon';

export default function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { asPath, locale, locales } = router;
  const { resetCart } = useCart();

  const filterItem = languageMenu?.filter((element) =>
    locales?.includes(element?.id)
  );

  const currentSelectedItem =
    filterItem?.find((o) => o?.value === locale) ?? filterItem?.[0] ?? null;

  const [selectedItem, setSelectedItem] = useState(currentSelectedItem);

  function handleItemClick(values: any) {
    Cookies.set('NEXT_LOCALE', values?.value, { expires: 365 });
    setSelectedItem(values);
    resetCart();
    router.push(asPath, undefined, { locale: values?.value });
  }

  return (
    <Listbox value={selectedItem} onChange={handleItemClick}>
      {({ open }) => (
        <div className="relative z-10">
          <Listbox.Button
            className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-[#F6F1EA] px-3 text-sm text-[#3B342D] transition hover:bg-[#EFE7DC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6EA9]/40"
            aria-label={t('common:text-language')}
          >
            <WorldIcon className="h-[18px] w-[18px]" />
            <span className="hidden truncate xl:block">
              {selectedItem ? t(selectedItem.name) : t('common:text-language')}
            </span>
            <LangSwitcherIcon className="hidden h-3.5 w-3.5 text-[#9A8E80] xl:block" aria-hidden="true" />
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              static
              className="absolute right-0 mt-2 max-h-60 w-56 overflow-auto rounded-2xl border border-[#EDE6DC] bg-[#FFFDF9] px-2 py-1 text-sm shadow-2xl"
            >
              {filterItem?.map((option, index) => (
                <Listbox.Option
                  key={index}
                  className={({ active }) =>
                    `${active ? 'bg-[#F6F1EA] text-[#1F1B16]' : 'text-[#3B342D]'} relative cursor-pointer select-none rounded-xl px-3 py-2.5`
                  }
                  value={option}
                >
                  {({ selected, active }) => (
                    <span className="flex items-center [&>svg]:w-6">
                      {option.icon}
                      <span
                        className={`${selected ? 'font-medium' : 'font-normal'
                          } block truncate ltr:ml-2.5 rtl:mr-2.5`}
                      >
                        {t(option.name)}
                      </span>
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}

