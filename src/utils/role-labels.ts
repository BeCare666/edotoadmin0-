// Noms des rôles (B8, 30/10/2026) : les rôles réels de users.role (API src/auth/roles.decorator.ts).
// Un rôle inconnu s'affiche tel quel plutôt que d'être masqué.
const ROLES: Record<string, { one: string; many: string }> = {
  super_admin: { one: 'Super admin', many: 'Administrateurs' },
  customer: { one: 'Client', many: 'Clients' },
  super_pickuppoint: { one: 'Point de retrait', many: 'Points de retrait' },
  sponsor: { one: 'Sponsor', many: 'Sponsors' },
  doctor: { one: 'Médecin', many: 'Médecins' },
  health_center: { one: 'Centre de santé', many: 'Centres de santé' },
  store_owner: { one: 'Vendeur', many: 'Vendeurs' },
  staff: { one: 'Personnel boutique', many: 'Personnel' },
};

export const roleName = (role?: string | null) => (role ? ROLES[role]?.one ?? role : '');
export const rolePlural = (role?: string | null) => (role ? ROLES[role]?.many ?? role : '');
