import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Card from '@/components/common/card';
import { apiCall, BENIN_CITIES, fcfa } from './campaign-api';
import { intInput, MAX_AGE, MIN_AGE, TARGET_SEX_OPTIONS } from '@/utils/field-rules';

interface Sponsor {
  id: number;
  name: string;
  email: string;
}

export interface CampaignFormValues {
  title: string;
  objective_kits: string;
  date_start: string;
  date_end: string;
  description: string;
  image_url: string;
  cities: string[];
  sponsors: { sponsor_id: number; amount: string }[];
  // Public ciblé (16/10/2026) : sexe (all = les deux) et tranche d'âge (vide = sans limite)
  target_sex?: string;
  target_age_min?: string;
  target_age_max?: string;
}

export const EMPTY_FORM: CampaignFormValues = {
  title: '',
  objective_kits: '',
  date_start: '',
  date_end: '',
  description: '',
  image_url: '',
  cities: [],
  sponsors: [],
  target_sex: 'all',
  target_age_min: '',
  target_age_max: '',
};

const input = 'w-full rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';
const label = 'mb-1 block text-sm font-semibold text-heading';

/**
 * Création / modification d'une campagne : nom, kits fournis, ville(s), dates de début et de fin,
 * sponsors (existants) avec leur montant. Budget = somme des montants (calculé).
 */
