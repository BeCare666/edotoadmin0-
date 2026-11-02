import { useEffect, useState } from 'react';
import cn from 'classnames';

export const initials = (n?: string | null) =>
  String(n || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

// Adresse de la photo, quelle que soit la forme renvoyée par GET /me (même règle que le site)
export function avatarUrl(user: any): string | null {
  const a = user?.profile?.avatar;
  if (!a) return null;
  if (typeof a === 'string') return a;
  return a.url || a.original || a.thumbnail || null;
}

/**
 * Avatar unique du compte connecté (02/11/2026) : en-tête, menu du compte et barre latérale.
 * Photo de profil ; sans photo ou si elle ne se charge pas : initiales sur fond encre (identique au site).
 */
export default function UserAvatar({
  user,
  size = 40,
  className,
}: {
  user: any;
  size?: number;
  className?: string;
}) {
  const url = avatarUrl(user);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const box = { width: size, height: size };

  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={box} onError={() => setFailed(true)} className={cn('shrink-0 rounded-full object-cover', className)} />;
  }
  return (
    <span
      style={{ ...box, fontSize: Math.max(11, Math.round(size / 3)) }}
      title={user?.name || undefined}
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-[#1A1814] font-semibold text-white', className)}
    >
      {initials(user?.name)}
    </span>
  );
}
