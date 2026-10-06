import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import { useSettings } from '@/contexts/settings.context';
import { useTranslation } from 'next-i18next';

export type IFooterProp = {
  className?: string;
};

const socialIcons = [
  {
    name: 'Facebook',
    href: '#',
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.5l.5-4H14V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '#',
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.5" cy="6.5" r="1.2" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: '#',
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M15 3c.3 2.5 1.8 4 4 4v3c-2.4.1-4.1-1.1-5-2a5 5 0 1 1-4 8V13a2 2 0 1 0 2 2V3z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: '#',
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M22 12s0-4-1-5c-1-1.2-2-.8-7-.8s-6-.4-7 .8C6 8 6 12 6 12s0 4 1 5c1 1.2 2 .8 7 .8s6 .4 7-.8c1-1 1-5 1-5z" />
        <polygon points="10 9 16 12 10 15" />
      </svg>
    ),
  },
];

const Footer: React.FC<IFooterProp> = ({ className }) => {
  const { t } = useTranslation();
  const {
    siteTitle,
    siteLink,
    copyrightText,
    externalText,
    externalLink,
  } = useSettings();
  const date = new Date();

  return (
    <footer
      className={`mt-auto border-t border-[#EDE6DC] bg-[#FAF7F2]/90 ${className ?? ''}`}
    >
      <div className="flex min-h-[3.5rem] flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-[#9A8E80] sm:flex-row sm:px-8">
        <span className="truncate text-center sm:text-left">
          © {date.getFullYear()}{' '}
          <Link
            className="text-[#3B342D] transition-colors hover:text-[#C2185B]"
            href={siteLink ?? Routes.dashboard}
          >
            {siteTitle || 'E.doto family'}
          </Link>
          {copyrightText ? `. ${copyrightText}` : ''}{' '}
          {externalText && (
            <Link
              className="text-[#3B342D] transition-colors hover:text-[#C2185B]"
              href={externalLink ?? Routes.dashboard}
            >
              {externalText}
            </Link>
          )}
        </span>

        <div className="flex items-center gap-4">
          {socialIcons.map((icon) => (
            <Link
              key={icon.name}
              href={icon.href}
              className="text-[#9A8E80] transition-colors hover:text-[#C2185B] [&>svg]:h-4 [&>svg]:w-4"
              aria-label={icon.name}
            >
              {icon.svg}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
