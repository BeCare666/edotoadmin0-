import React from 'react';
import EdotoAuthShell from '@/components/auth/edoto-auth-shell';

// Pages d'authentification de l'admin (inscription, mot de passe oublié, vérification…) :
// même cadre et même logo que la connexion et que le site (16/10/2026)
export default function AuthPageLayout({
  children,
}: React.PropsWithChildren<{}>) {
  return <EdotoAuthShell>{children}</EdotoAuthShell>;
}
