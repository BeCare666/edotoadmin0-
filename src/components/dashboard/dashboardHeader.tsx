// app/components/DashboardHeader.tsx
import { useMemo } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useMeQuery } from "@/data/user";

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
      return { greeting: t("common:dashboard-greeting-morning"), icon: "🌅" };
    if (hour < 18)
      return { greeting: t("common:dashboard-greeting-afternoon"), icon: "☀️" };
    if (hour < 22)
      return { greeting: t("common:dashboard-greeting-evening"), icon: "🌙" };

    return { greeting: t("common:dashboard-greeting-night"), icon: "🌑" };
  }, [t]);

  const finalActionTitle =
    actionTitle || t("common:dashboard-default-action-title");

  const finalActionDescription =
    actionDescription || t("common:dashboard-default-action-description");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Welcome card */}
      <div className="relative flex items-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-8 text-white shadow-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),transparent)]" />
        <div className="relative flex items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-4xl">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white/95">
              {greeting},{" "}
              <span className="font-bold text-white">{userName}</span>
            </h2>
            <p className="mt-1 text-sm text-white/70">
              {t("common:dashboard-welcome-back")}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      {shop ? (
        <div
          onClick={() => router.push(`/${shop.slug}`)}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/60 hover:shadow-elevated"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              🏪
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("common:dashboard-seller-space")}
              </h3>
              <p className="text-sm text-gray-500">
                {t("common:dashboard-seller-access", { name: shop.name })}
              </p>
            </div>
          </div>
        </div>
      ) : showCreateShopCTA ? (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200/60 hover:shadow-elevated">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {finalActionTitle}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {finalActionDescription}
            </p>
          </div>
          <button
            onClick={onActionClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-medium text-white shadow-card transition-all hover:shadow-elevated hover:scale-105"
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}
