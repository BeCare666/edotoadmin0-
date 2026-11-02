import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import cn from 'classnames';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import Link from '@/components/ui/link';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall } from '@/components/campaign/campaign-api';
import { Routes } from '@/config/routes';
import { SITE_FONTS } from '@/utils/site-font';
import SiteInfoForm from '@/components/settings-hub/site-info-form';
import AdvancedSettings from '@/components/settings-hub/advanced-settings';

// Paramètres du super admin (02/11/2026, rapports/PROPOSITION_PARAMETRES_SUPER_ADMIN.md) :
// - Simples : les réglages qui existaient déjà, regroupés ici sans changer leur fonctionnement
//   (police, informations du site, tarif de livraison, commissions par défaut) ;
// - Avancés : règles métier auparavant codées en dur ou posées sur Render (migration 027).
// La sécurité (double authentification, sessions, maintenance, purge) reste sur Render.
type Tab = 'simples' | 'avances';

const fcfa = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

function Summary({ title, value, detail, href }: { title: string; value: string; detail?: string; href: string }) {
  return (
    <Card className="flex flex-col">
      <p className="text-xs font-medium uppercase tracking-wider text-body">{title}</p>
      <p className="mt-2 text-lg font-semibold text-heading">{value}</p>
      {detail && <p className="mt-1 text-xs text-body">{detail}</p>}
      <Link href={href} className="mt-4 text-sm font-medium text-accent hover:underline">
        Modifier
      </Link>
    </Card>
  );
}

function SimpleSettings() {
  const [font, setFont] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<number | null>(null);
  const [commission, setCommission] = useState<{ order_rate_percent: number; kit_amount: number } | null>(null);

  useEffect(() => {
    apiCall('site-appearance').then((d: any) => setFont(d?.font ?? 'poppins')).catch(() => setFont(null));
    apiCall('admin/delivery/settings').then((d: any) => setDelivery(d?.price_per_km != null ? Number(d.price_per_km) : null)).catch(() => null);
    apiCall('admin/commissions').then((d: any) => setCommission(d?.settings ?? null)).catch(() => null);
  }, []);

  const fontLabel = SITE_FONTS.find((f) => f.key === font)?.label ?? (font || '…');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Summary title="Police du site" value={fontLabel} detail="Site et admin." href={Routes.siteFont} />
        <Summary
          title="Livraison personnalisée"
          value={delivery != null ? `${fcfa(delivery)} / km` : '…'}
          detail="Prix au kilomètre et centre de traitement."
          href={Routes.customDeliveries ?? '/custom-deliveries'}
        />
        <Summary
          title="Commissions par défaut"
          value={commission ? `${commission.order_rate_percent} % · ${fcfa(commission.kit_amount)} / kit` : '…'}
          detail="Points de retrait : commandes et kits."
          href={Routes.commissions ?? '/commissions'}
        />
      </div>
      <SiteInfoForm />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const tab: Tab = router.query.tab === 'avances' ? 'avances' : 'simples';
  const go = (t: Tab) => router.replace({ pathname: router.pathname, query: t === 'simples' ? {} : { tab: t } }, undefined, { shallow: true });

  return (
    <>
      <Card className="mb-6">
        <PageHeading title="Paramètres" />
        <p className="mt-1 text-sm text-body">Réglages de la plateforme, réservés au super admin.</p>
        <div className="mt-4 inline-flex rounded-2xl bg-[#F3F1EE] p-1 text-sm" role="tablist">
          {(
            [
              ['simples', 'Simples'],
              ['avances', 'Avancés'],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => go(k)}
              className={cn('rounded-xl px-4 py-2 font-medium transition', tab === k ? 'bg-white text-heading shadow-sm' : 'text-body hover:text-heading')}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>
      {tab === 'simples' ? <SimpleSettings /> : <AdvancedSettings />}
    </>
  );
}

SettingsPage.authenticate = { permissions: adminOnly };
SettingsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
