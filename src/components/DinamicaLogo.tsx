import React from 'react';

interface DinamicaLogoProps {
  className?: string;
}

/**
 * Isotipo corporativo — Grupo Empresarial Dinámica S.A.S.
 * Monograma "D" en blanco sobre grafito institucional con pilar rojo corporativo.
 */
export const DinamicaLogo: React.FC<DinamicaLogoProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Isotipo Grupo Empresarial Dinámica S.A.S."
    >
      <rect x="1" y="1" width="46" height="46" rx="11" fill="#2B2B2C" />
      <rect x="9" y="10" width="5.5" height="28" rx="2" fill="#E52427" />
      <text
        x="30"
        y="33"
        textAnchor="middle"
        fontSize="25"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        D
      </text>
      <rect x="9" y="10" width="5.5" height="28" rx="2" fill="none" stroke="#ffffff" strokeOpacity="0.15" />
    </svg>
  );
};