// proposalId (15/10/2026) : création à partir d'une demande de campagne validée d'un sponsor
export default function CampaignForm({ campaignId, initial, proposalId }: { campaignId?: number; initial?: CampaignFormValues; proposalId?: number }) {
  const router = useRouter();
  const [values, setValues] = useState<CampaignFormValues>(initial ?? EMPTY_FORM);
  const [cityInput, setCityInput] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [addSponsorId, setAddSponsorId] = useState('');
  const [newSponsor, setNewSponsor] = useState<{ open: boolean; name: string; email: string; busy: boolean }>({ open: false, name: '', email: '', busy: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCall('admin/sponsors').then(setSponsors).catch((e) => toast.error(e.message));
  }, []);

  const set = (k: keyof CampaignFormValues, v: any) => setValues((prev) => ({ ...prev, [k]: v }));
  const budget = useMemo(() => values.sponsors.reduce((s, x) => s + (Number(x.amount) || 0), 0), [values.sponsors]);
  const sponsorName = (id: number) => sponsors.find((s) => s.id === id)?.name ?? `Sponsor ${id}`;
  const available = sponsors.filter((s) => !values.sponsors.some((x) => x.sponsor_id === s.id));

  const addCity = () => {
    const city = cityInput.trim();
    if (!city) return;
    if (!values.cities.some((c) => c.toLowerCase() === city.toLowerCase())) set('cities', [...values.cities, city]);
    setCityInput('');
  };

  const addSponsor = () => {
    const id = Number(addSponsorId);
    if (!id) return;
    set('sponsors', [...values.sponsors, { sponsor_id: id, amount: '' }]);
    setAddSponsorId('');
  };

  const createSponsor = async () => {
    setNewSponsor((s) => ({ ...s, busy: true }));
    try {
      const created = await apiCall('admin/sponsors', {
        method: 'POST',
        body: JSON.stringify({ name: newSponsor.name, email: newSponsor.email }),
      });
      setSponsors((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
      set('sponsors', [...values.sponsors, { sponsor_id: created.id, amount: '' }]);
      setNewSponsor({ open: false, name: '', email: '', busy: false });
      toast.success(`Sponsor « ${created.name} » ajouté.`);
    } catch (e: any) {
      toast.error(e.message);
      setNewSponsor((s) => ({ ...s, busy: false }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Tranche d'âge cohérente avant l'envoi (même contrôle que l'API)
    const a = values.target_age_min ? Number(values.target_age_min) : null;
    const b = values.target_age_max ? Number(values.target_age_max) : null;
    if ((a !== null && (a < MIN_AGE || a > MAX_AGE)) || (b !== null && (b < MIN_AGE || b > MAX_AGE))) {
      toast.error(`L'âge doit être compris entre ${MIN_AGE} et ${MAX_AGE} ans.`);
      return;
    }
    if (a !== null && b !== null && a > b) {
      toast.error("L'âge minimum ne peut pas dépasser l'âge maximum.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: values.title,
        objective_kits: Number(values.objective_kits),
        date_start: values.date_start,
        date_end: values.date_end,
        description: values.description,
        image_url: values.image_url,
        cities: values.cities,
        sponsors: values.sponsors.map((s) => ({ sponsor_id: s.sponsor_id, amount: Number(s.amount) || 0 })),
        target_sex: values.target_sex || 'all',
        target_age_min: values.target_age_min === '' || values.target_age_min === undefined ? null : Number(values.target_age_min),
        target_age_max: values.target_age_max === '' || values.target_age_max === undefined ? null : Number(values.target_age_max),
        ...(proposalId && !campaignId ? { proposal_id: proposalId } : {}),
      };
      const res = await apiCall(campaignId ? `admin/campaigns/${campaignId}` : 'admin/campaigns', {
        method: campaignId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      toast.success(res.message || 'Campagne enregistrée.');
      router.push(`/campaigns/${res.id ?? campaignId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label} htmlFor="c-title">Nom de la campagne *</label>
          <input id="c-title" className={input} value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={255} required />
        </div>
        <div>
          <label className={label} htmlFor="c-kits">Nombre de kits fournis *</label>
          <input id="c-kits" inputMode="numeric" className={input} value={values.objective_kits} onChange={(e) => set('objective_kits', intInput(e.target.value, 7))} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="c-start">Début *</label>
            <input id="c-start" type="date" className={input} value={values.date_start} onChange={(e) => set('date_start', e.target.value)} required />
          </div>
          <div>
            <label className={label} htmlFor="c-end">Fin *</label>
            <input id="c-end" type="date" min={values.date_start || undefined} className={input} value={values.date_end} onChange={(e) => set('date_end', e.target.value)} required />
          </div>
        </div>
        <p className="text-xs text-body md:col-span-2">
          Le statut est calculé automatiquement : à venir avant le début, en cours jusqu&apos;à la fin, terminée ensuite.
        </p>
      </Card>

      {/* Public ciblé : seules les personnes de ce sexe et de cet âge peuvent demander et retirer un kit */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-heading">Public ciblé</h3>
        <p className="mb-4 text-xs text-body">
          Une personne hors de ce public ne peut ni demander ni retirer un kit. L&apos;âge est calculé à partir de sa date de naissance, le jour de la demande et le jour du retrait.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Sexe ciblé">
          {TARGET_SEX_OPTIONS.map((o) => {
            const on = (values.target_sex || 'all') === o.value;
            return (
              <label key={o.value} className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition ${on ? 'border-[#C2185B] bg-[#FBEEF3]' : 'border-border-200 hover:border-border-400'}`}>
                <input type="radio" name="target_sex" value={o.value} checked={on} onChange={() => set('target_sex', o.value)} className="sr-only" />
                <span className={`text-sm font-medium ${on ? 'text-[#A0124A]' : 'text-heading'}`}>{o.label}</span>
                <span className="text-xs text-body">{o.hint}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <div>
            <label className={label} htmlFor="c-age-min">Âge minimum</label>
            <input id="c-age-min" inputMode="numeric" placeholder="Sans limite" className={input} value={values.target_age_min ?? ''} onChange={(e) => set('target_age_min', intInput(e.target.value, 3))} />
          </div>
          <div>
            <label className={label} htmlFor="c-age-max">Âge maximum</label>
            <input id="c-age-max" inputMode="numeric" placeholder="Sans limite" className={input} value={values.target_age_max ?? ''} onChange={(e) => set('target_age_max', intInput(e.target.value, 3))} />
          </div>
        </div>
      </Card>

      <Card>
        <label className={label} htmlFor="c-city">Ville(s) où se déroule la campagne *</label>
        <div className="flex gap-2">
          <input
            id="c-city"
            list="benin-cities"
            className={input}
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCity();
              }
            }}
            placeholder="Ex. : Cotonou"
          />
          <datalist id="benin-cities">
            {BENIN_CITIES.map((c) => <option key={c} value={c} />)}
          </datalist>
          <button type="button" onClick={addCity} className="shrink-0 rounded-md border border-border-200 px-4 py-2 text-sm font-semibold text-heading hover:border-accent">
            Ajouter
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {values.cities.length === 0 && <span className="text-sm text-body">Aucune ville.</span>}
          {values.cities.map((c) => (
            <span key={c} className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm text-heading">
              {c}
              <button type="button" aria-label={`Retirer ${c}`} onClick={() => set('cities', values.cities.filter((x) => x !== c))} className="text-body hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className={label}>Sponsors</span>
          <span className="text-sm text-heading">Budget : <strong>{fcfa(budget)}</strong></span>
        </div>
        {values.sponsors.length === 0 && <p className="mb-3 text-sm text-body">Aucun sponsor.</p>}
        {values.sponsors.map((s, i) => (
          <div key={s.sponsor_id} className="mb-2 flex items-center gap-2">
            <span className="flex-1 text-sm text-heading">{sponsorName(s.sponsor_id)}</span>
            <input
              type="number"
              min={0}
              aria-label={`Montant de ${sponsorName(s.sponsor_id)}`}
              placeholder="Montant (FCFA)"
              className={`${input} w-44`}
              value={s.amount}
              onChange={(e) => set('sponsors', values.sponsors.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
            />
            <button type="button" onClick={() => set('sponsors', values.sponsors.filter((_, j) => j !== i))} className="px-2 text-sm text-red-600 hover:underline">
              Retirer
            </button>
          </div>
        ))}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select className={`${input} w-auto min-w-[220px]`} value={addSponsorId} onChange={(e) => setAddSponsorId(e.target.value)} aria-label="Choisir un sponsor existant">
            <option value="">Choisir un sponsor existant…</option>
            {available.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
          </select>
          <button type="button" onClick={addSponsor} disabled={!addSponsorId} className="rounded-md border border-border-200 px-4 py-2 text-sm font-semibold text-heading hover:border-accent disabled:opacity-50">
            Ajouter
          </button>
          <button type="button" onClick={() => setNewSponsor((s) => ({ ...s, open: !s.open }))} className="text-sm font-semibold text-accent hover:underline">
            + Nouveau sponsor
          </button>
        </div>
        {newSponsor.open && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md bg-gray-50 p-3">
            <input className={`${input} w-56`} placeholder="Nom" value={newSponsor.name} onChange={(e) => setNewSponsor((s) => ({ ...s, name: e.target.value }))} />
            <input className={`${input} w-64`} type="email" placeholder="E-mail" value={newSponsor.email} onChange={(e) => setNewSponsor((s) => ({ ...s, email: e.target.value }))} />
            <button type="button" onClick={createSponsor} disabled={newSponsor.busy || !newSponsor.name.trim() || !newSponsor.email.trim()} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {newSponsor.busy ? '…' : 'Enregistrer le sponsor'}
            </button>
          </div>
        )}
        <p className="mt-3 text-xs text-body">Chaque nouveau sponsor d&apos;une campagne reçoit par e-mail son code d&apos;accès à cette campagne.</p>
      </Card>

      <Card className="grid gap-4">
        <div>
          <label className={label} htmlFor="c-desc">Description</label>
          <textarea id="c-desc" rows={3} className={input} value={values.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="c-img">Lien de l&apos;image</label>
          <input id="c-img" className={input} value={values.image_url} onChange={(e) => set('image_url', e.target.value)} maxLength={500} />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-md border border-border-200 px-5 py-2 text-sm font-semibold text-heading">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
          {saving ? 'Enregistrement…' : campaignId ? 'Enregistrer les modifications' : 'Créer la campagne'}
        </button>
      </div>
    </form>
  );
}
