// Tournées de retrait 09 h / 17 h (12/11/2026, rapports/PLAN_TOURNEES_RETRAIT.md, 3.2) :
// heure de la tournée calculée par l'API (available_at), affichée à l'heure du Bénin, pour savoir quoi préparer.
const TZ = 'Africa/Porto-Novo';

function parts(value: any) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString('fr-FR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short' });
  const p = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '00';
  return { day, hour: `${get('hour')} h ${get('minute')}` };
}

/** Cellule « Tournée » : jour et heure ; « annoncée disponible » une fois la notification envoyée */
export default function PickupRoundCell({ item }: { item: any }) {
  if (item?.delivery_type === 'CUSTOM') return <span className="text-xs text-body">Sans tournée</span>;
  const p = item?.available_at ? parts(item.available_at) : null;
  if (!p) return <span className="text-xs text-body">Non prévue</span>;
  const late = !item.available_notified_at && new Date(item.available_at).getTime() < Date.now();
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-heading">{p.hour}</span>
      <span className="text-xs text-body">{p.day}</span>
      {item.available_notified_at ? (
        <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Annoncée disponible</span>
      ) : late ? (
        <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Heure passée</span>
      ) : null}
    </div>
  );
}
