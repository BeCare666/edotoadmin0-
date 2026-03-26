"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { getAuthCredentials, hasAccess, adminOnly } from "@/utils/auth-utils";
import { useMeQuery } from "@/data/user";

type Notif = {
    id?: number | string;
    type?: string;
    title_key?: string;
    message_key?: string;
    title?: string;
    message?: string;
    message_params?: any;
    is_read?: boolean | number;
    link?: string;
    created_at?: string;
};

function BellIcon({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    );
}

function NotificationModal({
    notif,
    onClose,
    resolveTitle,
    resolveMessage,
}: {
    notif: Notif | null;
    onClose: () => void;
    resolveTitle: (n: Notif) => string;
    resolveMessage: (n: Notif) => string;
}) {
    if (!notif) return null;

    return (
        // Utilisation de fixed + z-index très élevé pour s'assurer que ça dépasse tout
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none">
            {/* Fond sombre + blur */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade pointer-events-auto"
                onClick={onClose}
            />
            {/* Modal lui-même */}
            <div className="relative w-[95vw] max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-modal pointer-events-auto">
                <h3 className="text-lg font-semibold mb-2">
                    {resolveTitle(notif)}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {resolveMessage(notif)}
                </p>
                {notif.link && (
                    <a
                        href={notif.link}
                        className="text-sm font-medium text-blue-600 hover:underline"
                    >
                        Ouvrir le lien
                    </a>
                )}
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}


export default function NotificationsDropdown() {
    const { t } = useTranslation("common");
    const { t: tNotif } = useTranslation("notifications");
    const { data } = useMeQuery();

    const auth = getAuthCredentials?.();
    const permissions = auth?.permissions ?? [];
    const isAdmin = hasAccess(adminOnly, permissions);
    const userId = data?.id;

    const API = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || "").replace(/\/$/, "");

    const btnRef = useRef<HTMLButtonElement | null>(null);
    const dropRef = useRef<HTMLDivElement | null>(null);

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notif[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeNotif, setActiveNotif] = useState<Notif | null>(null);

    // 👇 Debug notifications
    useEffect(() => {
        console.log("NOTIFICATIONS =", notifications);
    }, [notifications]);

    // ---------- TRANSLATION RESOLVERS ----------
    const resolveTitle = (n: Notif) => {
        const p = n.message_params || {};

        if (n.title) return n.title;

        if (n.title_key) {
            switch (n.title_key) {
                case "SHOP_APPROVED_TITLE": return "B space approuvée";
                case "SHOP_DISAPPROVED_TITLE": return "B space désapprouvée";
                case "VENDOR_CREATED_TITLE": return "Nouvelle boutique créée";
                case "welcome": return "Bienvenue";
                case "order.confirmed": return "Commande confirmée";
                case "order.new": return "Nouvelle commande reçue";
                case "order.shipped": return "Commande expédiée";
                case "order.delivered": return "Commande livrée";
                case "order.cancelled": return "Commande annulée";
                case "order.cancelled.seller": return "Commande annulée";
                case "payment.failed": return "Paiement échoué";
                case "payment.refunded": return "Paiement remboursé";
                case "product.backinstock": return "Produit de retour en stock";
                case "product.review": return "Nouveau avis";
                case "promotion.new": return "Nouvelle promotion disponible";
                case "reminder.cart.abandoned": return "Panier abandonné";
                default: return n.title_key;
            }
        }
        return "";
    };

    const resolveMessage = (n: Notif) => {
        if (!n) return "";
        const p = n.message_params || {};
        if (n.message) return n.message;

        switch (n.message_key) {
            case "SHOP_APPROVED_MESSAGE": return `Votre boutique ${p.shop_name || ""} a été approuvée`;
            case "SHOP_DISAPPROVED_MESSAGE": return `Votre boutique ${p.shop_name || ""} a été désapprouvée`;
            case "VENDOR_CREATED_MESSAGE": return `Votre boutique ${p.shop_name || ""} a été créée`;
            case "welcome": return `Vous avez été ajouté à la boutique ${p.shopName || ""}`;
            case "order.confirmed": return `Votre commande ${p.orderId || ""} a été confirmée avec succès`;
            case "order.new": return `Vous avez reçu une nouvelle commande ${p.orderId || ""}`;
            case "order.shipped": return `Votre commande ${p.orderId || ""} a été expédiée`;
            case "order.delivered": return `Votre commande ${p.orderId || ""} a été livrée`;
            case "order.cancelled": return `Votre commande ${p.orderId || ""} a été annulée`;
            case "order.cancelled.seller": return `La commande ${p.orderId || ""} a été annulée par le client`;
            case "payment.failed": return `Le paiement pour la commande ${p.orderId || ""} a échoué`;
            case "payment.refunded": return `Le paiement pour la commande ${p.orderId || ""} a été remboursé`;
            case "product.backinstock": return `Le produit ${p.productName || ""} est de nouveau disponible`;
            case "product.review": return `Un nouvel avis a été publié pour le produit ${p.productName || ""}`;
            case "promotion.new": return `Profitez de la promotion : ${p.promo || ""}`;
            case "reminder.cart.abandoned": return `Vous avez ${p.count || 0} article(s) dans votre panier en attente`;
            default: return n.message_key || "";
        }
    };

    // ---------- FETCH ----------
    const loadNotifications = async () => {
        if (!API) return;
        setLoading(true);
        try {
            const endpoint = isAdmin
                ? `${API}/notifications`
                : `${API}/notifications/${userId}`;

            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${auth?.token}` },
                cache: "no-store",
            });

            const data = await res.json();
            //console.log("my notif", data)
            const arr = Array.isArray(data) ? data : data.data ?? [];
            setNotifications(arr);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    // ---------- CLICK OUTSIDE ----------
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropRef.current &&
                !dropRef.current.contains(e.target as Node) &&
                !btnRef.current?.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ---------- BADGE ----------
    const unreadCount = notifications.filter((n) => !n?.is_read).length;

    // ---------- MARK READ ----------
    const markRead = async (notif: Notif) => {
        if (!notif?.id) return;
        await fetch(`${API}/notifications/${notif.id}/mark-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth?.token}`,
            },
            body: JSON.stringify({ user_id: userId }),
        });
    };

    // ---------- CLICK NOTIF ----------
    const onNotifClick = async (n: Notif) => {
        await markRead(n);
        setActiveNotif(n);
        setNotifications((prev) =>
            prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x))
        );
    };

    return (
        <>
            <button
                ref={btnRef}
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
                <BellIcon className="w-5 h-5 text-gray-700" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
            flex items-center justify-center text-[10px] font-semibold
            rounded-full bg-red-500 text-white ring-2 ring-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    ref={dropRef}
                    className={clsx(
                        "z-[9999] animate-drop bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
                        "fixed top-14 right-2 left-2 w-auto max-h-[70vh]",
                        "md:absolute md:left-auto md:right-[8vh] md:top-full md:mt-2 md:w-[380px] md:max-h-[520px]"
                    )}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <span className="text-sm font-semibold">
                            {t("text-notifications")}
                        </span>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-gray-400 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>

                    <div className="overflow-y-auto divide-y">
                        {loading && (
                            <p className="p-4 text-sm text-center text-gray-500">
                                Chargement…
                            </p>
                        )}

                        {!loading && notifications.length === 0 && (
                            <p className="p-4 text-sm text-center text-gray-400">
                                Aucune notification
                            </p>
                        )}

                        {!loading &&
                            notifications.map((n) => {
                                const unread = !n.is_read;
                                {/**onClick={() => onNotifClick(n)}**/ }
                                return (
                                    <div
                                        key={n.id}

                                        className={clsx(
                                            "p-4 cursor-pointer transition",
                                            unread
                                                ? "bg-blue-50 hover:bg-blue-100"
                                                : "hover:bg-gray-50"
                                        )}
                                    >
                                        <p className="text-sm font-medium truncate">
                                            {resolveTitle(n)}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {resolveMessage(n)}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {n.created_at &&
                                                new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            <NotificationModal
                notif={activeNotif}
                onClose={() => setActiveNotif(null)}
                resolveTitle={resolveTitle}
                resolveMessage={resolveMessage}
            />

            <style jsx global>{`
        @keyframes drop {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-drop {
          animation: drop 0.2s ease-out forwards;
          transform-origin: top right;
        }

        @keyframes modal {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal {
          animation: modal 0.18s ease-out forwards;
        }

        @keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade {
          animation: fade 0.18s ease-out forwards;
        }
      `}</style>
        </>
    );
}
