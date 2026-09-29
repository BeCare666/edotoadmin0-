import Link from '@/components/ui/link';
import cn from 'classnames';
import Image from 'next/image';
import { siteSettings } from '@/settings/site.settings';
import emblem from '../../../public/logo/edoto-emblem.png';

// Logo E·Doto (le même que sur le site : emblème + « E·Doto Family ») pour les fonds clairs
const Logo: React.FC<React.AnchorHTMLAttributes<{}>> = ({ className }) => {
  return (
    <Link
      href={siteSettings?.logo?.href ?? '/'}
      className={cn('inline-flex items-center justify-center gap-3', className)}
    >
      <span className="relative h-12 w-12 shrink-0">
        <Image src={emblem} alt="E·Doto Family" fill sizes="48px" className="object-contain" priority />
      </span>
      <span className="edoto-serif text-2xl tracking-tight text-[#1F1B16]">
        E·Doto <span className="text-[#C2185B]">Family</span>
      </span>
    </Link>
  );
};

export default Logo;
