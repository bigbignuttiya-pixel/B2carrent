// One standard board with its nested parts (SVG, centimetres). Used on screen and in the printed cut sheet.
const PALETTE = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa', '#a5f3fc', '#f5d0fe', '#d9f99d', '#e7e5e4'];

export default function SheetLayout({ sheet, W, H, className = 'w-full h-auto' }) {
  const pad = 6;
  return (
    <svg viewBox={`${-pad} ${-pad} ${W + pad * 2} ${H + pad * 2}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x={0} y={0} width={W} height={H} fill="#fafaf9" stroke="#57534e" strokeWidth={0.6} />
      <defs>
        <pattern id="waste" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#d6d3d1" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#waste)" />
      {sheet.placed.map((p) => {
        const fs = Math.max(2.2, Math.min(6, Math.min(p.pw, p.ph) * 0.28));
        const showSize = Math.min(p.pw, p.ph) > fs * 2.6;
        return (
          <g key={p.id}>
            <rect x={p.x} y={p.y} width={p.pw} height={p.ph} fill={PALETTE[(p.row - 1) % PALETTE.length]} stroke="#44403c" strokeWidth={0.35} />
            <text x={p.x + p.pw / 2} y={p.y + p.ph / 2 - (showSize ? fs * 0.45 : 0)} fontSize={fs} textAnchor="middle" dominantBaseline="central" fill="#1c1917" fontWeight="600" style={{ fontFamily: 'Prompt, sans-serif' }}>
              #{p.label}
            </text>
            {showSize && (
              <text x={p.x + p.pw / 2} y={p.y + p.ph / 2 + fs * 0.75} fontSize={fs * 0.72} textAnchor="middle" dominantBaseline="central" fill="#44403c" style={{ fontFamily: 'Prompt, sans-serif' }}>
                {p.pw}×{p.ph}
              </text>
            )}
          </g>
        );
      })}
      <text x={W - 1} y={H + pad - 1.2} fontSize={3.4} textAnchor="end" fill="#78716c" style={{ fontFamily: 'Prompt, sans-serif' }}>
        {W} × {H} ซม.
      </text>
    </svg>
  );
}
