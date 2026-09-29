import { useState } from 'react';

// G2 : code de retrait visible par l'admin, masqué par défaut (décision du 25/09/2026).
// L'API ne l'envoie en clair qu'à l'admin et au client propriétaire de la commande.
export function otpState(order: { otp_code?: string | null; otp_used?: any; otp_expires_at?: string | null; delivered_at?: string | null; order_status?: string }) {
  if (!order?.otp_code) return { key: 'none', label: 'Aucun code', className: 'bg-gray-100 text-gray-600' };
  if (Number(order.otp_used) === 1 || order.delivered_at || order.order_status === 'order-completed') {
    return { key: 'used', label: 'Utilisé', className: 'bg-emerald-50 text-emerald-700' };
  }
  if (order.otp_expires_at && new Date(order.otp_expires_at).getTime() < Date.now()) {
    return { key: 'expired', label: 'Expiré', className: 'bg-red-50 text-red-700' };
  }
  return { key: 'active', label: 'Actif', className: 'bg-amber-50 text-amber-800' };
}

export default function OtpReveal({ code, compact = false }: { code?: string | null; compact?: boolean }) {
  const [shown, setShown] = useState(false);
  if (!code) return <span className="text-sm text-body">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`font-mono tracking-[0.3em] text-heading ${compact ? 'text-sm' : 'text-lg'}`} aria-live="polite">
        {shown ? code : '••••••'}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShown((v) => !v);
        }}
        className="rounded-full border border-border-200 px-2.5 py-0.5 text-xs font-medium text-heading transition hover:border-accent hover:text-accent"
        aria-label={shown ? 'Masquer le code' : 'Afficher le code'}
      >
        {shown ? 'Masquer' : 'Afficher'}
      </button>
    </span>
  );
}
