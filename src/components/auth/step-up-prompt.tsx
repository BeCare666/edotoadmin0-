import { useEffect, useRef, useState } from 'react';
import { HttpClient } from '@/data/client/http-client';
import { registerStepUpPrompt, saveStepUp } from '@/utils/step-up-store';

// Actions sensibles (audit sécurité 3.1, 29/10/2026) : fenêtre « confirmez avec votre code », ouverte
// quand l'API répond 403 STEP_UP_REQUIRED. Le code donne une autorisation de 5 min.
export default function StepUpPrompt() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    registerStepUpPrompt(
      () =>
        new Promise<boolean>((resolve) => {
          resolver.current = resolve;
          setCode('');
          setError(null);
          setOpen(true);
        }),
    );
    return () => registerStepUpPrompt(null);
  }, []);

  const close = (ok: boolean) => {
    setOpen(false);
    resolver.current?.(ok);
    resolver.current = null;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res: any = await HttpClient.post('me/totp/step-up', { code });
      saveStepUp(res.step_up, res.expires_at);
      close(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Code incorrect.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="step-up-title">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="step-up-title" className="mb-2 text-base font-semibold text-[#1A1814]">Action sensible</h2>
        <p className="mb-4 text-sm text-[#5C5650]">
          Confirmez avec le code à 6 chiffres de votre application d’authentification (ou un code de secours).
          Il reste valable 5 minutes pour vos actions suivantes.
        </p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          autoComplete="one-time-code"
          placeholder="123456"
          aria-label="Code de vérification"
          className="mb-4 h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]/20"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => close(false)} className="rounded-xl px-4 py-2 text-sm text-[#5C5650] hover:bg-gray-100">
            Annuler
          </button>
          <button type="submit" disabled={busy || !code.trim()} className="rounded-xl bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Vérification…' : 'Confirmer'}
          </button>
        </div>
      </form>
    </div>
  );
}
