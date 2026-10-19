import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import EdotoFilterBar, { FilterValues } from '@/components/filters/edoto-filter-bar';
import { apiCall } from '@/components/campaign/campaign-api';
import { adminOnly } from '@/utils/auth-utils';
import { Field, Modal, PageHead, Pill, inputClass, when } from '@/components/teleconsultation/tc-ui';

// Médecins de la téléconsultation (19/10/2026) : fiche créée ici, puis invitation par e-mail (lien de 7 jours)
// pour choisir le mot de passe. Le médecin fixe ensuite ses disponibilités dans son espace (site : /medecin).
type Doctor = {
  id: number; name: string; email: string; phone: string | null; title: string | null; bio: string | null; slot_minutes: number;
  is_active: boolean; account_status: 'not_invited' | 'invited' | 'active'; account_label: string; invited_at: string | null;
  has_schedule: boolean; upcoming: number; completed: number;
};
const EMPTY_FORM = { name: '', email: '', phone: '', title: '', bio: '', slot_minutes: '30' };
const ACCOUNT_TONE: Record<string, string> = { not_invited: 'neutral', invited: 'wait', active: 'ok' };

export default function TeleconsultationDoctors() {
  const [rows, setRows] = useState<Doctor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>({ account: '', state: '' });
  const [form, setForm] = useState<{ id?: number; data: typeof EMPTY_FORM } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await apiCall('admin/teleconsultation/doctors'));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const all = rows ?? [];
  const count = (f: (d: Doctor) => boolean) => all.filter(f).length;
  const visible = useMemo(() => {
    const t = search.trim().toLowerCase();
    return all.filter(
      (d) =>
        (!t || [d.name, d.email, d.title, d.phone].some((x) => String(x ?? '').toLowerCase().includes(t))) &&
        (!values.account || d.account_status === values.account) &&
        (!values.state || (values.state === 'active' ? d.is_active : values.state === 'inactive' ? !d.is_active : !d.has_schedule)),
    );
  }, [all, search, values]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form) return;
    setBusy('save');
    try {
      const res = await apiCall(form.id ? `admin/teleconsultation/doctors/${form.id}` : 'admin/teleconsultation/doctors', {
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

  return (
    <>
      <PageHead
        eyebrow="Téléconsultation"
        title="Médecins"
        subtitle="Ajoutez un médecin puis envoyez son invitation : il choisit son mot de passe, fixe ses disponibilités et reçoit les rendez-vous dans son espace médecin du site."
        action={<button onClick={() => setForm({ data: { ...EMPTY_FORM } })} className="rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent">+ Ajouter un médecin</button>}
      />
      <EdotoFilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Nom, e-mail, fonction ou téléphone…' }}
        quick={{
          key: 'account',
          allLabel: 'Tous',
          allCount: all.length,
          options: [
            { value: 'active', label: 'Espace actif', count: count((d) => d.account_status === 'active') },
            { value: 'invited', label: 'Invité', count: count((d) => d.account_status === 'invited') },
            { value: 'not_invited', label: 'Non invité', count: count((d) => d.account_status === 'not_invited') },
          ],
        }}
        filters={[
          {
            type: 'chips',
            key: 'state',
            label: 'État',
            options: [
              { value: 'active', label: 'Actif', count: count((d) => d.is_active) },
              { value: 'inactive', label: 'Désactivé', count: count((d) => !d.is_active) },
              { value: 'no_schedule', label: 'Sans disponibilités', count: count((d) => !d.has_schedule) },
            ],
          },
        ]}
        values={values}
        onChange={(p) => setValues((v) => ({ ...v, ...p }))}
        onReset={() => { setValues({ account: '', state: '' }); setSearch(''); }}
        resultLabel={`${visible.length} médecin${visible.length > 1 ? 's' : ''}`}
      />
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : !rows ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[#EFECE7]" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-[#E9E5DF] bg-white py-16 text-center text-sm text-body">Aucun médecin.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((d) => (
            <div key={d.id} className="rounded-2xl border border-[#E9E5DF] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-heading">{d.name}</p>
                  <p className="text-sm text-body">{d.title || 'Fonction non renseignée'}</p>
                  <p className="mt-1 truncate text-xs text-[#8A837A]">{d.email}{d.phone ? ` · ${d.phone}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone={ACCOUNT_TONE[d.account_status]}>{d.account_label}</Pill>
                  {!d.is_active && <Pill tone="stop">Désactivé</Pill>}
                  {d.account_status === 'active' && !d.has_schedule && <Pill tone="wait">Sans disponibilités</Pill>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#EFECE7] pt-4 text-sm">
                <div><p className="text-xs text-[#8A837A]">Consultation</p><p className="text-heading">{d.slot_minutes} min</p></div>
                <div><p className="text-xs text-[#8A837A]">À venir</p><p className="text-heading">{d.upcoming}</p></div>
                <div><p className="text-xs text-[#8A837A]">Terminés</p><p className="text-heading">{d.completed}</p></div>
              </div>
              {d.account_status === 'invited' && d.invited_at && <p className="mt-3 text-xs text-[#8A837A]">Invité le {when(d.invited_at)}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setForm({ id: d.id, data: { name: d.name, email: d.email, phone: d.phone ?? '', title: d.title ?? '', bio: d.bio ?? '', slot_minutes: String(d.slot_minutes) } })} className="rounded-xl border border-[#E9E5DF] px-3.5 py-2 text-sm text-heading hover:border-heading">Modifier</button>
                {d.account_status !== 'active' && (
                  <button disabled={busy === `inv${d.id}`} onClick={() => run(`inv${d.id}`, `admin/teleconsultation/doctors/${d.id}/invite`, { method: 'POST' })} className="rounded-xl bg-heading px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {d.account_status === 'invited' ? 'Renvoyer l’invitation' : 'Envoyer l’invitation'}
                  </button>
                )}
                <button disabled={busy === `act${d.id}`} onClick={() => run(`act${d.id}`, `admin/teleconsultation/doctors/${d.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !d.is_active }) })} className={`rounded-xl px-3.5 py-2 text-sm ${d.is_active ? 'text-[#9B2C2C] hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                  {d.is_active ? 'Désactiver' : 'Réactiver'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Modifier le médecin' : 'Ajouter un médecin'} onClose={() => setForm(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet"><input value={form.data.name} onChange={set('name')} className={inputClass} /></Field>
            <Field label="Fonction" hint="(ex. Sage-femme, Médecin généraliste)"><input value={form.data.title} onChange={set('title')} maxLength={120} className={inputClass} /></Field>
            <Field label="E-mail" hint="(reçoit l’invitation)"><input type="email" value={form.data.email} onChange={set('email')} className={inputClass} /></Field>
            <Field label="Téléphone" hint="(facultatif)"><input value={form.data.phone} onChange={set('phone')} className={inputClass} /></Field>
            <Field label="Durée d’une consultation">
              <select value={form.data.slot_minutes} onChange={set('slot_minutes')} className={inputClass}>
                {[15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label="Présentation" hint="(facultatif)"><textarea rows={3} value={form.data.bio} onChange={set('bio')} maxLength={600} className={inputClass} /></Field></div>
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

TeleconsultationDoctors.authenticate = { permissions: adminOnly };
TeleconsultationDoctors.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
