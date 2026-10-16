import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import cn from 'classnames';
import { apiCall } from '@/components/campaign/campaign-api';
import {
  BellNavIcon,
  BoxAlertIcon,
  CalendarPlusIcon,
  CalendarScheduleIcon,
  CheckCircleNavIcon,
  DownloadIcon,
  MapPinIcon,
  OrdersIcon,
  TruckIcon,
  UsersIcon,
} from '@/components/icons/edoto-nav-icons';

// Cloche de l'admin : notifications calculées par l'API à partir des données réelles
// (GET admin/notifications). « Vu » est mémorisé dans ce navigateur uniquement.
type Item = {
  key: string;
  type: string;
  title: string;
  body: string;
  href: string;
  at: string | null;
  action: boolean;
};

const SEEN_KEY = 'edoto_admin_notifications_seen';
const REFRESH_MS = 60_000;

const TYPE_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  order: { icon: OrdersIcon, tone: 'bg-[#ECE9E4] text-[#3D3934]' },
  paid_order: { icon: CheckCircleNavIcon, tone: 'bg-[#E8EFE6] text-[#3F6B45]' },
  delivery: { icon: TruckIcon, tone: 'bg-[#FBEEF3] text-[#C2185B]' },
  pickup_point: { icon: MapPinIcon, tone: 'bg-[#F7F1E6] text-[#8A6A3B]' },
  sponsor_export: { icon: DownloadIcon, tone: 'bg-[#F7F1E6] text-[#8A6A3B]' },
  sponsor_proposal: { icon: CalendarPlusIcon, tone: 'bg-[#FBEEF3] text-[#C2185B]' },
  stock: { icon: BoxAlertIcon, tone: 'bg-[#FDECEC] text-[#B42318]' },
  registrations: { icon: UsersIcon, tone: 'bg-[#E8EFE6] text-[#3F6B45]' },
  campaign: { icon: CalendarScheduleIcon, tone: 'bg-[#FBEEF3] text-[#C2185B]' },
};

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function writeSeen(keys: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(keys).slice(-400)));
  } catch {
    /* stockage indisponible : la cloche fonctionne sans mémoire */
  }
}

function ago(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EdotoNotificationBell() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'action'>('all');
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [freshKeys, setFreshKeys] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiCall('admin/notifications')
      .then((r) => {
        setItems(r?.items ?? []);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    setSeen(readSeen());
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Fermeture au clic extérieur et avec Échap
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = useMemo(() => (items ?? []).filter((i) => !seen.has(i.key)), [items, seen]);
  const actionCount = (items ?? []).filter((i) => i.action).length;
  const shown = (items ?? []).filter((i) => tab === 'all' || i.action);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items) {
      // Les non-lues gardent leur point « nouveau » pendant cette ouverture, puis sont marquées vues
      setFreshKeys(new Set(unread.map((i) => i.key)));
      const all = new Set(seen);
      items.forEach((i) => all.add(i.key));
      setSeen(all);
      writeSeen(all);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread.length ? `Notifications : ${unread.length} non lue${unread.length > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open}
        className={cn(
          'relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#3D3934] transition',
          open ? 'bg-[#1A1814] text-white' : 'bg-[#F3F1EE] hover:bg-[#ECE9E4]',
        )}
      >
        <BellNavIcon className="h-[19px] w-[19px]" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C2185B] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[72px] z-50 overflow-hidden rounded-2xl border border-[#E9E5DF] bg-white shadow-elevated sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[400px]">
          <div className="border-b border-[#F1EFEB] bg-gradient-to-b from-[#FBFAF8] to-white px-5 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="edoto-serif text-lg text-[#1A1814]">Notifications</p>
              <button type="button" onClick={load} className="text-xs font-medium text-[#8A837A] transition hover:text-[#C2185B]">
                Actualiser
              </button>
            </div>
            <div className="mt-3 flex gap-1 rounded-2xl bg-[#F3F1EE] p-1 text-[13px]">
              {([['all', 'Tout', items?.length ?? 0], ['action', 'À traiter', actionCount]] as const).map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition', tab === k ? 'bg-white text-[#1A1814] shadow-sm' : 'text-[#6B655D]')}
                >
                  {label}
                  <span className="text-[11px] tabular-nums text-[#8A837A]">{n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[min(70vh,460px)] overflow-y-auto overscroll-contain">
            {error && !items ? (
              <p className="px-6 py-10 text-center text-sm text-[#6B655D]">Notifications indisponibles pour le moment.</p>
            ) : !items ? (
              <p className="px-6 py-10 text-center text-sm text-[#6B655D]">Chargement…</p>
            ) : shown.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EFE6] text-[#3F6B45]">
                  <CheckCircleNavIcon className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-medium text-[#1A1814]">{tab === 'action' ? 'Rien à traiter' : 'Aucune notification'}</p>
                <p className="mt-1 text-xs text-[#8A837A]">Tout est à jour.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F1EE]">
                {shown.map((i) => {
                  const style = TYPE_STYLE[i.type] ?? TYPE_STYLE.order;
                  const Icon = style.icon;
                  return (
                    <li key={i.key}>
                      <Link
                        href={i.href}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-5 py-3.5 transition hover:bg-[#FBFAF8]"
                      >
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', style.tone)}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#1A1814]">{i.title}</span>
                            {freshKeys.has(i.key) && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C2185B]" aria-label="Nouveau" />}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#6B655D]">{i.body}</span>
                          <span className="mt-1 flex items-center gap-2 text-[11px] text-[#8A837A]">
                            {ago(i.at)}
                            {i.action && <span className="rounded-full bg-[#FBEEF3] px-2 py-px font-medium text-[#C2185B]">À traiter</span>}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
