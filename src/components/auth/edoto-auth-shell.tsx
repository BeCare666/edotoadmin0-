import Image from 'next/image';
import emblem from '../../../public/logo/edoto-emblem.png';

// Logo de la vitrine, à l'identique (edoto/components/BrandMark.jsx) : emblème + « E.doto » à dégradé
// rose + « family » en petites lettres espacées. Même fichier d'emblème que le site (vérifié identique).
export function BrandMark({ size = 'md', className = '' }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={`relative shrink-0 ${lg ? 'h-11 w-11' : 'h-9 w-9'}`}>
        <Image src={emblem} alt="" fill sizes="44px" className="object-contain" priority />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`bg-gradient-to-r from-[#FF6EA9] via-[#E0457F] to-[#B0175A] bg-clip-text font-semibold tracking-[-0.01em] text-transparent ${
            lg ? 'text-[28px]' : 'text-[23px]'
          }`}
        >
          E.doto
        </span>
        <span className={`mt-[3px] font-medium text-slate-500 ${lg ? 'text-[11px] tracking-[0.42em]' : 'text-[10px] tracking-[0.38em]'}`}>
          family
        </span>
      </span>
    </span>
  );
}

// Cadre des pages de connexion et d'inscription de l'admin, identique à celui du site
// (edoto/components/auth/AuthShell.jsx) : logo de la vitrine, carte papier à filet fin.
export default function EdotoAuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#F9F8F6] px-4 py-10 sm:py-16">
      <a href="/" aria-label="E.doto family" className="mb-8">
        <BrandMark size="lg" />
      </a>
      <section className="w-full max-w-md rounded-2xl border border-[#E9E5DF] bg-white px-6 py-8 sm:px-9 sm:py-10">
        {title && <h1 className="text-center text-[22px] font-semibold tracking-tight text-[#1A1814] sm:text-2xl">{title}</h1>}
        {subtitle && <p className="mt-2 text-center text-sm text-[#6B655D]">{subtitle}</p>}
        <div className={title || subtitle ? 'mt-7' : ''}>{children}</div>
      </section>
      {footer && <div className="mt-6 w-full max-w-md space-y-2 text-center text-sm text-[#6B655D]">{footer}</div>}
    </main>
  );
}

// Mêmes champs que le site : libellé, hauteur, coins, filet, focus rose
export const authLabelClass = '!mb-2 !text-sm !font-medium !text-[#3D3934]';
export const authInputClass =
  '!h-12 !rounded-xl !border-[#E6E2DC] !bg-white !text-[15px] !text-[#1A1814] placeholder:!text-[#A8A29A] focus:!border-[#C2185B] focus:!ring-2 focus:!ring-[#C2185B]/15 focus:!shadow-none';
export const authButtonClass =
  '!h-12 !w-full !rounded-xl !bg-[#1A1814] !text-[15px] !font-medium !text-white hover:!bg-[#3D3934] focus:!ring-0 disabled:!bg-[#D6D2CB] disabled:!text-[#8A837A]';
export const authLinkClass = 'font-medium text-[#C2185B] underline-offset-4 hover:underline';
