import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import EdotoFilterBar, { FilterValues } from '@/components/filters/edoto-filter-bar';
import { BENIN_CITIES, apiCall } from '@/components/campaign/campaign-api';
import { adminOnly } from '@/utils/auth-utils';
import { Field, Modal, PageHead, Pill, inputClass } from '@/components/teleconsultation/tc-ui';

// Centres partenaires (19/10/2026) : ABPF, ABMS, cliniques. Le médecin y oriente un jeune ; le centre ouvre
// le dossier en scannant le code QR, depuis son espace (site : /centre) après invitation.
type Center = {
  id: number; name: string; organization: string; organization_label: string; email: string; phone: string | null; city: string | null;
  address: string | null; services: string | null; opening_hours: string | null; lat: number | null; lng: number | null;
  is_active: boolean; account_status: string; account_label: string; referrals: number; completed: number;
};
const ORGS = [
  { value: 'abpf', label: 'ABPF' },
  { value: 'abms', label: 'ABMS' },
  { value: 'clinic', label: 'Clinique' },
  { value: 'other', label: 'Autre centre' },
];
const EMPTY_FORM = { name: '', organization: 'abpf', email: '', phone: '', city: '', address: '', services: '', opening_hours: '', lat: '', lng: '' };
const ACCOUNT_TONE: Record<string, string> = { not_invited: 'neutral', invited: 'wait', active: 'ok' };

