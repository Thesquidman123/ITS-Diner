export default function LogoBadge({ size = 64, className = '' }) {
  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 200 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ITS Diner"
    >
      {/* ── Outer shield ── */}
      <path
        d="M15,38 Q14,18 34,16 L166,16 Q186,18 185,38 L188,148 Q190,182 100,210 Q10,182 12,148 Z"
        fill="#1a1a1a"
      />
      {/* ── Inner shield yellow fill ── */}
      <path
        d="M22,40 Q21,24 38,22 L162,22 Q179,24 178,40 L181,148 Q182,178 100,204 Q18,178 19,148 Z"
        fill="#F5B800"
      />
      {/* ── Thin white inner border ── */}
      <path
        d="M28,42 Q27,28 42,27 L158,27 Q173,28 172,42 L175,148 Q176,174 100,198 Q24,174 25,148 Z"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />

      {/* ── 8-pointed star at top ── */}
      <g transform="translate(100, 8)">
        <polygon points="0,-10 2,-3 9,-3 4,1 6,8 0,4 -6,8 -4,1 -9,-3 -2,-3" fill="#1a1a1a" />
        <polygon points="0,-7 1.5,-2 6,-2 2.5,1 4,6 0,3 -4,6 -2.5,1 -6,-2 -1.5,-2" fill="#F5B800" />
      </g>

      {/* ── Speed lines left of ITS ── */}
      <g stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
        <line x1="26" y1="65" x2="38" y2="65" />
        <line x1="24" y1="72" x2="38" y2="72" />
        <line x1="26" y1="79" x2="38" y2="79" />
      </g>
      {/* ── Speed lines right of ITS ── */}
      <g stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
        <line x1="162" y1="65" x2="174" y2="65" />
        <line x1="162" y1="72" x2="176" y2="72" />
        <line x1="162" y1="79" x2="174" y2="79" />
      </g>

      {/* ── ITS text ── */}
      <text
        x="100"
        y="110"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="72"
        fill="white"
        stroke="white"
        strokeWidth="6"
        strokeLinejoin="round"
        paintOrder="stroke"
      >ITS</text>
      <text
        x="100"
        y="110"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="72"
        fill="#1a1a1a"
      >ITS</text>

      {/* ── Black ribbon banner ── */}
      <rect x="12" y="118" width="176" height="46" rx="6" fill="#1a1a1a" />
      {/* Banner left tab */}
      <polygon points="12,118 0,128 0,152 12,164" fill="#1a1a1a" />
      {/* Banner right tab */}
      <polygon points="188,118 200,128 200,152 188,164" fill="#1a1a1a" />

      {/* ── Speed lines on ribbon ── */}
      <g stroke="#F5B800" strokeWidth="1.5" strokeLinecap="round">
        <line x1="18" y1="130" x2="30" y2="130" />
        <line x1="16" y1="136" x2="30" y2="136" />
        <line x1="18" y1="142" x2="30" y2="142" />
      </g>
      <g stroke="#F5B800" strokeWidth="1.5" strokeLinecap="round">
        <line x1="170" y1="130" x2="182" y2="130" />
        <line x1="170" y1="136" x2="184" y2="136" />
        <line x1="170" y1="142" x2="182" y2="142" />
      </g>

      {/* ── Diner script text ── */}
      <text
        x="100"
        y="153"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize="34"
        fill="#F5B800"
        stroke="#F5B800"
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
      >Diner</text>
      <text
        x="100"
        y="153"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize="34"
        fill="#FFF5D0"
      >Diner</text>

      {/* ── Crossed wrenches at bottom ── */}
      <g transform="translate(100,185) scale(0.55)" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round">
        {/* Wrench 1 */}
        <line x1="-28" y1="-18" x2="20" y2="22" />
        <circle cx="-28" cy="-18" r="8" fill="#1a1a1a" />
        <circle cx="-28" cy="-18" r="4" fill="#F5B800" />
        <circle cx="20" cy="22" r="6" fill="#1a1a1a" />
        <circle cx="20" cy="22" r="3" fill="#F5B800" />
        {/* Wrench 2 */}
        <line x1="28" y1="-18" x2="-20" y2="22" />
        <circle cx="28" cy="-18" r="8" fill="#1a1a1a" />
        <circle cx="28" cy="-18" r="4" fill="#F5B800" />
        <circle cx="-20" cy="22" r="6" fill="#1a1a1a" />
        <circle cx="-20" cy="22" r="3" fill="#F5B800" />
      </g>
    </svg>
  );
}
