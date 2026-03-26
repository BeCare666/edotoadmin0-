"use client";
import { useState } from "react";

export function ToggleButton() {
    const [active, setActive] = useState(true);

    return (
        <button
            onClick={() => setActive(active)}
            className={` flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-all duration-300 ${active
                ? "text-green-500  scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
        >
            {/* Icône power */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v9m0 9a9 9 0 100-18 9 9 0 000 18z"
                />
            </svg>
            {/* Texte caché sur mobile */}
            <span className="hidden sm:inline">{active ? "Actif" : "Inactif"}</span>
        </button>
    );
}
