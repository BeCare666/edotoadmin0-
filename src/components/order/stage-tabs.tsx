import Link from 'next/link';

// Onglets des 3 étapes de suivi admin (commandes ou demandes de kit), avec leur nombre réel
export type Stage = 'to_process' | 'processed' | 'withdrawn';

export default function StageTabs({
  active,
  counts,
  links,
  labels,
}: {
  active: Stage;
  counts?: Partial<Record<Stage, number>> | null;
  links: Record<Stage, string>;
  labels: Record<Stage, string>;
}) {
  const stages: Stage[] = ['to_process', 'processed', 'withdrawn'];
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border-200 bg-white p-1">
      {stages.map((s) => (
        <Link
          key={s}
          href={links[s]}
          className={`flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            active === s ? 'bg-heading text-white' : 'text-body hover:text-heading'
          }`}
        >
          {labels[s]}
          <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active === s ? 'bg-white/20' : 'bg-gray-100 text-body'}`}>
            {counts?.[s] ?? '…'}
          </span>
        </Link>
      ))}
    </div>
  );
}
