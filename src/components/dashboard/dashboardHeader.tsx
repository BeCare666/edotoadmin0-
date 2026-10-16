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
      {/* Accueil : bloc papier, filet fin (refonte 16/10/2026) */}
      <div className={`relative overflow-hidden rounded-2xl border border-[#E9E5DF] bg-white p-6 sm:p-7 ${shop || showCreateShopCTA ? "lg:col-span-2" : "lg:col-span-3"}`}>
        <div className="relative flex items-center gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FBEEF3] text-[#C2185B]">
            {icon === "sun" ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A837A] first-letter:uppercase">{today}</p>
            <h1 className="edoto-serif mt-1 truncate text-2xl font-semibold tracking-tight text-[#1A1814] sm:text-[28px]">
              {greeting}, <span className="text-[#C2185B]">{userName}</span>
            </h1>
            <p className="mt-1 text-sm text-[#6B655D]">
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
          className="group flex items-center gap-4 rounded-2xl border border-[#E9E5DF] bg-white p-6 text-left transition duration-300 hover:border-[#D6D2CB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2185B]/30"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEEF3] text-[#C2185B]">
            <ShopIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="edoto-serif block text-lg text-[#1A1814]">
              {t("common:dashboard-seller-space")}
            </span>
            <span className="mt-0.5 block truncate text-sm text-[#6B655D]">
              {t("common:dashboard-seller-access", { name: shop.name })}
            </span>
          </span>
          <ChevronNavIcon className="h-4 w-4 shrink-0 text-[#8A837A] transition group-hover:translate-x-0.5 group-hover:text-[#C2185B]" />
        </button>
      ) : showCreateShopCTA ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E9E5DF] bg-white p-6">
          <div>
            <h3 className="edoto-serif text-lg text-[#1A1814]">
              {finalActionTitle}
            </h3>
            <p className="mt-1 text-sm text-[#6B655D]">
              {finalActionDescription}
            </p>
          </div>
          <button
            onClick={onActionClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1A1814] text-lg font-medium text-white transition hover:bg-[#3D3934]"
            aria-label={finalActionTitle}
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}
