// components/NoDataFound.tsx
import React from "react";

export const NoDataFound: React.FC<React.SVGAttributes<{}>> = (props) => (
  <svg
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Fond gris clair */}
    <rect width="400" height="300" rx="12" fill="#f8f9fb" />

    {/* Illustration tableau vide */}
    <rect x="60" y="80" width="280" height="140" rx="8" fill="#fff" stroke="#e5e7eb" />
    <line x1="60" y1="120" x2="340" y2="120" stroke="#e5e7eb" />
    <line x1="60" y1="160" x2="340" y2="160" stroke="#e5e7eb" />
    <line x1="60" y1="200" x2="340" y2="200" stroke="#e5e7eb" />

    {/* Icône dossier vide */}
    <rect x="180" y="30" width="40" height="30" rx="4" fill="#cbd5e1" />
    <path d="M180 40h20l5 10h15v10h-40z" fill="#94a3b8" />

    {/* Texte placeholder */}
    <text
      x="200"
      y="260"
      textAnchor="middle"
      fontSize="14"
      fill="#6b7280"
      fontFamily="sans-serif"
    >
    </text>
  </svg>
);
