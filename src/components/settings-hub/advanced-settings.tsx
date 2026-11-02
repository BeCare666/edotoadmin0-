import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import cn from 'classnames';
import Card from '@/components/common/card';
import { apiCall } from '@/components/campaign/campaign-api';

// Paramètres avancés (02/11/2026) : GET /admin/platform-settings, PUT /admin/platform-settings/:clé,
// PUT /admin/platform-settings/:clé/reset. Bornes contrôlées par l'API ; chaque modification est inscrite
// au journal d'audit de l'admin. Valeur d'origine = celle en vigueur avant ce chantier.
type Setting = {
  key: string;
  label: string;
  help: string;
  type: 'int' | 'bool';
  unit: string | null;
  min: number | null;
  max: number | null;
  value: number | boolean;
  default: number | boolean;
  customized: boolean;
  updated_at: string | null;
};
type Group = { group: string; label: string; settings: Setting[] };

const show = (s: Setting, v: number | boolean) => (s.type === 'bool' ? (v ? 'Oui' : 'Non') : `${v}${s.unit ? ` ${s.unit}` : ''}`);

function Row({ s, onSaved }: { s: Setting; onSaved: (next: Setting) => void }) {
  const [draft, setDraft] = useState<string | boolean>(s.type === 'bool' ? Boolean(s.value) : String(s.value));
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(s.type === 'bool' ? Boolean(s.value) : String(s.value)), [s.value, s.type]);

  const changed = s.type === 'bool' ? draft !== Boolean(s.value) : String(draft) !== String(s.value);

  const run = async (path: string, body?: any) => {
    setBusy(true);
    try {
      const res = await apiCall(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
      toast.success(res.message);
      onSaved({ ...s, value: res.value, customized: !path.endsWith('/reset'), updated_at: new Date().toISOString() });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-[#EFECE7] py-4 first:border-t-0 first:pt-0 md:flex-row md:items-center md:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-heading">
          {s.label}
          {s.customized && <span className="ms-2 rounded-full bg-[#FDECF4] px-2 py-0.5 text-[11px] font-medium text-[#C2185B]">Modifié</span>}
        </p>
        {s.help && <p className="mt-0.5 text-xs text-body">{s.help}</p>}
        <p className="mt-0.5 text-xs text-body">
          Valeur d&apos;origine : {show(s, s.default)}
          {s.type === 'int' && s.min != null && s.max != null && ` · de ${s.min} à ${s.max}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {s.type === 'bool' ? (
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(draft)}
            aria-label={s.label}
            onClick={() => setDraft(!draft)}
            className={cn('relative h-6 w-11 rounded-full transition', draft ? 'bg-accent' : 'bg-gray-300')}
          >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', draft ? 'left-[22px]' : 'left-0.5')} />
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={s.min ?? undefined}
              max={s.max ?? undefined}
              step={1}
              value={String(draft)}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={s.label}
              className="w-24 rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            {s.unit && <span className="text-sm text-body">{s.unit}</span>}
          </span>
        )}
        <button
          type="button"
          disabled={!changed || busy}
          onClick={() => run(`admin/platform-settings/${encodeURIComponent(s.key)}`, { value: s.type === 'bool' ? draft : String(draft).trim() })}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
        >
          {busy ? '…' : 'Enregistrer'}
        </button>
        {s.customized && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Revenir à la valeur d'origine (${show(s, s.default)}) ?`)) run(`admin/platform-settings/${encodeURIComponent(s.key)}/reset`);
            }}
            className="rounded-md px-3 py-2 text-sm text-body hover:bg-gray-100 disabled:opacity-40"
          >
            Rétablir
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdvancedSettings() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiCall('admin/platform-settings').then(setGroups).catch((e: any) => setError(e.message));
  }, []);

  const replace = (next: Setting) =>
    setGroups((gs) => gs?.map((g) => ({ ...g, settings: g.settings.map((x) => (x.key === next.key ? next : x)) })) ?? gs);

  if (error) return <Card><p className="text-sm text-red-600">{error}</p></Card>;
  if (!groups) return <Card><p className="text-sm text-body">Chargement…</p></Card>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-body">
        Règles de fonctionnement de la plateforme. Un changement s&apos;applique dans la minute, aux nouvelles demandes
        (les codes, liens et rendez-vous déjà créés gardent leurs conditions). Chaque modification est inscrite au journal d&apos;audit.
      </p>
      {groups.map((g) => (
        <Card key={g.group}>
          <h2 className="mb-4 text-base font-semibold text-heading">{g.label}</h2>
          {g.settings.map((s) => (
            <Row key={s.key} s={s} onSaved={replace} />
          ))}
        </Card>
      ))}
    </div>
  );
}
