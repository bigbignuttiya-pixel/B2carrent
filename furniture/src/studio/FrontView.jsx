// Front elevation of a piece (SVG, centimetres). Interactive mode: drag shelves / drawers / rods up and down,
// drag dividers left and right, click a column to select it.
import { useRef } from 'react';
import { buildPiece, columnX, innerHeight, matById, overlaps, elementH, ELEMENT_KINDS } from './model';

const INK = '#292524';
const r1 = (n) => Math.round(n * 10) / 10;
const stroke = { stroke: INK, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' };

export function FrontDrawing({ piece, materials, showDoors = true, dims = true, built }) {
  const b = built || buildPiece(piece, materials);
  const W = b.outer.outerW;
  const X0 = b.outer.minX || 0;
  const H = b.outer.outerH + (piece.mirror ? 86 : 0);
  const Y = (y) => H - y;
  // back → front, so nearer panels cover farther ones
  const parts = [...b.parts].sort((a, c) => a.box.z + a.box.sz - (c.box.z + c.box.sz));
  const fontSize = Math.max(4, Math.min(W, H) * 0.045);
  return (
    <g>
      {parts.map((x) => {
        if (x.role === 'front' && !showDoors && piece.kind === 'box') return null;
        const { box } = x;
        const isFront = x.role === 'front';
        const isDoor = isFront && x.anim && x.anim.type !== 'drawer';
        return (
          <g key={x.key}>
            <rect x={box.x} y={Y(box.y + box.sy)} width={box.sx} height={box.sy} fill={x.color} fillOpacity={isDoor ? 0.92 : 1} {...stroke} strokeOpacity={x.name === 'แผ่นหลัง' ? 0.3 : 0.8} />
            {isDoor && x.anim.hinge === 'left' && <path d={`M${box.x + box.sx},${Y(box.y + box.sy)} L${box.x},${Y(box.y + box.sy / 2)} L${box.x + box.sx},${Y(box.y)}`} fill="none" {...stroke} strokeOpacity={0.35} strokeDasharray="3 3" />}
            {isDoor && x.anim.hinge === 'right' && <path d={`M${box.x},${Y(box.y + box.sy)} L${box.x + box.sx},${Y(box.y + box.sy / 2)} L${box.x},${Y(box.y)}`} fill="none" {...stroke} strokeOpacity={0.35} strokeDasharray="3 3" />}
            {isDoor && x.anim.hinge === 'top' && <path d={`M${box.x},${Y(box.y)} L${box.x + box.sx / 2},${Y(box.y + box.sy)} L${box.x + box.sx},${Y(box.y)}`} fill="none" {...stroke} strokeOpacity={0.35} strokeDasharray="3 3" />}
            {isFront && x.handle && <Handle box={box} kind={x.handle} Y={Y} />}
          </g>
        );
      })}
      {b.extras.map((e, i) =>
        e.type === 'rod' ? (
          <g key={i}>
            <line x1={e.from[0] + 1} y1={Y(e.from[1])} x2={e.to[0] - 1} y2={Y(e.to[1])} stroke="#78716c" strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={e.from[0] + 1.5} cy={Y(e.from[1])} r={1.4} fill="#57534e" />
            <circle cx={e.to[0] - 1.5} cy={Y(e.to[1])} r={1.4} fill="#57534e" />
          </g>
        ) : e.type === 'shoe' || e.type === 'basket' || e.type === 'pants' ? (
          <g key={i} stroke="#71717a" strokeWidth={0.6} fill="none">
            <rect x={e.box.x} y={Y(e.box.y + e.box.sy)} width={e.box.sx} height={e.box.sy} strokeDasharray={e.type === 'basket' ? '1.5 1' : undefined} fill={e.type === 'basket' ? 'rgba(161,161,170,.12)' : 'none'} />
            {e.type === 'shoe' && [0.35, 0.85].map((f) => <line key={f} x1={e.box.x} y1={Y(e.box.y + e.box.sy * f - 3)} x2={e.box.x + e.box.sx} y2={Y(e.box.y + e.box.sy * f - 3)} strokeWidth={1.2} />)}
            {e.type === 'pants' && Array.from({ length: Math.max(2, Math.floor(e.box.sx / 6)) }, (_, k) => <circle key={k} cx={e.box.x + 3 + k * 6} cy={Y(e.box.y + e.box.sy - 1)} r={0.8} fill="#71717a" />)}
          </g>
        ) : e.type === 'box' ? (
          <rect key={i} x={e.box.x} y={Y(e.box.y + e.box.sy)} width={e.box.sx} height={e.box.sy} fill={e.color} {...stroke} />
        ) : e.type === 'leg' && e.at[1] > piece.D / 2 ? (
          <rect key={i} x={e.at[0] - 2} y={Y(e.h)} width={4} height={e.h} fill="#44403c" />
        ) : null
      )}
      {dims && (
        <g fill="#57534e" fontSize={fontSize} textAnchor="middle" style={{ fontFamily: 'Prompt, sans-serif' }}>
          <line x1={X0} y1={H + fontSize * 1.2} x2={X0 + W} y2={H + fontSize * 1.2} stroke="#a8a29e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={X0 + W / 2} y={H + fontSize * 2.6}>{r1(W)}</text>
          <line x1={X0 - fontSize * 1.2} y1={0} x2={X0 - fontSize * 1.2} y2={H} stroke="#a8a29e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={X0 - fontSize * 2} y={H / 2} transform={`rotate(-90 ${X0 - fontSize * 2} ${H / 2})`}>{r1(H)}</text>
        </g>
      )}
    </g>
  );
}

function Handle({ box, kind, Y }) {
  const hc = '#44403c';
  if (kind === 'drawer') {
    const w = Math.min(16, box.sx * 0.4);
    return <rect x={box.x + box.sx / 2 - w / 2} y={Y(box.y + box.sy) + Math.min(4, box.sy * 0.25)} width={w} height={1.2} rx={0.6} fill={hc} />;
  }
  if (kind === 'top') {
    const w = Math.min(16, box.sx * 0.4);
    return <rect x={box.x + box.sx / 2 - w / 2} y={Y(box.y) - 4} width={w} height={1.2} rx={0.6} fill={hc} />;
  }
  const x = kind === 'left' ? box.x + box.sx - 4 : box.x + 2.8;
  const h = Math.min(18, box.sy * 0.3);
  const yc = box.sy > 120 ? box.y + 100 : box.y + box.sy / 2;
  return <rect x={x} y={Y(yc) - h / 2} width={1.2} height={h} rx={0.6} fill={hc} />;
}

export const frontViewBox = (piece, materials, pad = 0.12) => {
  const b = buildPiece(piece, materials);
  const W = b.outer.outerW;
  const H = b.outer.outerH + (piece.mirror ? 86 : 0);
  const X0 = b.outer.minX || 0;
  const m = Math.max(W, H) * pad + 8;
  return { vb: `${X0 - m} ${-m * 0.6} ${W + 2 * m} ${H + m * 1.6}`, W, H, built: b };
};

// Interactive editor
export default function FrontView({ piece, materials, showDoors, selection, onSelect, onBegin, onLive, dropRef }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const { vb, H, built } = frontViewBox(piece, materials);
  const isBox = piece.kind === 'box';
  const t = matById(materials, piece.carcass).t;
  const y0 = (piece.plinth || 0) + t;
  const Hi = isBox ? innerHeight(piece, materials) : 0;
  const Y = (y) => H - y;

  const toCm = (e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: H - p.y };
  };

  if (dropRef) {
    dropRef.current = (clientX, clientY) => {
      if (!isBox || !svgRef.current) return null;
      const r = svgRef.current.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
      const p = toCm({ clientX, clientY });
      const ci = piece.columns.findIndex((c, i) => {
        const x = columnX(piece, materials, i);
        return p.x >= x - t && p.x <= x + c.w + t;
      });
      if (ci < 0) return null;
      return { col: ci, y: r1(Math.max(0, Math.min(Hi, p.y - y0))) };
    };
  }

  const start = (e, info) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { ...info, start: toCm(e), moved: false };
    onSelect(info.sel);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const p = toCm(e);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    if (!d.moved && Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) return;
    if (!d.moved) {
      d.moved = true;
      onBegin();
    }
    if (d.kind === 'item') {
      onLive((pc) => ({
        ...pc,
        columns: pc.columns.map((c, i) =>
          i !== d.col
            ? c
            : { ...c, items: c.items.map((it) => (it.id !== d.id ? it : { ...it, y: r1(Math.max(0, Math.min(d.max, Math.round(d.y0 + dy)))) })) }
        ),
      }));
    } else if (d.kind === 'divider') {
      const total = d.wl + d.wr;
      const wl = Math.max(10, Math.min(total - 10, Math.round(d.wl + dx)));
      onLive((pc) => ({ ...pc, columns: pc.columns.map((c, i) => (i === d.col - 1 ? { ...c, w: wl } : i === d.col ? { ...c, w: r1(total - wl) } : c)) }));
    }
  };
  const end = () => {
    drag.current = null;
  };

  const fontSize = Math.max(3.5, Math.min(piece.W, piece.H) * 0.035);

  return (
    <svg
      ref={svgRef}
      viewBox={vb}
      className="w-full h-full touch-none select-none"
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerDown={() => onSelect({ col: null, item: null })}
    >
      <FrontDrawing piece={piece} materials={materials} showDoors={showDoors} built={built} />
      {isBox && (
        <g>
          {piece.columns.map((c, ci) => {
            const x = columnX(piece, materials, ci);
            const bad = overlaps(piece, materials, c);
            const colSel = selection.col === ci;
            const sorted = [...c.items].sort((a, b) => a.y - b.y);
            const gaps = [];
            let cur = 0;
            sorted.forEach((it) => {
              if (it.y - cur > 6) gaps.push([cur, it.y]);
              cur = it.y + elementH(it, t);
            });
            if (Hi - cur > 6) gaps.push([cur, Hi]);
            return (
              <g key={c.id}>
                {/* column hit area */}
                <rect
                  x={x}
                  y={Y(y0 + Hi)}
                  width={c.w}
                  height={Hi}
                  fill={colSel ? '#d97706' : 'transparent'}
                  fillOpacity={colSel ? 0.08 : 0}
                  stroke={colSel ? '#d97706' : 'none'}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  onPointerDown={(e) => (e.stopPropagation(), onSelect({ col: ci, item: null }))}
                />
                {!showDoors &&
                  gaps.map(([lo, hi]) => (
                    <text key={lo} x={x + c.w - 1.5} y={Y(y0 + (lo + hi) / 2)} fontSize={fontSize} textAnchor="end" dominantBaseline="central" fill="#78716c" style={{ fontFamily: 'Prompt, sans-serif', pointerEvents: 'none' }}>
                      {r1(hi - lo)}
                    </text>
                  ))}
                <text x={x + c.w / 2} y={Y(piece.H) - fontSize * 0.8} fontSize={fontSize} textAnchor="middle" fill="#57534e" style={{ fontFamily: 'Prompt, sans-serif', pointerEvents: 'none' }}>
                  {r1(c.w)}
                </text>
                {c.items.map((it) => {
                  const h = elementH(it, t);
                  const sel = selection.item === it.id;
                  const max = it.kind === 'rod' ? Hi - 5 : Hi - h;
                  const hitPad = it.kind === 'shelf' ? 2.5 : 0;
                  // with doors shown only the drawer fronts in door-less columns are visible
                  if (showDoors && c.door !== 'none') return null;
                  return (
                    <g key={it.id}>
                      {(sel || bad.has(it.id)) && (
                        <rect x={x} y={Y(y0 + it.y + h) - (it.kind === 'rod' ? 1.5 : 0)} width={c.w} height={it.kind === 'rod' ? 3 : h} fill="none" stroke={bad.has(it.id) ? '#e11d48' : '#d97706'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                      )}
                      <rect
                        x={x}
                        y={Y(y0 + it.y + h) - hitPad - (it.kind === 'rod' ? 2 : 0)}
                        width={c.w}
                        height={h + hitPad * 2 + (it.kind === 'rod' ? 4 : 0)}
                        fill="transparent"
                        style={{ cursor: 'ns-resize' }}
                        onPointerDown={(e) => start(e, { kind: 'item', col: ci, id: it.id, y0: it.y, max, sel: { col: ci, item: it.id } })}
                      >
                        <title>{`${ELEMENT_KINDS[it.kind].name} · สูงจากพื้นตู้ ${it.y} ซม.`}</title>
                      </rect>
                    </g>
                  );
                })}
                {ci > 0 && (
                  <rect
                    x={x - t - 1.5}
                    y={Y(y0 + Hi)}
                    width={t + 3}
                    height={Hi}
                    fill="transparent"
                    style={{ cursor: 'ew-resize' }}
                    onPointerDown={(e) => start(e, { kind: 'divider', col: ci, wl: piece.columns[ci - 1].w, wr: c.w, sel: { col: ci, item: null } })}
                  >
                    <title>ลากเพื่อปรับความกว้างช่อง</title>
                  </rect>
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
