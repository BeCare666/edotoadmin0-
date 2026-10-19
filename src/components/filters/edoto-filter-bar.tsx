import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import cn from 'classnames';

// Barre de filtres commune aux listes de l'admin E.doto.
// Elle n'invente aucune valeur : chaque liste lui passe les options tirées de la base
// (avec leurs compteurs réels) et reçoit les changements sous forme clé → valeur.

export type FilterOption = { value: string; label: string; count?: number };

export type FilterDef =
  | { type: 'chips'; key: string; label: string; options: FilterOption[]; hideEmpty?: boolean }
  | { type: 'select'; key: string; label: string; options: FilterOption[]; placeholder?: string }
  | { type: 'range'; key: string; label: string; minKey: string; maxKey: string; unit?: string; minHint?: number | null; maxHint?: number | null }
  | { type: 'dates'; key: string; label: string; fromKey: string; toKey: string };

export type FilterValues = Record<string, string>;

type Props = {
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
  quick?: { key: string; allLabel: string; allCount?: number; options: FilterOption[] };
  filters?: FilterDef[];
  values: FilterValues;
  onChange: (patch: FilterValues) => void;
  onReset: () => void;
  sort?: { value: string; options: FilterOption[]; onChange: (v: string) => void };
  resultLabel?: string;
  actions?: React.ReactNode;
  /** Filtres recopiés dans l'adresse (actualisation, retour, lien partagé). Actif par défaut. */
  syncUrl?: boolean;
};

// Périodes rapides des filtres de dates, calculées au jour du Bénin (UTC+1)
const beninToday = () => new Date(Date.now() + 60 * 60 * 1000);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
function datePresets(): { label: string; from: string; to: string }[] {
  const t = beninToday();
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  const day = (offset: number) => isoDay(new Date(Date.UTC(y, m, t.getUTCDate() + offset)));
  return [
    { label: "Aujourd'hui", from: day(0), to: day(0) },
    { label: 'Hier', from: day(-1), to: day(-1) },
    { label: '7 derniers jours', from: day(-6), to: day(0) },
    { label: '30 derniers jours', from: day(-29), to: day(0) },
    { label: 'Ce mois-ci', from: isoDay(new Date(Date.UTC(y, m, 1))), to: day(0) },
    { label: 'Mois dernier', from: isoDay(new Date(Date.UTC(y, m - 1, 1))), to: isoDay(new Date(Date.UTC(y, m, 0))) },
    { label: 'Cette année', from: `${y}-01-01`, to: day(0) },
  ];
}

type SavedView = { name: string; values: FilterValues; search: string; sort: string };

const fmt = (n: number) => n.toLocaleString('fr-FR');

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

function CloseIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

