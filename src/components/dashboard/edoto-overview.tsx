import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';
import {
  CalendarScheduleIcon,
  ChevronNavIcon,
  MapPinIcon,
  TruckIcon,
} from '@/components/icons/edoto-nav-icons';

// Vue d'ensemble E.doto du tableau de bord admin (nouveau visuel, 25/09/2026) :
// uniquement des routes existantes, aucune donnée inventée.
interface Counts {
  deliveries: number | null;
  pendingPoints: number | null;
  activeCampaigns: number | null;
}

const safeTotal = (p: Promise<any>) => p.then((r) => Number(r?.total ?? 0)).catch(() => null);

const CARD =
  'rounded-2xl border border-[#E9E5DF] bg-white';

const TONES: Record<string, string> = {
  rose: 'bg-[#FBEEF3] text-[#C2185B]',
  sage: 'bg-[#E8EFE6] text-[#3F6B45]',
  sand: 'bg-[#F7F1E6] text-[#8A6A3B]',
  ink: 'bg-[#ECE9E4] text-[#3D3934]',
};

function Tile({ label, value, hint, href, tone, icon: Icon }: { label: string; value: number | null; hint: string; href: string; tone: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className={`group block p-5 transition duration-300 hover:border-[#D6D2CB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6EA9]/40 ${CARD}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] text-[#8A837A]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#1A1814] sm:text-[28px]">{value === null ? '…' : value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-[#6B655D] transition group-hover:text-[#C2185B]">
        {hint}
        <ChevronNavIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function EdotoOverview() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Counts>({ deliveries: null, pendingPoints: null, activeCampaigns: null });
  const [recent, setRecent] = useState<any[] | null>(null);

  useEffect(() => {
    Promise.all([
      safeTotal(apiCall('admin/delivery/orders?status=to_assign&limit=1')),
      safeTotal(apiCall('admin/pickup-points?status=pending&limit=1')),
      safeTotal(apiCall('admin/campaigns?status=en_cours&limit=1')),
    ]).then(([deliveries, pendingPoints, activeCampaigns]) => setCounts({ deliveries, pendingPoints, activeCampaigns }));
    apiCall('orders?limit=6&orderBy=created_at&sortedBy=desc')
      .then((r) => setRecent(r?.data ?? []))
      .catch(() => setRecent([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="edoto-serif text-xl tracking-tight text-[#1A1814] sm:text-2xl">À traiter</h2>
        <p className="mt-1 text-sm text-[#6B655D]">Ce qui attend une action de l’équipe E.doto family.</p>
      </div>
      <div className="edoto-stagger grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Livraisons à confier" value={counts.deliveries} hint="Confier à un zem" href="/custom-deliveries" tone="rose" icon={TruckIcon} />
        <Tile label="Points de retrait à valider" value={counts.pendingPoints} hint="Voir les inscriptions" href="/pickup-points" tone="sand" icon={MapPinIcon} />
        <Tile label="Campagnes en cours" value={counts.activeCampaigns} hint="Voir les campagnes" href="/campaigns" tone="sage" icon={CalendarScheduleIcon} />
      </div>

      <div className={`${CARD} mt-2`}>
        <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-5">
          <h2 className="edoto-serif text-lg text-[#1A1814]">Dernières commandes</h2>
          <Link href="/orders" className="flex items-center gap-1 text-sm text-[#C2185B] hover:underline">
            Toutes les commandes <ChevronNavIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent === null ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-[#EFECE7]" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <p className="edoto-serif text-lg text-[#1A1814]">Aucune commande</p>
            <p className="mt-1 text-sm text-[#6B655D]">Les nouvelles commandes apparaîtront ici.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#EFECE7] border-t border-[#EFECE7]">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3.5 transition hover:bg-[#F9F8F6]">
                  <span className="min-w-0 flex-1 sm:flex-none sm:w-56">
                    <span className="block truncate text-sm font-medium text-[#1A1814]">{o.tracking_number}</span>
                    <span className="block truncate text-xs text-[#8A837A]">{o.customer_display?.name || 'Client non renseigné'}</span>
                  </span>
                  <span className="order-last w-full truncate text-xs text-[#6B655D] md:order-none md:w-auto md:flex-1 md:text-sm">
                    {o.delivery_type === 'CUSTOM' ? 'Livraison à domicile' : o.pickup_point_name || 'Point non choisi'}
                  </span>
                  <span className="w-28 text-right text-sm font-medium tabular-nums text-[#1A1814]">{fcfa(o.total)}</span>
                  <span className="w-32 text-right">
                    <span className="inline-flex items-center rounded-full bg-[#ECE9E4] px-2.5 py-1 text-xs font-medium text-[#3D3934]">{t(o.order_status)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
