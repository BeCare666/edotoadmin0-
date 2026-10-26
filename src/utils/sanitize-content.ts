import { useEffect, useState } from 'react';
import { safeHtml } from '@/utils/safe-html';

// Audit sécurité 1.6 (H1, 26/10/2026) : liste réduite commune (img, iframe, style et class retirés).
export function useSanitizeContent({ description }: { description: string }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!description) {
    return;
  }
  const cleanDescription = safeHtml(description);

  return isClient ? cleanDescription : '';
}
