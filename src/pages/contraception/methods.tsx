import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import EdotoFilterBar, { FilterValues } from '@/components/filters/edoto-filter-bar';
import { apiCall } from '@/components/campaign/campaign-api';
import { uploadClient } from '@/data/client/upload';
import { adminOnly } from '@/utils/auth-utils';
import { Field, Modal, PageHead, Pill, inputClass } from '@/components/teleconsultation/tc-ui';
import { siteImage } from '@/components/contraception/contra-ui';

// Fiches des contraceptifs (21/10/2026) : données et images modifiables par le super admin.
// Fiches par défaut chargées par l'API depuis le manuel OMS de planification familiale.
type Method = {
  id: number; slug: string; name: string; family: string | null; requires_doctor: boolean; summary: string | null; description: string | null;
  how_to: string | null; advantages: string[]; drawbacks: string[]; criteria: string[]; efficacy: string | null; duration: string | null;
  protects_sti: boolean; image_url: string | null; image_credit: string | null; sort_order: number; is_active: boolean; requests: number;
};
const EMPTY = {
  name: '', family: '', requires_doctor: true, summary: '', description: '', how_to: '', advantages: '', drawbacks: '', criteria: '',
  efficacy: '', duration: '', protects_sti: false, image_url: '', image_credit: '', sort_order: '0',
};
type Form = typeof EMPTY;

