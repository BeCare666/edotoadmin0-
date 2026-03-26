import React from "react";

export const NoDataFound: React.FC<React.SVGAttributes<{}>> = (props) => (
  <svg
    viewBox="0 0 400 300"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="No data"
    {...props}
  >
    <defs>
      {/* Dégradé bleu marine */}
      <linearGradient id="marine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#002147" />
        <stop offset="100%" stopColor="#002699" />
      </linearGradient>
    </defs>

    {/* Cercle subtil en arrière-plan */}
    <circle
      cx="200"
      cy="140"
      r="80"
      fill="url(#marine)"
      opacity="0.08"
    />

    {/* Icône dossier stylisée */}
    <path
      d="M140 150 h120 a10 10 0 0 0 10 -10 v-40 a10 10 0 0 0 -10 -10 h-60 l-15 -15 h-45 a10 10 0 0 0 -10 10 v55 a10 10 0 0 0 10 10z"
      fill="none"
      stroke="url(#marine)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Deux traits horizontaux */}
    <line
      x1="155"
      y1="145"
      x2="245"
      y2="145"
      stroke="#002699"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="155"
      y1="160"
      x2="225"
      y2="160"
      stroke="#002699"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