// Champ numérique appliqué après une courte pause de saisie
function DebouncedNumber({ value, onCommit, placeholder, unit }: { value: string; onCommit: (v: string) => void; placeholder: string; unit?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (local === value) return;
    const tm = setTimeout(() => onCommit(local), 600);
    return () => clearTimeout(tm);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="relative flex-1">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border-200 bg-white py-2.5 pe-14 ps-3 text-sm text-heading transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
      />
      {unit && <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[11px] font-medium uppercase tracking-wide text-body">{unit}</span>}
    </div>
  );
}

export default function EdotoFilterBar({ search, quick, filters = [], values, onChange, onReset, sort, resultLabel, actions, syncUrl = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchLocal, setSearchLocal] = useState(search?.value ?? '');
  const searchRef = useRef<HTMLInputElement>(null);

  // Clés gérées par la barre (onglet rapide + chaque filtre)
  const managedKeys = useMemo(() => {
    const keys: string[] = [];
    if (quick) keys.push(quick.key);
    for (const f of filters) {
      if (f.type === 'range') keys.push(f.minKey, f.maxKey);
      else if (f.type === 'dates') keys.push(f.fromKey, f.toKey);
      else keys.push(f.key);
    }
    return Array.from(new Set(keys));
  }, [quick, filters]);

  // Adresse → filtres (une seule fois, à l'ouverture de la page)
  const hydrated = useRef(false);
  const skipWrite = useRef(false);
  const defaultSort = useRef(sort?.value ?? '');
  useEffect(() => {
    if (!syncUrl || hydrated.current || !router.isReady) return;
    hydrated.current = true;
    skipWrite.current = true; // les valeurs lues ne sont appliquées qu'au rendu suivant
    const q = router.query;
    const one = (k: string) => (typeof q[k] === 'string' ? (q[k] as string) : '');
    const patch: FilterValues = {};
    for (const k of managedKeys) if (one(k)) patch[k] = one(k);
    if (Object.keys(patch).length) onChange(patch);
    if (search && one('search') && one('search') !== search.value) search.onChange(one('search'));
    if (sort && one('sort') && sort.options.some((o) => o.value === one('sort'))) sort.onChange(one('sort'));
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtres → adresse (remplacement discret, sans rechargement)
  useEffect(() => {
    if (!syncUrl || !hydrated.current || !router.isReady) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    const next: Record<string, any> = {};
    for (const [k, v] of Object.entries(router.query)) if (!managedKeys.includes(k) && k !== 'search' && k !== 'sort') next[k] = v;
    for (const k of managedKeys) if (values[k]) next[k] = values[k];
    if (search?.value) next.search = search.value;
    if (sort && sort.value && sort.value !== defaultSort.current) next.sort = sort.value;
    const same =
      Object.keys(next).length === Object.keys(router.query).length &&
      Object.entries(next).every(([k, v]) => String(router.query[k]) === String(v));
    if (!same) router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true, scroll: false });
  }, [values, search?.value, sort?.value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Raccourci « / » : place le curseur dans la recherche
  useEffect(() => {
    if (!search) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== '/' || el?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [search]);

  // Vues enregistrées (propres à cet appareil et à cette liste)
  const viewsKey = `edoto-admin-views:${router.pathname}`;
  const [views, setViews] = useState<SavedView[]>([]);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  useEffect(() => {
    try {
      setViews(JSON.parse(localStorage.getItem(viewsKey) || '[]'));
    } catch {
      setViews([]);
    }
  }, [viewsKey]);
  const persistViews = (list: SavedView[]) => {
    setViews(list);
    try { localStorage.setItem(viewsKey, JSON.stringify(list)); } catch { /* stockage indisponible */ }
  };
  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    const current: FilterValues = {};
    for (const k of managedKeys) if (values[k]) current[k] = values[k];
    persistViews([...views.filter((v) => v.name !== name), { name, values: current, search: search?.value ?? '', sort: sort?.value ?? '' }]);
    setViewName('');
  };
  const applyView = (v: SavedView) => {
    const patch: FilterValues = {};
    for (const k of managedKeys) patch[k] = v.values[k] ?? '';
    onChange(patch);
    if (search) search.onChange(v.search);
    if (sort && v.sort) sort.onChange(v.sort);
    setViewsOpen(false);
  };

  useEffect(() => setSearchLocal(search?.value ?? ''), [search?.value]);
  useEffect(() => {
    if (!search || searchLocal === search.value) return;
    const tm = setTimeout(() => search.onChange(searchLocal.trim()), 400);
    return () => clearTimeout(tm);
  }, [searchLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtres actifs affichés en pastilles (avec libellé lisible)
  const active = useMemo(() => {
    const out: { id: string; label: string; clear: FilterValues }[] = [];
    for (const f of filters) {
      if (f.type === 'chips' || f.type === 'select') {
        const v = values[f.key];
        if (!v) continue;
        const opt = f.options.find((o) => o.value === v);
        out.push({ id: f.key, label: `${f.label} : ${opt?.label ?? v}`, clear: { [f.key]: '' } });
      } else if (f.type === 'range') {
        const a = values[f.minKey];
        const b = values[f.maxKey];
        if (!a && !b) continue;
        const u = f.unit ? ` ${f.unit}` : '';
        const label = a && b ? `${fmt(+a)} à ${fmt(+b)}${u}` : a ? `≥ ${fmt(+a)}${u}` : `≤ ${fmt(+b)}${u}`;
        out.push({ id: f.key, label: `${f.label} : ${label}`, clear: { [f.minKey]: '', [f.maxKey]: '' } });
      } else if (f.type === 'dates') {
        const a = values[f.fromKey];
        const b = values[f.toKey];
        if (!a && !b) continue;
        const d = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        const label = a && b ? `${d(a)} → ${d(b)}` : a ? `depuis le ${d(a)}` : `jusqu'au ${d(b)}`;
        out.push({ id: f.key, label: `${f.label} : ${label}`, clear: { [f.fromKey]: '', [f.toKey]: '' } });
      }
    }
    return out;
  }, [filters, values]);

  const hasAny = active.length > 0 || (quick && values[quick.key]) || (search && search.value);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border-200 bg-white">
      {/* Ligne principale : recherche, tri, bouton filtres */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
        {search && (
          <label className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body"><SearchIcon /></span>
            <input
              ref={searchRef}
              type="search"
              title="Raccourci : touche /"
              value={searchLocal}
              onChange={(e) => setSearchLocal(e.target.value)}
              placeholder={search.placeholder}
              aria-label={search.placeholder}
              className="w-full rounded-2xl border border-border-200 bg-gray-50/60 py-3 pe-4 ps-11 text-sm text-heading transition placeholder:text-body/70 focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {sort && (
            <label className="relative flex-1 sm:flex-none">
              <span className="sr-only">Trier</span>
              <select
                value={sort.value}
                onChange={(e) => sort.onChange(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-border-200 bg-white py-3 pe-10 ps-4 text-sm font-medium text-heading transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 sm:w-56"
              >
                {sort.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-body" fill="currentColor" aria-hidden>
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
              </svg>
            </label>
          )}
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                open || active.length
                  ? 'border-heading bg-heading text-white shadow-sm'
                  : 'border-border-200 bg-white text-heading hover:border-heading',
              )}
            >
              <SlidersIcon />
              Filtres
              {active.length > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1.5 text-[11px] font-bold text-heading">{active.length}</span>
              )}
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setViewsOpen((v) => !v)}
              aria-expanded={viewsOpen}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-border-200 bg-white px-4 py-3 text-sm font-semibold text-heading transition hover:border-heading"
              title="Vues enregistrées"
            >
              Vues
              {views.length > 0 && <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-gray-100 px-1.5 text-[11px] font-bold text-heading">{views.length}</span>}
            </button>
            {viewsOpen && (
              <div className="absolute end-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border-200 bg-white p-3 shadow-xl">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-body">Vues enregistrées</p>
                {views.length === 0 && <p className="mb-2 text-sm text-body">Aucune vue pour cette liste.</p>}
                <ul className="mb-3 max-h-56 space-y-1 overflow-y-auto">
                  {views.map((v) => (
                    <li key={v.name} className="flex items-center gap-2">
                      <button type="button" onClick={() => applyView(v)} className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-start text-sm text-heading hover:bg-gray-50">
                        {v.name}
                      </button>
                      <button type="button" onClick={() => persistViews(views.filter((x) => x.name !== v.name))} className="rounded-lg p-1.5 text-body hover:bg-gray-50 hover:text-heading" aria-label={`Supprimer la vue ${v.name}`}>
                        <CloseIcon />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 border-t border-border-100 pt-3">
                  <input
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value.slice(0, 40))}
                    onKeyDown={(e) => e.key === 'Enter' && saveView()}
                    placeholder="Nom de la vue actuelle"
                    className="min-w-0 flex-1 rounded-xl border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <button type="button" onClick={saveView} disabled={!viewName.trim()} className="rounded-xl bg-heading px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
          {actions}
        </div>
      </div>

      {/* Onglets rapides avec compteurs réels */}
      {quick && (
        <div className="flex gap-2 overflow-x-auto border-t border-border-100 px-4 py-3 sm:px-5 [scrollbar-width:none]">
          {[{ value: '', label: quick.allLabel, count: quick.allCount }, ...quick.options].map((o) => {
            const on = (values[quick.key] ?? '') === o.value;
            return (
              <button
                key={o.value || 'all'}
                type="button"
                onClick={() => onChange({ [quick.key]: o.value })}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition',
                  on ? 'bg-accent text-white shadow-sm' : 'bg-gray-100/80 text-heading hover:bg-gray-200/70',
                )}
              >
                {o.label}
                {o.count != null && (
                  <span className={cn('rounded-full px-1.5 text-[11px] font-semibold tabular-nums', on ? 'bg-white/25 text-white' : 'bg-white text-body')}>{fmt(o.count)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Panneau des filtres avancés */}
      {open && filters.length > 0 && (
        <div className="grid gap-6 border-t border-border-100 bg-gradient-to-b from-gray-50/70 to-white p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
          {filters.map((f) => (
            <div key={f.key} className="min-w-0">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-body">{f.label}</p>
              {f.type === 'chips' && (
                <div className="flex flex-wrap gap-2">
                  {f.options.filter((o) => !f.hideEmpty || (o.count ?? 0) > 0 || values[f.key] === o.value).map((o) => {
                    const on = values[f.key] === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange({ [f.key]: on ? '' : o.value })}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] transition',
                          on ? 'border-accent bg-accent/10 font-semibold text-accent' : 'border-border-200 bg-white text-heading hover:border-heading/40',
                        )}
                      >
                        {o.label}
                        {o.count != null && <span className={cn('text-[11px] tabular-nums', on ? 'text-accent' : 'text-body')}>{fmt(o.count)}</span>}
                      </button>
                    );
                  })}
                  {f.options.length === 0 && <span className="text-sm text-body">Aucune valeur en base.</span>}
                </div>
              )}
              {f.type === 'select' && (
                <select
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange({ [f.key]: e.target.value })}
                  className="w-full rounded-xl border border-border-200 bg-white px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                >
                  <option value="">{f.placeholder ?? 'Tous'}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}{o.count != null ? ` (${fmt(o.count)})` : ''}</option>
                  ))}
                </select>
              )}
              {f.type === 'range' && (
                <div>
                  <div className="flex items-center gap-2">
                    <DebouncedNumber value={values[f.minKey] ?? ''} onCommit={(v) => onChange({ [f.minKey]: v })} placeholder="Min" unit={f.unit} />
                    <span className="text-body">à</span>
                    <DebouncedNumber value={values[f.maxKey] ?? ''} onCommit={(v) => onChange({ [f.maxKey]: v })} placeholder="Max" unit={f.unit} />
                  </div>
                  {(f.minHint != null || f.maxHint != null) && (
                    <p className="mt-1.5 text-[11px] text-body">
                      En base : {f.minHint != null ? fmt(f.minHint) : 'aucune valeur'} à {f.maxHint != null ? fmt(f.maxHint) : 'aucune valeur'}{f.unit ? ` ${f.unit}` : ''}
                    </p>
                  )}
                </div>
              )}
              {f.type === 'dates' && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {datePresets().map((p) => {
                    const on = values[f.fromKey] === p.from && values[f.toKey] === p.to;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => onChange(on ? { [f.fromKey]: '', [f.toKey]: '' } : { [f.fromKey]: p.from, [f.toKey]: p.to })}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-[12px] transition',
                          on ? 'border-accent bg-accent/10 font-semibold text-accent' : 'border-border-200 bg-white text-heading hover:border-heading/40',
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {f.type === 'dates' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={values[f.fromKey] ?? ''}
                    max={values[f.toKey] || undefined}
                    onChange={(e) => onChange({ [f.fromKey]: e.target.value })}
                    className="min-w-0 flex-1 rounded-xl border border-border-200 bg-white px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
                    aria-label={`${f.label} : du`}
                  />
                  <span className="text-body">→</span>
                  <input
                    type="date"
                    value={values[f.toKey] ?? ''}
                    min={values[f.fromKey] || undefined}
                    onChange={(e) => onChange({ [f.toKey]: e.target.value })}
                    className="min-w-0 flex-1 rounded-xl border border-border-200 bg-white px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
                    aria-label={`${f.label} : au`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filtres actifs + résultat */}
      {(hasAny || resultLabel) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-100 px-4 py-3 sm:px-5">
          {resultLabel && <span className="me-1 text-[13px] font-medium text-heading">{resultLabel}</span>}
          {active.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.clear)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 py-1 pe-2 ps-3 text-[12px] font-medium text-accent transition hover:bg-accent/10"
              title="Retirer ce filtre"
            >
              {a.label}
              <span className="grid h-4 w-4 place-items-center rounded-full bg-accent/15 transition group-hover:bg-accent group-hover:text-white"><CloseIcon className="h-2.5 w-2.5" /></span>
            </button>
          ))}
          {hasAny && (
            <button type="button" onClick={onReset} className="ms-auto text-[12px] font-semibold text-body underline-offset-4 hover:text-heading hover:underline">
              Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