export default function ContraceptionMethods() {
  const [rows, setRows] = useState<Method[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>({ doctor: '', state: '' });
  const [form, setForm] = useState<{ id?: number; data: Form } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await apiCall('admin/contraception/methods'));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const all = rows ?? [];
  const count = (f: (m: Method) => boolean) => all.filter(f).length;
  const visible = useMemo(() => {
    const t = search.trim().toLowerCase();
    return all.filter(
      (m) =>
        (!t || [m.name, m.family, m.summary].some((x) => String(x ?? '').toLowerCase().includes(t))) &&
        (!values.doctor || (values.doctor === 'yes' ? m.requires_doctor : !m.requires_doctor)) &&
        (!values.state || (values.state === 'visible' ? m.is_active : values.state === 'hidden' ? !m.is_active : !m.image_url)),
    );
  }, [all, search, values]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (m?: Method) =>
    setForm(
      m
        ? {
            id: m.id,
            data: {
              name: m.name, family: m.family ?? '', requires_doctor: m.requires_doctor, summary: m.summary ?? '', description: m.description ?? '',
              how_to: m.how_to ?? '', advantages: m.advantages.join('\n'), drawbacks: m.drawbacks.join('\n'), criteria: m.criteria.join('\n'),
              efficacy: m.efficacy ?? '', duration: m.duration ?? '', protects_sti: m.protects_sti, image_url: m.image_url ?? '',
              image_credit: m.image_credit ?? '', sort_order: String(m.sort_order ?? 0),
            },
          }
        : { data: { ...EMPTY } },
    );
  const set = (k: keyof Form) => (e: any) => setForm((f) => (f ? { ...f, data: { ...f.data, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } } : f));

  const upload = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast.error('Choisissez une image JPG, PNG ou WebP.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image dépasse 5 Mo : choisissez une image plus légère."); return; }
    setBusy('upload');
    try {
      const res: any = await uploadClient.upload([file as any]);
      const url = Array.isArray(res) ? res[0]?.url : res?.[0]?.url;
      if (!url) throw new Error("L'image n'a pas pu être envoyée.");
      setForm((f) => (f ? { ...f, data: { ...f.data, image_url: url, image_credit: '' } } : f));
      toast.success('Image importée sur Cloudinary : enregistrez la fiche pour la publier.');
    } catch (e: any) {
      toast.error(e?.message || "L'image n'a pas pu être envoyée.");
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!form) return;
    setBusy('save');
    try {
      const d = form.data;
      const body = { ...d, sort_order: Number(d.sort_order) || 0, advantages: d.advantages.split('\n'), drawbacks: d.drawbacks.split('\n'), criteria: d.criteria.split('\n') };
      const res = await apiCall(form.id ? `admin/contraception/methods/${form.id}` : 'admin/contraception/methods', { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      toast.success(res.message);
      setForm(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (m: Method) => {
    setBusy(`act${m.id}`);
    try {
      const res = await apiCall(`admin/contraception/methods/${m.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !m.is_active }) });
      toast.success(res.message);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const preview = siteImage(form?.data.image_url);

  return (
    <>
      <PageHead
        eyebrow="Contraception"
        title="Fiches des contraceptifs"
        subtitle="Ce que voient les jeunes sur le site : description, comment ça se fait, avantages, inconvénients, critères, efficacité et image. Fiches par défaut issues du manuel OMS de planification familiale."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/contraception" className="rounded-2xl border border-heading px-5 py-3 text-sm font-semibold text-heading">Demandes d’adoption</Link>
            <button onClick={() => edit()} className="rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent">+ Ajouter un contraceptif</button>
          </div>
        }
      />
      <EdotoFilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Nom, famille ou résumé…' }}
        quick={{
          key: 'doctor',
          allLabel: 'Tous',
          allCount: all.length,
          options: [
            { value: 'yes', label: 'Avec un médecin', count: count((m) => m.requires_doctor) },
            { value: 'no', label: 'Sans médecin', count: count((m) => !m.requires_doctor) },
          ],
        }}
        filters={[
          {
            type: 'chips',
            key: 'state',
            label: 'État',
            options: [
              { value: 'visible', label: 'Visible sur le site', count: count((m) => m.is_active) },
              { value: 'hidden', label: 'Masquée', count: count((m) => !m.is_active) },
              { value: 'no_image', label: 'Sans image', count: count((m) => !m.image_url) },
            ],
          },
        ]}
        values={values}
        onChange={(p) => setValues((v) => ({ ...v, ...p }))}
        onReset={() => { setValues({ doctor: '', state: '' }); setSearch(''); }}
        resultLabel={`${visible.length} fiche${visible.length > 1 ? 's' : ''}`}
      />
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : !rows ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[#EFECE7]" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-[#E9E5DF] bg-white py-16 text-center text-sm text-body">Aucune fiche.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <div key={m.id} className={`overflow-hidden rounded-2xl border bg-white ${m.is_active ? 'border-[#E9E5DF]' : 'border-dashed border-[#D9D3CA] opacity-70'}`}>
              {m.image_url ? (
                <img src={siteImage(m.image_url) as string} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-[#F3EEE7] font-serif text-5xl text-[#D9D0C4]">{m.name.charAt(0)}</div>
              )}
              <div className="p-5">
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone={m.requires_doctor ? 'neutral' : 'info'}>{m.requires_doctor ? 'Avec un médecin' : 'Sans médecin'}</Pill>
                  {m.protects_sti && <Pill tone="ok">Protège des IST</Pill>}
                  {!m.is_active && <Pill tone="stop">Masquée</Pill>}
                  {!m.image_url && <Pill tone="wait">Sans image</Pill>}
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#8A837A]">{m.family || 'Famille non renseignée'}</p>
                <p className="font-serif text-xl text-heading">{m.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-body">{m.summary}</p>
                <p className="mt-3 text-xs text-[#8A837A]">{m.requests} demande{m.requests > 1 ? 's' : ''} · ordre {m.sort_order}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => edit(m)} className="rounded-xl border border-[#E9E5DF] px-3.5 py-2 text-sm text-heading hover:border-heading">Modifier</button>
                  <button disabled={busy === `act${m.id}`} onClick={() => toggle(m)} className={`rounded-xl px-3.5 py-2 text-sm ${m.is_active ? 'text-[#9B2C2C] hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                    {m.is_active ? 'Masquer du site' : 'Afficher sur le site'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Modifier la fiche' : 'Ajouter un contraceptif'} onClose={() => setForm(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom"><input value={form.data.name} onChange={set('name')} maxLength={120} className={inputClass} /></Field>
            <Field label="Famille" hint="(ex. Longue durée, hormonale)"><input value={form.data.family} onChange={set('family')} maxLength={80} className={inputClass} /></Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E9E5DF] p-4">
              <input type="checkbox" checked={form.data.requires_doctor} onChange={set('requires_doctor')} className="mt-0.5 h-4 w-4 accent-[#C2185B]" />
              <span><span className="block text-sm font-medium text-heading">Nécessite un médecin</span><span className="block text-xs text-[#8A837A]">Rencontre obligatoire (étape 3). Décochée : orientation directe vers un centre.</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E9E5DF] p-4">
              <input type="checkbox" checked={form.data.protects_sti} onChange={set('protects_sti')} className="mt-0.5 h-4 w-4 accent-[#C2185B]" />
              <span><span className="block text-sm font-medium text-heading">Protège des IST et du VIH</span><span className="block text-xs text-[#8A837A]">Préservatifs seulement.</span></span>
            </label>
            <div className="sm:col-span-2"><Field label="Résumé" hint="(une ou deux phrases)"><textarea rows={2} value={form.data.summary} onChange={set('summary')} maxLength={400} className={inputClass} /></Field></div>
            <Field label="Comment ça marche"><textarea rows={5} value={form.data.description} onChange={set('description')} maxLength={4000} className={inputClass} /></Field>
            <Field label="Comment ça se fait"><textarea rows={5} value={form.data.how_to} onChange={set('how_to')} maxLength={4000} className={inputClass} /></Field>
            <Field label="Avantages" hint="(une ligne par avantage)"><textarea rows={5} value={form.data.advantages} onChange={set('advantages')} className={inputClass} /></Field>
            <Field label="Inconvénients" hint="(une ligne par inconvénient)"><textarea rows={5} value={form.data.drawbacks} onChange={set('drawbacks')} className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Critères" hint="(une ligne par critère : pour qui, précautions)"><textarea rows={4} value={form.data.criteria} onChange={set('criteria')} className={inputClass} /></Field></div>
            <Field label="Efficacité"><input value={form.data.efficacy} onChange={set('efficacy')} maxLength={120} className={inputClass} /></Field>
            <Field label="Durée"><input value={form.data.duration} onChange={set('duration')} maxLength={120} className={inputClass} /></Field>
            <div className="rounded-2xl border border-[#E9E5DF] p-4 sm:col-span-2">
              <p className="text-sm font-medium text-heading">Image du dispositif</p>
              <p className="text-xs text-[#8A837A]">Importée depuis votre ordinateur et stockée sur Cloudinary ; son lien est utilisé sur le site.</p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
                {/* Zone d'import : glisser-déposer ou cliquer pour choisir un fichier */}
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
                  className={`relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition ${dragging ? 'border-[#C2185B] bg-[#FBEEF3]' : 'border-[#D9D3CA] bg-[#F9F8F6] hover:border-heading'}`}
                >
                  {preview ? (
                    <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="px-3 text-center text-xs text-[#8A837A]">Glissez une image ici<br />ou cliquez pour choisir</span>
                  )}
                  {busy === 'upload' && <span className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-medium text-heading">Import en cours…</span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-white">
                      {preview ? "Remplacer l'image" : 'Importer une image'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                    {preview && (
                      <button type="button" onClick={() => setForm((f) => (f ? { ...f, data: { ...f.data, image_url: '', image_credit: '' } } : f))} className="rounded-xl px-4 py-2.5 text-sm text-[#9B2C2C] hover:bg-red-50">
                        Retirer l&apos;image
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#8A837A]">JPG, PNG ou WebP, 5 Mo au maximum.</p>
                  {form.data.image_url && (
                    <p className="truncate text-xs text-[#8A837A]" title={form.data.image_url}>
                      {/cloudinary\.com/.test(form.data.image_url) ? 'Stockée sur Cloudinary : ' : 'Image actuelle : '}{form.data.image_url}
                    </p>
                  )}
                  <Field label="Crédit de l'image" hint="(auteur et licence, si besoin)"><input value={form.data.image_credit} onChange={set('image_credit')} maxLength={300} className={inputClass} /></Field>
                </div>
              </div>
            </div>
            <Field label="Ordre d'affichage" hint="(du plus petit au plus grand)"><input type="number" value={form.data.sort_order} onChange={set('sort_order')} className={inputClass} /></Field>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded-xl px-4 py-2.5 text-sm text-body">Annuler</button>
            <button onClick={save} disabled={busy === 'save' || busy === 'upload'} className="rounded-xl bg-heading px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

ContraceptionMethods.authenticate = { permissions: adminOnly };
ContraceptionMethods.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
