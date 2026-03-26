// lib/auth.ts
export function hasAccess(adminOnly: boolean, permissions: string[] = []) {
    // Supposons que tu as un user dans localStorage / cookie ou ton provider auth
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.role === "admin") return true;

    if (adminOnly) return false;

    if (!permissions || permissions.length === 0) return true;

    return permissions.some((p) => user.permissions?.includes(p));
}
