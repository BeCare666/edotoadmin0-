import Link from '@/components/ui/link';
import cn from 'classnames';
import { siteSettings } from '@/settings/site.settings';
import { useSettings } from '@/contexts/settings.context';
import { LogoSVG } from '@/components/icons/logo';
import LogoText from '@/components/icons/logo-text';
import { useAtom } from 'jotai';
import { miniSidebarInitialValue } from '@/utils/constants';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSettingsQuery } from '@/data/settings';

const Logo: React.FC<React.AnchorHTMLAttributes<{}>> = ({
  className,
  ...props
}) => {
  const { locale } = useRouter();
  const { settings } = useSettingsQuery({ language: locale! });
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const { width } = useWindowSize();
  const logoUrl = '@/assets/logo/logo.png';
  console.log("settings", settings);
  console.log("siteSettings", siteSettings);
  return (
    <Link
      href={siteSettings?.logo?.href ?? '/'}
      className={cn('inline-flex items-center justify-center gap-3', className)}
    >
      {miniSidebar && width >= RESPONSIVE_WIDTH ? (
        <span className="relative block h-full min-h-[32px] w-12 flex-shrink-0">
          <Image
            src={settings?.options?.logo.original}
            alt={settings?.options?.siteTitle ?? siteSettings.collapseLogo.alt}
            fill
            sizes="96px"
            className="object-contain object-center"
            loading="eager"
          />
          <strong>Edoto Family</strong>
        </span>
      ) : (
        <>
        <span className="relative block h-full min-h-[40px] w-full max-w-[220px] flex-shrink-0 overflow-hidden mb-3">
          <Image
            src={settings?.options?.logo.original}
            alt={settings?.options?.siteTitle ?? siteSettings.logo.alt}
            fill
            sizes="(max-width: 1024px) 96px, 289px"
            className="object-contain object-center"
            loading="eager"
          />
          
        </span> 
        </>
      )}
    </Link>
  );
};

export default Logo;
