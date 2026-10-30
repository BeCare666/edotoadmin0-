import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall } from '@/components/campaign/campaign-api';

// Informations du site (B5, 30/10/2026) : API GET /site-info, PUT /admin/site-info.
// Ce qui est enregistré ici s'affiche sur le site : pied de page, menu mobile, page Contact.
// Remplace les pages de paramètres du modèle d'origine, qui écrivaient dans une ligne que le site ne lisait pas.
type Info = Record<'phone' | 'email' | 'address' | 'map_url' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'x_url' | 'youtube', string>;

const EMPTY: Info = { phone: '', email: '', address: '', map_url: '', instagram: '', facebook: '', tiktok: '', linkedin: '', x_url: '', youtube: '' };

const SOCIALS: { key: keyof Info; label: string; example: string }[] = [
  { key: 'instagram', label: 'Instagram', example: 'https://www.instagram.com/edotofamily' },
  { key: 'facebook', label: 'Facebook', example: 'https://www.facebook.com/edotofamily' },
  { key: 'tiktok', label: 'TikTok', example: 'https://www.tiktok.com/@edotofamily' },
  { key: 'linkedin', label: 'LinkedIn', example: 'https://www.linkedin.com/company/edotofamily' },
  { key: 'x_url', label: 'X', example: 'https://x.com/edotofamily' },
  { key: 'youtube', label: 'YouTube', example: 'https://www.youtube.com/@edotofamily' },
];

const input = 'mt-1 w-full rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';

export default function SiteInfoPage() {
  const [form, setForm] = useState<Info | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fill = (data: any) => {
    const next = { ...EMPTY };
    (Object.keys(EMPTY) as (keyof Info)[]).forEach((k) => { next[k] = data?.[k] ?? ''; });
    setForm(next);
    setUpdatedAt(data?.updated_at ?? null);
  };

  useEffect(() => {
    apiCall('site-info').then(fill).catch((e: any) => setError(e.message));
  }, []);

  const set = (k: keyof Info) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      const res = await apiCall('admin/site-info', { method: 'PUT', body: JSON.stringify(form) });
      toast.success(res.message);
      fill(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Informations du site" />
        <p className="mt-1 text-sm text-body">
          Ces informations s&apos;affichent sur le site : pied de page, menu mobile et page Contact. Un réseau social laissé vide
          n&apos;est pas affiché.
        </p>
        {updatedAt && <p className="mt-2 text-xs text-body">Dernière modification : {new Date(updatedAt).toLocaleString('fr-FR')}</p>}
      </Card>

      {error ? (
        <Card><p className="text-sm text-red-600">{error}</p></Card>
      ) : !form ? (
        <Card><p className="text-sm text-body">Chargement…</p></Card>
      ) : (
        <form onSubmit={submit} className="space-y-8">
          <Card>
            <h2 className="text-base font-semibold text-heading">Contact</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm text-body">Téléphone
                <input type="tel" required maxLength={30} className={input} value={form.phone} onChange={set('phone')} placeholder="+229 01 67 69 81 91" />
              </label>
              <label className="text-sm text-body">E-mail
                <input type="email" required maxLength={190} className={input} value={form.email} onChange={set('email')} />
              </label>
              <label className="text-sm text-body">Adresse
                <input type="text" required maxLength={190} className={input} value={form.address} onChange={set('address')} />
              </label>
            </div>
            <label className="mt-4 block text-sm text-body">Carte de la page Contact (facultatif)
              <input type="url" maxLength={600} className={input} value={form.map_url} onChange={set('map_url')} placeholder="https://www.google.com/maps/embed?pb=..." />
              <span className="mt-1 block text-xs text-body">
                Dans Google Maps : Partager, puis Intégrer une carte, et copiez seulement le lien entre les guillemets de src. Vide : la carte actuelle.
              </span>
            </label>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-heading">Réseaux sociaux</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {SOCIALS.map((s) => (
                <label key={s.key} className="text-sm text-body">{s.label}
                  <input type="url" maxLength={300} className={input} value={form[s.key]} onChange={set(s.key)} placeholder={s.example} />
                </label>
              ))}
            </div>
          </Card>

          <div className="text-end">
            <button type="submit" disabled={busy} className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

SiteInfoPage.authenticate = { permissions: adminOnly };
SiteInfoPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
