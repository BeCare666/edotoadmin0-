import { useEffect } from 'react';

// Éléments communs des écrans « Téléconsultation » de l'admin (19/10/2026), au style de la refonte du 16/10 :
// fond ivoire, encre, filets fins, rose en touche.
export const inputClass =
  'w-full rounded-xl border border-[#E9E5DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1814] outline-none transition focus:border-[#1A1814]';

export const TZ = 'Africa/Porto-Novo';
export const when = (iso?: string | null, withTime = true) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        timeZone: TZ,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : 'Non renseignée';

export function PageHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-body">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES: Record<string, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  wait: 'border-amber-200 bg-amber-50 text-amber-900',
  stop: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-[#F3CADB] bg-[#FBEEF3] text-[#A0124A]',
  neutral: 'border-[#E9E5DF] bg-[#F9F8F6] text-[#57524B]',
};
export function Pill({ tone = 'neutral', children }: { tone?: keyof typeof TONES | string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone] ?? TONES.neutral}`}>{children}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#E9E5DF] bg-white p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8A837A]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#1A1814]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#57524B]">{hint}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1A1814]/35 p-4 sm:items-center" onClick={onClose}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white p-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl text-[#1A1814]">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full border border-[#E9E5DF] text-[#57524B] hover:border-[#1A1814]">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#1A1814]">{label}</span>
      {hint && <span className="ms-1 text-xs text-[#8A837A]">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function Pager({ page, last, total, onPage, unit }: { page: number; last: number; total: number; onPage: (p: number) => void; unit: string }) {
  if (last <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-[#E9E5DF] px-5 py-3 text-sm">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg px-3 py-1.5 text-heading disabled:opacity-30">Précédent</button>
      <span className="text-[#8A837A]">Page {page} sur {last} · {total} {unit}</span>
      <button disabled={page >= last} onClick={() => onPage(page + 1)} className="rounded-lg px-3 py-1.5 text-heading disabled:opacity-30">Suivant</button>
    </div>
  );
}
