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
// 20/10/2026 : le super admin saisit aussi les heures disponibles du médecin, et désigne le médecin E.doto family
// qui prend en charge toutes les heures où aucun autre médecin n'est libre.
type Doctor = {
  id: number; name: string; email: string; phone: string | null; title: string | null; bio: string | null; slot_minutes: number;
  is_house: boolean; is_active: boolean; account_status: 'not_invited' | 'invited' | 'active'; account_label: string; invited_at: string | null;
  has_schedule: boolean; upcoming: number; completed: number;
};
type Rule = { weekday: number; start_time: string; end_time: string; modes: 'both' | 'video' | 'phone' };
const EMPTY_FORM = { name: '', email: '', phone: '', title: '', bio: '', slot_minutes: '30', is_house: false };
const ACCOUNT_TONE: Record<string, string> = { not_invited: 'neutral', invited: 'wait', active: 'ok' };
const WEEKDAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MODES: Record<string, string> = { both: 'Visio et appel', video: 'Visio seulement', phone: 'Appel seulement' };

// Heures disponibles par jour de la semaine (heure du Bénin), plusieurs plages par jour
function ScheduleEditor({ rules, onChange }: { rules: Rule[]; onChange: (r: Rule[]) => void }) {
  const update = (i: number, patch: Partial<Rule>) => onChange(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = (weekday: number) => onChange([...rules, { weekday, start_time: '09:00', end_time: '12:00', modes: 'both' }]);
  const remove = (i: number) => onChange(rules.filter((_, j) => j !== i));
  const copyMonday = () => {
    const mon = rules.filter((r) => r.weekday === 1);
    if (!mon.length) return;
    onChange([...rules.filter((r) => r.weekday === 1 || r.weekday > 5), ...[2, 3, 4, 5].flatMap((d) => mon.map((r) => ({ ...r, weekday: d })))]);
  };
  return (
    <div className="rounded-2xl border border-[#E9E5DF]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFECE7] px-4 py-3">
        <p className="text-sm font-medium text-[#1A1814]">Heures disponibles <span className="font-normal text-[#8A837A]">(heure du Bénin)</span></p>
        <button type="button" onClick={copyMonday} className="text-sm font-medium text-[#C2185B] hover:underline">Copier le lundi sur mardi à vendredi</button>
      </div>
      <div className="divide-y divide-[#EFECE7]">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const list = rules.map((r, i) => ({ ...r, i })).filter((r) => r.weekday === d);
          return (
            <div key={d} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
              <p className="w-24 shrink-0 pt-2 text-sm font-medium text-[#1A1814]">{WEEKDAYS[d]}</p>
              <div className="flex-1 space-y-2">
                {list.length === 0 && <p className="pt-2 text-sm text-[#8A837A]">Indisponible</p>}
                {list.map((r) => (
                  <div key={r.i} className="flex flex-wrap items-center gap-2">
                    <input type="time" value={r.start_time} onChange={(e) => update(r.i, { start_time: e.target.value })} className={`${inputClass} w-auto`} aria-label="Début" />
                    <span className="text-sm text-[#8A837A]">à</span>
                    <input type="time" value={r.end_time} onChange={(e) => update(r.i, { end_time: e.target.value })} className={`${inputClass} w-auto`} aria-label="Fin" />
                    <select value={r.modes} onChange={(e) => update(r.i, { modes: e.target.value as Rule['modes'] })} className={`${inputClass} w-auto`}>
                      {Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button type="button" onClick={() => remove(r.i)} className="rounded-xl px-3 py-2 text-sm text-[#9B2C2C] hover:bg-red-50">Retirer</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => add(d)} className="self-start rounded-xl border border-[#E9E5DF] px-3 py-2 text-sm text-[#1A1814] hover:border-[#1A1814]">+ Plage</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeleconsultationDoctors() {
  const [rows, setRows] = useState<Doctor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>({ account: '', state: '' });
  const [form, setForm] = useState<{ id?: number; data: typeof EMPTY_FORM; rules: Rule[] | null } | null>(null);
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
  const house = all.find((d) => d.is_house);
  const count = (f: (d: Doctor) => boolean) => all.filter(f).length;
  const visible = useMemo(() => {
    const t = search.trim().toLowerCase();
    return all.filter(
      (d) =>
        (!t || [d.name, d.email, d.title, d.phone].some((x) => String(x ?? '').toLowerCase().includes(t))) &&
        (!values.account || d.account_status === values.account) &&
        (!values.state || (values.state === 'active' ? d.is_active : values.state === 'inactive' ? !d.is_active : values.state === 'house' ? d.is_house : !d.has_schedule)),
    );
  }, [all, search, values]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = (isHouse = false) => setForm({ data: { ...EMPTY_FORM, is_house: isHouse }, rules: [] });
  const openEdit = async (d: Doctor) => {
    setForm({
      id: d.id,
      data: { name: d.name, email: d.email, phone: d.phone ?? '', title: d.title ?? '', bio: d.bio ?? '', slot_minutes: String(d.slot_minutes), is_house: d.is_house },
      rules: null,
    });
    try {
      const s = await apiCall(`admin/teleconsultation/doctors/${d.id}/schedule`);
      setForm((f) => (f && f.id === d.id ? { ...f, rules: s.rules.map((r: any) => ({ weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, modes: r.modes })) } : f));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const save = async () => {
    if (!form) return;
    setBusy('save');
    try {
      const res = await apiCall(form.id ? `admin/teleconsultation/doctors/${form.id}` : 'admin/teleconsultation/doctors', {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form.data),
      });
      const id = form.id ?? res.id;
      // Fiche créée : un nouvel essai la met à jour au lieu d'en créer une seconde
      if (!form.id && id) setForm((f) => (f ? { ...f, id } : f));
      // Heures disponibles enregistrées avec la fiche
      if (id && form.rules) {
        await apiCall(`admin/teleconsultation/doctors/${id}/schedule`, {
          method: 'PUT',
          body: JSON.stringify({ rules: form.rules, slot_minutes: Number(form.data.slot_minutes) }),
        });
      }
      toast.success(res.message);
      setForm(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
      await load();
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
  const set = (k: Exclude<keyof typeof EMPTY_FORM, 'is_house'>) => (e: any) => setForm((f) => (f ? { ...f, data: { ...f.data, [k]: e.target.value } } : f));

  return (
    <>
      <PageHead
        eyebrow="Téléconsultation"
        title="Médecins"
        subtitle="Ajoutez un médecin avec ses heures disponibles puis envoyez son invitation : il choisit son mot de passe, peut ajuster ses disponibilités et reçoit les rendez-vous dans son espace médecin du site."
        action={<button onClick={() => openNew()} className="rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent">+ Ajouter un médecin</button>}
      />

      {/* Médecin E.doto family : couvre toutes les heures où aucun autre médecin n'est libre */}
      {rows && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#F3CADB] bg-[#FBEEF3] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A0124A]">Médecin E.doto family</p>
            {house ? (
              <p className="mt-1 text-sm text-[#1A1814]">
                <span className="font-semibold">{house.name}</span> prend en charge toutes les heures où aucun autre médecin n’est libre, dans ses heures disponibles.
                {house.account_status !== 'active' && ' Son espace n’est pas encore actif : envoyez son invitation pour que ses créneaux soient proposés.'}
                {house.account_status === 'active' && !house.has_schedule && ' Ajoutez ses heures disponibles pour que ses créneaux soient proposés.'}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#1A1814]">Aucun médecin E.doto family : les heures sans médecin ne sont pas couvertes. Désignez-en un pour qu’un jeune trouve toujours un rendez-vous.</p>
            )}
          </div>
          {house ? (
            <button onClick={() => openEdit(house)} className="shrink-0 rounded-xl border border-[#A0124A] px-4 py-2.5 text-sm font-semibold text-[#A0124A] hover:bg-white">Modifier ses heures</button>
          ) : (
            <button onClick={() => openNew(true)} className="shrink-0 rounded-xl bg-[#A0124A] px-4 py-2.5 text-sm font-semibold text-white">Ajouter le médecin E.doto family</button>
          )}
        </div>
      )}

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
              { value: 'house', label: 'Médecin E.doto family', count: count((d) => d.is_house) },
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
            <div key={d.id} className={`rounded-2xl border bg-white p-5 ${d.is_house ? 'border-[#F3CADB]' : 'border-[#E9E5DF]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-heading">{d.name}</p>
                  <p className="text-sm text-body">{d.title || 'Fonction non renseignée'}</p>
                  <p className="mt-1 truncate text-xs text-[#8A837A]">{d.email}{d.phone ? ` · ${d.phone}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.is_house && <Pill tone="info">Médecin E.doto family</Pill>}
                  <Pill tone={ACCOUNT_TONE[d.account_status]}>{d.account_label}</Pill>
                  {!d.is_active && <Pill tone="stop">Désactivé</Pill>}
                  {!d.has_schedule && <Pill tone="wait">Sans disponibilités</Pill>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#EFECE7] pt-4 text-sm">
                <div><p className="text-xs text-[#8A837A]">Consultation</p><p className="text-heading">{d.slot_minutes} min</p></div>
                <div><p className="text-xs text-[#8A837A]">À venir</p><p className="text-heading">{d.upcoming}</p></div>
                <div><p className="text-xs text-[#8A837A]">Terminés</p><p className="text-heading">{d.completed}</p></div>
              </div>
              {d.account_status === 'invited' && d.invited_at && <p className="mt-3 text-xs text-[#8A837A]">Invité le {when(d.invited_at)}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => openEdit(d)} className="rounded-xl border border-[#E9E5DF] px-3.5 py-2 text-sm text-heading hover:border-heading">Modifier et heures</button>
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
        <Modal title={form.id ? 'Modifier le médecin' : form.data.is_house ? 'Ajouter le médecin E.doto family' : 'Ajouter un médecin'} onClose={() => setForm(null)} wide>
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
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E9E5DF] p-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.data.is_house}
                onChange={(e) => setForm((f) => (f ? { ...f, data: { ...f.data, is_house: e.target.checked } } : f))}
                className="mt-0.5 h-4 w-4 accent-[#C2185B]"
              />
              <span>
                <span className="block text-sm font-medium text-[#1A1814]">Médecin E.doto family</span>
                <span className="block text-xs text-[#8A837A]">
                  Prend en charge toutes les heures où aucun autre médecin n’est libre, dans ses heures disponibles. Un seul médecin E.doto family à la fois.
                  {house && house.id !== form.id ? ` Actuellement : ${house.name}.` : ''}
                </span>
              </span>
            </label>
            <div className="sm:col-span-2">
              {form.rules ? (
                <ScheduleEditor rules={form.rules} onChange={(r) => setForm((f) => (f ? { ...f, rules: r } : f))} />
              ) : (
                <div className="h-40 animate-pulse rounded-2xl bg-[#EFECE7]" />
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded-xl px-4 py-2.5 text-sm text-body">Annuler</button>
            <button onClick={save} disabled={busy === 'save' || !form.rules} className="rounded-xl bg-heading px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
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