export default function TeleconsultationCenters() {
  const [rows, setRows] = useState<Center[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>({ organization: '', city: '', account: '', state: '' });
  const [form, setForm] = useState<{ id?: number; data: typeof EMPTY_FORM } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await apiCall('admin/teleconsultation/centers'));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const all = rows ?? [];
  const count = (f: (c: Center) => boolean) => all.filter(f).length;
  const cities = Array.from(new Set(all.map((c) => c.city).filter(Boolean))) as string[];
  const visible = useMemo(() => {
    const t = search.trim().toLowerCase();
    return all.filter(
      (c) =>
        (!t || [c.name, c.email, c.city, c.address, c.services].some((x) => String(x ?? '').toLowerCase().includes(t))) &&
        (!values.organization || c.organization === values.organization) &&
        (!values.city || c.city === values.city) &&
        (!values.account || c.account_status === values.account) &&
        (!values.state || (values.state === 'active' ? c.is_active : !c.is_active)),
    );
  }, [all, search, values]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form) return;
    setBusy('save');
    try {
      const res = await apiCall(form.id ? `admin/teleconsultation/centers/${form.id}` : 'admin/teleconsultation/centers', {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form.data),
      });
      toast.success(res.message);
      setForm(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };
  const run = async (key: string, path: string, init: RequestInit) => {
    setBusy(key);
    try {
      const res = await apiCall(path, init);
      toast.success(res.message);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };
  const set = (k: keyof typeof EMPTY_FORM) => (e: any) => setForm((f) => (f ? { ...f, data: { ...f.data, [k]: e.target.value } } : f));
  const toForm = (c: Center) => ({
    name: c.name, organization: c.organization, email: c.email, phone: c.phone ?? '', city: c.city ?? '', address: c.address ?? '',
    services: c.services ?? '', opening_hours: c.opening_hours ?? '', lat: c.lat != null ? String(c.lat) : '', lng: c.lng != null ? String(c.lng) : '',
  });

  return (
    <>
      <PageHead
        eyebrow="Téléconsultation"
        title="Centres partenaires"
        subtitle="Centres vers lesquels les médecins orientent les jeunes. Chaque centre a son espace : il y scanne le code QR du jeune et voit son dossier, sans lui reposer de questions."
        action={<button onClick={() => setForm({ data: { ...EMPTY_FORM } })} className="rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent">+ Ajouter un centre</button>}
      />
      <EdotoFilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Nom, ville, adresse ou service…' }}
        quick={{ key: 'organization', allLabel: 'Tous', allCount: all.length, options: ORGS.map((o) => ({ ...o, count: count((c) => c.organization === o.value) })) }}
        filters={[
          { type: 'select', key: 'city', label: 'Ville', placeholder: 'Toutes les villes', options: cities.map((v) => ({ value: v, label: v, count: count((c) => c.city === v) })) },
          {
            type: 'chips', key: 'account', label: 'Espace', options: [
              { value: 'active', label: 'Espace actif', count: count((c) => c.account_status === 'active') },
              { value: 'invited', label: 'Invité', count: count((c) => c.account_status === 'invited') },
              { value: 'not_invited', label: 'Non invité', count: count((c) => c.account_status === 'not_invited') },
            ],
          },
          { type: 'chips', key: 'state', label: 'État', options: [{ value: 'active', label: 'Actif', count: count((c) => c.is_active) }, { value: 'inactive', label: 'Désactivé', count: count((c) => !c.is_active) }] },
        ]}
        values={values}
        onChange={(p) => setValues((v) => ({ ...v, ...p }))}
        onReset={() => { setValues({ organization: '', city: '', account: '', state: '' }); setSearch(''); }}
        resultLabel={`${visible.length} centre${visible.length > 1 ? 's' : ''}`}
      />
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : !rows ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[#EFECE7]" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-[#E9E5DF] bg-white py-16 text-center text-sm text-body">Aucun centre.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((c) => (
            <div key={c.id} className="rounded-2xl border border-[#E9E5DF] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-accent">{c.organization_label}</p>
                  <p className="font-serif text-xl text-heading">{c.name}</p>
                  <p className="text-sm text-body">{[c.address, c.city].filter(Boolean).join(', ') || 'Adresse non renseignée'}</p>
                  <p className="mt-1 truncate text-xs text-[#8A837A]">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone={ACCOUNT_TONE[c.account_status]}>{c.account_label}</Pill>
                  {!c.is_active && <Pill tone="stop">Désactivé</Pill>}
                </div>
              </div>
              {c.services && <p className="mt-3 text-sm text-body">{c.services}</p>}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#EFECE7] pt-4 text-sm">
                <div><p className="text-xs text-[#8A837A]">Orientés</p><p className="text-heading">{c.referrals}</p></div>
                <div><p className="text-xs text-[#8A837A]">Pris en charge</p><p className="text-heading">{c.completed}</p></div>
                <div><p className="text-xs text-[#8A837A]">Horaires</p><p className="truncate text-heading">{c.opening_hours || 'Non renseignés'}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setForm({ id: c.id, data: toForm(c) })} className="rounded-xl border border-[#E9E5DF] px-3.5 py-2 text-sm text-heading hover:border-heading">Modifier</button>
                {c.account_status !== 'active' && (
                  <button disabled={busy === `inv${c.id}`} onClick={() => run(`inv${c.id}`, `admin/teleconsultation/centers/${c.id}/invite`, { method: 'POST' })} className="rounded-xl bg-heading px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {c.account_status === 'invited' ? 'Renvoyer l’invitation' : 'Envoyer l’invitation'}
                  </button>
                )}
                <button disabled={busy === `act${c.id}`} onClick={() => run(`act${c.id}`, `admin/teleconsultation/centers/${c.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !c.is_active }) })} className={`rounded-xl px-3.5 py-2 text-sm ${c.is_active ? 'text-[#9B2C2C] hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                  {c.is_active ? 'Désactiver' : 'Réactiver'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Modifier le centre' : 'Ajouter un centre'} onClose={() => setForm(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du centre"><input value={form.data.name} onChange={set('name')} className={inputClass} /></Field>
            <Field label="Réseau">
              <select value={form.data.organization} onChange={set('organization')} className={inputClass}>{ORGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </Field>
            <Field label="E-mail" hint="(reçoit l’invitation)"><input type="email" value={form.data.email} onChange={set('email')} className={inputClass} /></Field>
            <Field label="Téléphone" hint="(affiché au jeune)"><input value={form.data.phone} onChange={set('phone')} className={inputClass} /></Field>
            <Field label="Ville">
              <select value={form.data.city} onChange={set('city')} className={inputClass}>
                <option value="">Choisir…</option>
                {BENIN_CITIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Adresse"><input value={form.data.address} onChange={set('address')} maxLength={255} className={inputClass} /></Field>
            <Field label="Horaires" hint="(ex. Lun à ven, 8 h à 17 h)"><input value={form.data.opening_hours} onChange={set('opening_hours')} maxLength={200} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude" hint="(facultatif)"><input value={form.data.lat} onChange={set('lat')} inputMode="decimal" className={inputClass} /></Field>
              <Field label="Longitude"><input value={form.data.lng} onChange={set('lng')} inputMode="decimal" className={inputClass} /></Field>
            </div>
            <div className="sm:col-span-2"><Field label="Services proposés" hint="(contraception, dépistage…)"><textarea rows={3} value={form.data.services} onChange={set('services')} maxLength={600} className={inputClass} /></Field></div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded-xl px-4 py-2.5 text-sm text-body">Annuler</button>
            <button onClick={save} disabled={busy === 'save'} className="rounded-xl bg-heading px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

TeleconsultationCenters.authenticate = { permissions: adminOnly };
TeleconsultationCenters.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
