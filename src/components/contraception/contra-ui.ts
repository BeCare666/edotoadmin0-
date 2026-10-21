// Contraception (21/10/2026) : les images par défaut sont servies par le site (/images/...),
// les images envoyées depuis l'admin ont une adresse complète (Cloudinary).
export const siteImage = (url?: string | null) =>
  !url ? null : url.startsWith('/') ? `${process.env.NEXT_PUBLIC_SHOP_URL || 'https://edotofamily.com'}${url}` : url;
