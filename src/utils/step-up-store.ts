/**
 * Actions sensibles (audit sécurité 3.1, 29/10/2026) : autorisation de 5 min obtenue avec le code de double
 * authentification, gardée en mémoire seulement (jamais dans un cookie ni dans localStorage).
 * Le composant StepUpPrompt (monté dans _app) s'enregistre pour demander le code quand l'API répond
 * 403 STEP_UP_REQUIRED ; http-client rejoue alors la requête avec l'en-tête X-Step-Up.
 */
let current: { token: string; exp: number } | null = null;
let prompt: (() => Promise<boolean>) | null = null;

export const STEP_UP_REQUIRED = 'STEP_UP_REQUIRED';

export function stepUpToken(): string | null {
  return current && current.exp > Date.now() + 5000 ? current.token : null;
}

export function saveStepUp(token: string, expiresAt: string) {
  current = { token, exp: new Date(expiresAt).getTime() };
}

export function registerStepUpPrompt(fn: (() => Promise<boolean>) | null) {
  prompt = fn;
}

export function askStepUp(): Promise<boolean> {
  return prompt ? prompt() : Promise.resolve(false);
}
