import { useRouter } from 'next/router';
import { SAFlag } from '@/components/icons/flags/SAFlag';
import { CNFlag } from '@/components/icons/flags/CNFlag';
import { USFlag } from '@/components/icons/flags/USFlag';
import { DEFlag } from '@/components/icons/flags/DEFlag';
import { ILFlag } from '@/components/icons/flags/ILFlag';
import { ESFlag } from '@/components/icons/flags/ESFlag';
import { FRFlag } from '@/components/icons/flags/FRFlag'; // 🇫🇷 Ajout ici

const localeRTLList = ['fr', 'en'];

export function useIsRTL() {
  const { locale } = useRouter();
  if (locale && localeRTLList.includes(locale)) {
    return { isRTL: true, alignLeft: 'right', alignRight: 'left' };
  }
  return { isRTL: false, alignLeft: 'left', alignRight: 'right' };
}

export let languageMenu = [

  {
    id: 'fr',
    name: 'Français',
    value: 'fr',
    icon: <FRFlag width="28px" height="28px" />, // 🇫🇷 Ajout du drapeau français
  },
  {
    id: 'en',
    name: 'English',
    value: 'en',
    icon: <USFlag width="28px" height="28px" />,
  },

];


{/** 
  
    {
    id: 'ar',
    name: 'عربى',
    value: 'ar',
    icon: <SAFlag width="28px" height="28px" />,
  },
  {
    id: 'zh',
    name: '中国人',
    value: 'zh',
    icon: <CNFlag width="28px" height="28px" />,
  },
  {
    id: 'en',
    name: 'English',
    value: 'en',
    icon: <USFlag width="28px" height="28px" />,
  },
  {
    id: 'de',
    name: 'Deutsch',
    value: 'de',
    icon: <DEFlag width="28px" height="28px" />,
  },
  {
    id: 'he',
    name: 'עברית',
    value: 'he',
    icon: <ILFlag width="28px" height="28px" />,
  },
  {
    id: 'es',
    name: 'Español',
    value: 'es',
    icon: <ESFlag width="28px" height="28px" />,
  },**/ }