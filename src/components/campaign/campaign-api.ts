import { getAuthCredentials } from '@/utils/auth-utils';
import { askStepUp, STEP_UP_REQUIRED, stepUpToken } from '@/utils/step-up-store';

export const API = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

export type CampaignStatus = 'a_venir' | 'en_cours' | 'terminee';

export const STATUS_BADGE: Record<CampaignStatus, { label: string; className: string }> = {
  a_venir: { label: 'À venir', className: 'bg-yellow-100 text-yellow-800' },
  en_cours: { label: 'En cours', className: 'bg-green-100 text-green-800' },
  terminee: { label: 'Terminée', className: 'bg-gray-200 text-gray-700' },
};

// Mêmes noms que la liste du site client : une ville saisie ici doit correspondre
// à la ville choisie par le participant.
export const BENIN_CITIES = [
  'Abomey', 'Abomey-Calavi', 'Adjohoun', 'Adjarra', 'Agbangnizoun', 'Allada', 'Aplahoué', 'Avrankou',
  'Banikoara', 'Bantè', 'Bassila', 'Bembèrèkè', 'Bohicon', 'Bonou', 'Boukoumbé', 'Cotonou', 'Cobly',
  'Dangbo', 'Dassa-Zoumè', 'Dogbo', 'Djougou', 'Glazoué', 'Ifangni', 'Kalalé', 'Kandi', 'Kétou',
  'Klouékanmè', 'Kouandé', 'Lalo', 'Lokossa', 'Malanville', 'Matéri', 'Natitingou', 'Nikki', 'Ouèssè',
  'Ouidah', 'Parakou', 'Pobè', 'Porto-Novo', 'Pèrèrè', 'Sakété', 'Savalou', 'Savè', 'Sèmè-Kpodji',
  'Sinendé', 'Tanguiéta', 'Tchaourou', 'Toffo', 'Togba', 'Toucountouna', 'Toviklin', 'Za-Kpota', 'Zè',
  'Zogbodomey',
];

// Action sensible (audit 3.1, 29/10/2026) : si l'API redemande le code (403 STEP_UP_REQUIRED),
// la fenêtre de saisie s'ouvre puis la même requête est rejouée une fois avec l'en-tête X-Step-Up.
async function sendWithStepUp(path: string, init: RequestInit, json: boolean): Promise<Response> {
  const send = () => {
    const { token } = getAuthCredentials();
    const stepUp = stepUpToken();
    return fetch(`${API}/${path}`, {
      ...init,
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(stepUp ? { 'X-Step-Up': stepUp } : {}),
      },
    });
  };
  const res = await send();
  if (res.status !== 403) return res;
  const data = await res.clone().json().catch(() => ({}));
  if (data?.error !== STEP_UP_REQUIRED || !(await askStepUp())) return res;
  return send();
}

export async function apiCall(path: string, init: RequestInit = {}) {
  const res = await sendWithStepUp(path, init, true);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Erreur serveur',
    );
  }
  return data;
}

// Téléchargement d'un fichier Excel (route protégée : le jeton passe dans l'en-tête)
export async function downloadFile(path: string, fallbackName: string) {
  const res = await sendWithStepUp(path, {}, false);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Téléchargement impossible.');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = match?.[1] || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const fcfa = (n: number) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} FCFA`;

export const formatDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Non définie';
