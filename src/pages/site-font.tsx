import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall } from '@/components/campaign/campaign-api';
import { SITE_FONTS, adjustFor, applySiteFont } from '@/utils/site-font';

// Police du site et de l'admin (07/10/2026) : le super admin choisit parmi 12 polices ;
// le choix s'applique à tous les textes du site E.doto family et de l'admin.
// Aperçu : chaque carte redéfinit --edoto-font, donc ses textes s'affichent dans sa police.
// Textes d'aperçu : textes réels du site.
const SAMPLE_TITLE = 'Des kits d’hygiène offerts, près de chez vous.';
const SAMPLE_TEXT = 'Commandez vos produits en toute discrétion et retirez-les dans des points de proximité fiables : Mobile Money, boutiques, coiffeurs.';

export default function SiteFontPage() {
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    apiCall('site-appearance').then((d) => setCurrent(d.font)).catch(() => setCurrent('poppins'));
    // Chargement des 12 polices pour l'aperçu (uniquement sur cette page)
    const added: HTMLLinkElement[] = [];
    SITE_FONTS.forEach((f) => {
      if (!f.href) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = f.href;
      l.dataset.edotoPreview = f.key;
      document.head.appendChild(l);
      added.push(l);
    });
    return () => added.forEach((l) => l.remove());
  }, []);

  const apply = async (key: string) => {
    setSaving(key);
    try {
      const d = await apiCall('admin/site-appearance', { method: 'PUT', body: JSON.stringify({ font: key }) });
      setCurrent(d.font);
      applySiteFont(d.font);
      toast.success('Police appliquée au site et à l’admin.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Apparence</p>
        <h1 className="mt-1 text-3xl font-semibold text-heading">Police du site</h1>
        <p className="mt-1 max-w-2xl text-sm text-body">
          Une seule police pour tous les textes du site E.doto family et de l’admin. Toutes les polices sont affichées à la même taille visuelle pour rester lisibles.
          Le changement est visible chez les visiteurs à leur prochain chargement de page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SITE_FONTS.map((f) => {
          const active = current === f.key;
          return (
            <div
              key={f.key}
              style={{ ['--edoto-font' as any]: f.stack, ['--edoto-font-adjust' as any]: adjustFor(f.key) }}
              className={`flex flex-col rounded-2xl border bg-white p-6 transition ${active ? 'border-heading shadow-md' : 'border-border-200 hover:border-gray-400'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-heading">{f.label}</p>
                  <p className="text-xs text-body">{f.style}</p>
                </div>
                {active && <span className="shrink-0 rounded-full bg-heading px-3 py-1 text-[11px] font-semibold text-white">Police actuelle</span>}
              </div>
              <p className="mt-5 text-2xl font-semibold leading-tight text-heading">{SAMPLE_TITLE}</p>
              <p className="mt-3 text-sm leading-relaxed text-body">{SAMPLE_TEXT}</p>
              <p className="mt-3 text-sm text-heading">12 000+ · 2 500 FCFA · Abomey-Calavi</p>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  disabled={active || saving !== null || current === null}
                  onClick={() => apply(f.key)}
                  className="w-full rounded-full bg-heading px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving === f.key ? 'Application…' : active ? 'Appliquée' : 'Appliquer à tout le site'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

SiteFontPage.authenticate = {
  permissions: adminOnly,
};
SiteFontPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
