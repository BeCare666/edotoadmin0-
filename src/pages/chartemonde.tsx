"use client";
import { useState } from "react";
import WorldMap from "../../public/world.svg"; // ton SVG du monde

// Exemple de données par pays
const salesData: Record<string, { orders: number; revenue: number }> = {
    FR: { orders: 120, revenue: 5000 },
    US: { orders: 80, revenue: 3500 },
    BJ: { orders: 60, revenue: 1500 },
    CN: { orders: 40, revenue: 2200 },
};

export default function SalesMap() {
    const [hovered, setHovered] = useState<string | null>(null);

    // Couleur dynamique selon le CA
    const getColor = (code: string) => {
        const revenue = salesData[code]?.revenue || 0;
        if (revenue === 0) return "#e5e7eb"; // gris clair (aucune vente)
        if (revenue < 1000) return "#93c5fd"; // bleu clair
        if (revenue < 3000) return "#3b82f6"; // bleu moyen
        return "#1e3a8a"; // bleu foncé
    };

    return (
        <div className="relative flex justify-center items-center w-full">
            {/* Carte */}
            <WorldMap
                className="w-full h-auto max-w-6xl"
                onMouseOver={(e: any) => setHovered(e.target.id)}
                onMouseOut={() => setHovered(null)}
            />

            {/* Tooltip dynamique */}
            {hovered && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
                    <p className="font-semibold">Pays : {hovered}</p>
                    <p>Commandes : {salesData[hovered]?.orders || 0}</p>
                    <p>CA : {salesData[hovered]?.revenue || 0} €</p>
                </div>
            )}

            {/* Style global appliqué aux pays */}
            <style jsx global>{`
        svg path {
          stroke: #374151;
          stroke-width: 0.5;
          transition: fill 0.3s ease, transform 0.2s ease;
        }
        svg path:hover {
          transform: scale(1.03);
          stroke: #111827;
          stroke-width: 1;
        }
        ${Object.keys(salesData)
                    .map((code) => `#${code} { fill: ${getColor(code)}; }`)
                    .join("\n")}
      `}</style>
        </div>
    );
}
