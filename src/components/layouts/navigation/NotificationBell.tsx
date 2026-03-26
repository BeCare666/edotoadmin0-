"use client";
import { useState } from "react";

export function NotificationBell() {
    const [openNotif, setOpenNotif] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Nouvelle commande reçue ✅" },
        { id: 2, text: "Un client a ajouté un produit 🛒" },
        { id: 3, text: "Mise à jour prévue demain ⚡" },
    ]);
    const unreadCount = notifications.length;

    const handleOpenNotif = () => {
        setOpenNotif(!openNotif);
        if (!openNotif) {
            setNotifications([]); // reset compteur
        }
    };

    return (
        <div className="relative">
            {/* Bouton cloche */}
            <button
                onClick={handleOpenNotif}
                className="relative flex items-center gap-2 rounded-full p-3 hover:bg-gray-100 transition"
            >
                {/* Icône cloche */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405M19 13V9a7 7 0 00-14 0v4l-1.405 1.405A2.032 2.032 0 014 17h16m-6 4a2 2 0 11-4 0"
                    />
                </svg>

                {/* Texte caché sur mobile */}
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    Notifications
                </span>

                {/* Badge rouge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 text-xs font-bold text-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panneau notifications */}
            {openNotif && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-xl ring-1 ring-gray-200 animate-fadeIn">
                    <div className="p-4 border-b font-semibold text-gray-700">
                        Notifications
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-gray-500 text-center">
                                ✅ Aucune nouvelle notification
                            </p>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className="p-4 text-sm text-gray-700 hover:bg-gray-50 transition"
                                >
                                    {notif.text}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
