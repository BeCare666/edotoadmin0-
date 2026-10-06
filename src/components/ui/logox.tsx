import Link from '@/components/ui/link';
import cn from 'classnames';
import Image from 'next/image';
import { siteSettings } from '@/settings/site.settings';
import emblem from '../../../public/logo/edoto-emblem.png';

// Logo E.doto (le même que sur le site : emblème + « E.doto family ») pour les fonds clairs
const Logo: React.FC<React.AnchorHTMLAttributes<{}>> = ({ className }) => {
  return (
    <Link
      href={siteSettings?.logo?.href ?? '/'}
      className={cn('inline-flex items-center justify-center gap-3', className)}
    >
      <span className="relative h-12 w-12 shrink-0">
        <Image src={emblem} alt="E.doto family" fill sizes="48px" className="object-contain" priority />
      </span>
      <span className="edoto-serif text-2xl tracking-tight text-[#1F1B16]">
        E.doto <span className="text-[#C2185B]">family</span>
      </span>
    </Link>
  );
};

export default Logo;
