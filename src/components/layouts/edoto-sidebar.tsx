import Image from 'next/image';
import Link from '@/components/ui/link';
import cn from 'classnames';
import { useAtom } from 'jotai';
import { useMeQuery } from '@/data/user';
import { Routes } from '@/config/routes';
import Scrollbar from '@/components/ui/scrollbar';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH, miniSidebarInitialValue } from '@/utils/constants';
import { getAuthCredentials } from '@/utils/auth-utils';
import {
  CloseNavIcon,
  ExternalNavIcon,
  PanelCloseIcon,
  PanelOpenIcon,
} from '@/components/icons/edoto-nav-icons';
import emblem from '../../../public/logo/edoto-emblem.png';

// Largeurs communes (barre latérale, en-tête, contenu) — même cadre que le dashboard des points de retrait
export const SIDEBAR_WIDE = 'lg:w-72';
export const SIDEBAR_MINI = 'lg:w-[88px]';

export const initials = (n?: string | null) =>
  String(n || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

const roleLabel = (role?: string | null) => {
  if (!role) return 'Administration';
  if (role === 'super_admin') return 'Administration';
  if (role === 'staff') return 'Équipe boutique';
  return 'Espace boutique';
};

export function useCollapsed() {
  const [miniSidebar, setMiniSidebar] = useAtom(miniSidebarInitialValue);
  const { width } = useWindowSize();
  return {
    collapsed: miniSidebar && width >= RESPONSIVE_WIDTH,
    toggle: () => setMiniSidebar(!miniSidebar),
  };
}

// Logo du site E.doto (emblème sur pastille claire + nom)
export function EdotoBrand({ compact = false, subtitle }: { compact?: boolean; subtitle?: string }) {
  return (
    <Link href={Routes.dashboard} className="flex min-w-0 items-center gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9E5DF] bg-white">
        <span className="relative h-7 w-7">
          <Image src={emblem} alt="E.doto family" fill sizes="32px" className="object-contain" priority />
        </span>
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="edoto-serif block truncate text-[17px] font-semibold leading-tight tracking-tight text-[#1A1814]">
            E.doto <span className="text-[#C2185B]">family</span>
          </span>
          {subtitle && (
            <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.22em] text-[#A8A29A]">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

/**
 * Contenu de la barre latérale claire (ordinateur et tiroir mobile) :
 * logo, carte d'identité, menus (children), lien vers le site et bouton « Réduire ».
 */
export function EdotoSidebarPanel({
  children,
  collapsed = false,
  onClose,
}: {
  children: React.ReactNode;
  collapsed?: boolean;
  onClose?: () => void;
}) {
  const { data: me } = useMeQuery();
  const { role } = getAuthCredentials();
  const { toggle } = useCollapsed();
  const c = collapsed;
  const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL;

  return (
    <div className="flex h-full flex-col bg-white text-[#3D3934]">
      <div className={cn('flex h-20 shrink-0 items-center justify-between', c ? 'justify-center px-0' : 'px-6')}>
        <EdotoBrand compact={c} subtitle={roleLabel(role)} />
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8A837A] transition hover:bg-[#F3F1EE] hover:text-[#1A1814]"
            aria-label="Fermer le menu"
          >
            <CloseNavIcon className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'mb-1 mt-1',
          c
            ? 'mx-auto'
            : 'mx-4 flex items-center gap-3 rounded-xl border border-[#EFECE7] bg-[#F9F8F6] px-3 py-2.5',
        )}
      >
        {c ? (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1814] text-[13px] font-semibold text-white"
            title={me?.name}
          >
            {initials(me?.name)}
          </span>
        ) : (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A1814] text-xs font-semibold text-white">
              {initials(me?.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[#1A1814]">{me?.name ?? 'Administrateur'}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-[#8A837A]">{me?.email}</span>
            </span>
          </>
        )}
      </div>

      <div className="edoto-sidebar-scroll min-h-0 flex-1">
        <Scrollbar
          className="h-full w-full"
          options={{ scrollbars: { autoHide: 'leave' }, overflow: { x: 'hidden' } }}
        >
          <div className="pb-4">{children}</div>
        </Scrollbar>
      </div>

      <div className={cn('space-y-0.5 border-t border-[#EFECE7] p-3', c && 'px-3')}>
        {shopUrl && (
          <a
            href={shopUrl}
            target="_blank"
            rel="noreferrer"
            title={c ? 'Voir le site' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#6B655D] transition-colors hover:bg-[#F6F5F2] hover:text-[#1A1814]',
              c && 'justify-center px-0',
            )}
          >
            <ExternalNavIcon className="h-4 w-4 shrink-0" />
            {!c && <span>Voir le site</span>}
          </a>
        )}
        {!onClose && (
          <button
            onClick={toggle}
            aria-label={c ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
            title={c ? 'Déplier' : 'Réduire'}
            className={cn(
              'hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#6B655D] transition-colors hover:bg-[#F6F5F2] hover:text-[#1A1814] lg:flex',
              c && 'justify-center px-0',
            )}
          >
            {c ? (
              <PanelOpenIcon className="h-4 w-4" />
            ) : (
              <>
                <PanelCloseIcon className="h-4 w-4" /> Réduire
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Barre latérale fixe (ordinateur), sur toute la hauteur de l'écran, logo compris
export default function EdotoSidebar({ children }: { children: React.ReactNode }) {
  const { collapsed } = useCollapsed();
  return (
    <aside
      className={cn(
        'edoto-sidebar fixed inset-y-0 z-50 hidden transition-[width] duration-300 ease-out ltr:left-0 rtl:right-0 lg:block',
        collapsed ? SIDEBAR_MINI : SIDEBAR_WIDE,
      )}
      aria-label="Navigation"
    >
      <EdotoSidebarPanel collapsed={collapsed}>{children}</EdotoSidebarPanel>
    </aside>
  );
}

// Décalages du contenu et de l'en-tête selon l'état de la barre latérale
export function useShellOffsets() {
  const { collapsed } = useCollapsed();
  return {
    collapsed,
    padding: collapsed ? 'ltr:lg:pl-[88px] rtl:lg:pr-[88px]' : 'ltr:lg:pl-72 rtl:lg:pr-72',
    left: collapsed ? 'ltr:lg:left-[88px] rtl:lg:right-[88px]' : 'ltr:lg:left-72 rtl:lg:right-72',
  };
}
