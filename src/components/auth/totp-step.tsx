import { useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { HttpClient } from '@/data/client/http-client';
import { authButtonClass, authInputClass, authLinkClass } from '@/components/auth/edoto-auth-shell';

// Double authentification (audit sécurité 3.1, 29/10/2026) : étape 2 de la connexion.
// Activation obligatoire : code QR à scanner, premier code, puis codes de secours montrés une seule fois.
type Challenge = { challenge: string; setup_required: boolean };
type Setup = { secret: string; qr_image: string };

function apiError(e: any): string {
  return e?.response?.data?.message || e?.message || 'Une erreur est survenue. Réessayez.';
}

export default function TotpStep({
  challenge,
  onSession,
  onCancel,
}: {
  challenge: Challenge;
  onSession: (session: any) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [recovery, setRecovery] = useState<{ codes: string[]; session: any } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!challenge.setup_required) return;
    HttpClient.post<Setup>('token/totp/setup', { challenge: challenge.challenge })
      .then(setSetup)
      .catch((e) => setError(apiError(e)));
  }, [challenge]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (challenge.setup_required) {
        const res: any = await HttpClient.post('token/totp/activate', { challenge: challenge.challenge, code });
        const { recovery_codes, ...session } = res;
        setRecovery({ codes: recovery_codes ?? [], session });
      } else {
        onSession(await HttpClient.post('token/totp', { challenge: challenge.challenge, code }));
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (recovery) {
    return (
      <div>
        <h3 className="mb-2 text-base font-semibold text-[#1A1814]">Vos codes de secours</h3>
        <p className="mb-4 text-sm text-[#5C5650]">
          Chaque code permet une seule connexion si vous n’avez plus votre téléphone. Notez-les et gardez-les en lieu sûr :
          ils ne seront plus jamais affichés.
        </p>
        <ul className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[#E9E5DF] bg-[#F9F8F6] p-4 font-mono text-sm">
          {recovery.codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <label className="mb-5 flex items-center gap-2 text-sm text-[#3D3934]">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          J’ai noté mes codes de secours
        </label>
        <Button className={authButtonClass} disabled={!saved} onClick={() => onSession(recovery.session)}>
          Continuer
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <Alert message={error} variant="error" closeable className="mb-5" onClose={() => setError(null)} />}
      {challenge.setup_required ? (
        <div className="mb-5 text-sm text-[#5C5650]">
          <p className="mb-3">
            La double authentification est obligatoire pour ce compte. Scannez ce code avec une application
            d’authentification (Google Authenticator, Microsoft Authenticator, Authy…), puis saisissez le code à 6 chiffres affiché.
          </p>
          {setup ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr_image} alt="Code QR de la double authentification" className="mx-auto mb-3 h-56 w-56" />
              <p className="text-center text-xs">
                Ou saisissez la clé : <span className="break-all font-mono">{setup.secret}</span>
              </p>
            </>
          ) : (
            <p className="text-center">Préparation du code QR…</p>
          )}
        </div>
      ) : (
        <p className="mb-5 text-sm text-[#5C5650]">
          Saisissez le code à 6 chiffres de votre application d’authentification, ou l’un de vos codes de secours.
        </p>
      )}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode={challenge.setup_required ? 'numeric' : 'text'}
        autoComplete="one-time-code"
        autoFocus
        placeholder="123456"
        className={`mb-5 w-full ${authInputClass}`}
        aria-label="Code de vérification"
      />
      <Button type="submit" className={authButtonClass} loading={busy} disabled={busy || !code.trim()}>
        Vérifier
      </Button>
      <button type="button" onClick={onCancel} className={`mt-4 block text-sm ${authLinkClass}`}>
        Revenir à la connexion
      </button>
    </form>
  );
}
