// app/components/DashboardHeader.tsx
import { useMemo } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useMeQuery } from "@/data/user";
import {
  ChevronNavIcon,
  MoonIcon,
  ShopIcon,
  SunIcon,
} from "@/components/icons/edoto-nav-icons";

interface DashboardHeaderProps {
  actionTitle?: string;
  actionDescription?: string;
  onActionClick?: () => void;
  /** Masquer la carte CTA quand l'utilisateur n'a pas de shop */
  showCreateShopCTA?: boolean;
}

export default function DashboardHeader({
  actionTitle,
  actionDescription,
  onActionClick,
  showCreateShopCTA = true,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  const { data } = useMeQuery();
  const userName = data?.name || t("common:dashboard-user-fallback");
  const shop = data?.shops?.[0];

  const { greeting, icon } = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12)
      return { greeting: t("common:dashboard-greeting-morning"), icon: "sun" };
    if (hour < 18)
      return { greeting: t("common:dashboard-greeting-afternoon"), icon: "sun" };
    if (hour < 22)
      return { greeting: t("common:dashboard-greeting-evening"), icon: "moon" };

    return { greeting: t("common:dashboard-greeting-night"), icon: "moon" };
  }, [t]);

  const finalActionTitle =
    actionTitle || t("common:dashboard-default-action-title");

  const finalActionDescription =
    actionDescription || t("common:dashboard-default-action-description");

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Porto-Novo",
  }).format(new Date());

  return (
    <div className="edoto-stagger grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Accueil : bloc sombre aux couleurs de la barre latérale */}
      <div className={`relative overflow-hidden rounded-3xl bg-[#1F1B16] p-6 text-white shadow-[0_18px_40px_-16px_rgba(31,27,22,0.45)] sm:p-7 ${shop || showCreateShopCTA ? "lg:col-span-2" : "lg:col-span-3"}`}>
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FF6EA9]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#C2185B]/10 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#FF6EA9] ring-1 ring-white/10">
            {icon === "sun" ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#B8AC9E] first-letter:uppercase">{today}</p>
            <h1 className="edoto-serif mt-1 truncate text-2xl tracking-tight text-white sm:text-3xl">
              {greeting}, <span className="text-[#FF6EA9]">{userName}</span>
            </h1>
            <p className="mt-1 text-sm text-[#D8CFC3]">
              {t("common:dashboard-welcome-back")}
            </p>
          </div>
        </div>
      </div>

      {/* Accès boutique */}
      {shop ? (
        <button
          type="button"
          onClick={() => router.push(`/${shop.slug}`)}
          className="group flex items-center gap-4 rounded-3xl border border-[#EDE6DC] bg-white/90 p-6 text-left shadow-[0_1px_2px_rgba(60,40,20,0.04),0_12px_32px_-18px_rgba(60,40,20,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(60,40,20,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6EA9]/40"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCE8F0] text-[#C2185B]">
            <ShopIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="edoto-serif block text-lg text-[#1F1B16]">
              {t("common:dashboard-seller-space")}
            </span>
            <span className="mt-0.5 block truncate text-sm text-[#7A6E62]">
              {t("common:dashboard-seller-access", { name: shop.name })}
            </span>
          </span>
          <ChevronNavIcon className="h-4 w-4 shrink-0 text-[#9A8E80] transition group-hover:translate-x-0.5 group-hover:text-[#C2185B]" />
        </button>
      ) : showCreateShopCTA ? (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-[#EDE6DC] bg-white/90 p-6 shadow-[0_1px_2px_rgba(60,40,20,0.04),0_12px_32px_-18px_rgba(60,40,20,0.18)]">
          <div>
            <h3 className="edoto-serif text-lg text-[#1F1B16]">
              {finalActionTitle}
            </h3>
            <p className="mt-1 text-sm text-[#7A6E62]">
              {finalActionDescription}
            </p>
          </div>
          <button
            onClick={onActionClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1F1B16] text-lg font-medium text-white transition hover:bg-[#3B342D]"
            aria-label={finalActionTitle}
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}
