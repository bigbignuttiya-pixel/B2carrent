// SVG drawings of each item, in centimetres, centred on (0, 0). The "back" of an item is at the top (−d/2).
import { catalogItem } from './catalog';

const INK = '#292524';
const line = { stroke: INK, strokeWidth: 1.4, vectorEffect: 'non-scaling-stroke', strokeLinejoin: 'round' };
const thin = { stroke: INK, strokeWidth: 0.8, vectorEffect: 'non-scaling-stroke', strokeOpacity: 0.55 };

function shade(hex, amt) {
  const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function Sofa({ w, d, c, seats }) {
  const arm = Math.min(20, w * 0.11);
  const back = Math.min(22, d * 0.25);
  const x0 = -w / 2, y0 = -d / 2;
  const seatW = (w - arm * 2) / seats;
  return (
    <g>
      <rect x={x0} y={y0} width={w} height={d} rx={8} fill={c} {...line} />
      <rect x={x0} y={y0} width={w} height={back} rx={6} fill={shade(c, -0.1)} {...line} />
      <rect x={x0} y={y0} width={arm} height={d} rx={6} fill={shade(c, -0.1)} {...line} />
      <rect x={w / 2 - arm} y={y0} width={arm} height={d} rx={6} fill={shade(c, -0.1)} {...line} />
      {Array.from({ length: seats - 1 }, (_, i) => (
        <line key={i} x1={x0 + arm + seatW * (i + 1)} y1={y0 + back} x2={x0 + arm + seatW * (i + 1)} y2={d / 2 - 4} {...thin} />
      ))}
    </g>
  );
}

function LSofa({ w, d, c }) {
  const depth = Math.min(95, d * 0.55, w * 0.4);
  const back = 20;
  const x0 = -w / 2, y0 = -d / 2;
  const path = `M${x0},${y0} H${w / 2} V${y0 + depth} H${x0 + depth} V${d / 2} H${x0} Z`;
  return (
    <g>
      <path d={path} fill={c} {...line} />
      <rect x={x0} y={y0} width={w} height={back} rx={6} fill={shade(c, -0.1)} {...line} />
      <rect x={x0} y={y0} width={back} height={d} rx={6} fill={shade(c, -0.1)} {...line} />
      <rect x={w / 2 - 18} y={y0} width={18} height={depth} rx={6} fill={shade(c, -0.1)} {...line} />
      <line x1={x0 + back} y1={y0 + depth} x2={x0 + depth} y2={y0 + depth} {...thin} />
      <line x1={(x0 + depth + w / 2) / 2} y1={y0 + back} x2={(x0 + depth + w / 2) / 2} y2={y0 + depth} {...thin} />
    </g>
  );
}

function Bed({ w, d, c }) {
  const x0 = -w / 2, y0 = -d / 2;
  const head = 8;
  const pillows = w >= 140 ? 2 : 1;
  const pw = (w - 20 - (pillows - 1) * 8) / pillows;
  return (
    <g>
      <rect x={x0} y={y0} width={w} height={d} rx={4} fill="#fafaf9" {...line} />
      <rect x={x0} y={y0} width={w} height={head} rx={2} fill={shade(c, -0.35)} {...line} />
      {Array.from({ length: pillows }, (_, i) => (
        <rect key={i} x={x0 + 10 + i * (pw + 8)} y={y0 + head + 8} width={pw} height={Math.min(40, d * 0.18)} rx={8} fill="#fff" {...line} />
      ))}
      <rect x={x0 + 3} y={y0 + d * 0.38} width={w - 6} height={d * 0.62 - 3} rx={4} fill={c} {...line} />
      <line x1={x0 + 3} y1={y0 + d * 0.38 + 14} x2={w / 2 - 3} y2={y0 + d * 0.38 + 14} {...thin} />
    </g>
  );
}

function Table({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={4} fill={c} {...line} />
      <rect x={-w / 2 + 5} y={-d / 2 + 5} width={Math.max(0, w - 10)} height={Math.max(0, d - 10)} rx={2} fill="none" {...thin} />
    </g>
  );
}

function Chair({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2 + d * 0.18} width={w} height={d * 0.82} rx={6} fill={c} {...line} />
      <rect x={-w / 2} y={-d / 2} width={w} height={d * 0.2} rx={4} fill={shade(c, -0.15)} {...line} />
    </g>
  );
}

function OfficeChair({ w, d, c }) {
  const r = Math.min(w, d) / 2;
  return (
    <g>
      <circle r={r * 0.78} cy={r * 0.1} fill={c} {...line} />
      <path d={`M${-r * 0.8},${-r * 0.55} Q0,${-r * 1.15} ${r * 0.8},${-r * 0.55}`} fill="none" stroke={shade(c, -0.2)} strokeWidth={r * 0.28} strokeLinecap="round" />
    </g>
  );
}

function Cabinet({ w, d, c, doors = 2 }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={2} fill={c} {...line} />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <line key={i} x1={-w / 2 + (w / doors) * (i + 1)} y1={-d / 2} x2={-w / 2 + (w / doors) * (i + 1)} y2={d / 2} {...thin} />
      ))}
      <line x1={-w / 2} y1={d / 2 - 4} x2={w / 2} y2={d / 2 - 4} {...thin} />
    </g>
  );
}

function Shelf({ w, d, c }) {
  const n = Math.max(2, Math.round(w / 40));
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill={c} {...line} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <line key={i} x1={-w / 2 + (w / n) * (i + 1)} y1={-d / 2} x2={-w / 2 + (w / n) * (i + 1)} y2={d / 2} {...thin} />
      ))}
    </g>
  );
}

function TvStand({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={2} fill={c} {...line} />
      <rect x={-w * 0.38} y={-d / 2 + 4} width={w * 0.76} height={Math.min(6, d * 0.2)} rx={1} fill={INK} />
    </g>
  );
}

function Rug({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={3} fill={c} fillOpacity={0.75} {...thin} />
      <rect x={-w / 2 + 8} y={-d / 2 + 8} width={Math.max(0, w - 16)} height={Math.max(0, d - 16)} rx={2} fill="none" {...thin} strokeDasharray="4 3" />
    </g>
  );
}

function Plant({ w, d, c }) {
  const r = Math.min(w, d) / 2;
  const leaves = [0, 60, 120, 180, 240, 300];
  return (
    <g>
      {leaves.map((a) => (
        <ellipse key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.45} cy={Math.sin((a * Math.PI) / 180) * r * 0.45} rx={r * 0.5} ry={r * 0.28}
          transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * r * 0.45} ${Math.sin((a * Math.PI) / 180) * r * 0.45})`} fill={c} {...thin} />
      ))}
      <circle r={r * 0.3} fill={shade(c, -0.15)} {...thin} />
    </g>
  );
}

function Lamp({ w, d, c }) {
  const r = Math.min(w, d) / 2;
  return (
    <g>
      <circle r={r} fill={c} {...line} />
      <circle r={r * 0.35} fill="#fff" {...thin} />
      <line x1={-r} y1={0} x2={r} y2={0} {...thin} />
      <line x1={0} y1={-r} x2={0} y2={r} {...thin} />
    </g>
  );
}

function Counter({ w, d, c }) {
  return <rect x={-w / 2} y={-d / 2} width={w} height={d} fill={c} {...line} />;
}

function Stove({ w, d, c }) {
  const r = Math.min(w, d) * 0.15;
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={2} fill={c} {...line} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
        <circle key={`${sx}${sy}`} cx={(sx * w) / 4.5} cy={(sy * d) / 4.5} r={r} fill="none" {...line} />
      ))}
    </g>
  );
}

function SinkK({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={2} fill={c} {...line} />
      <rect x={-w / 2 + 8} y={-d / 2 + 10} width={w - 16} height={d - 18} rx={6} fill="#f8fafc" {...line} />
      <circle cx={0} cy={-d / 2 + 5} r={2.5} fill={INK} />
    </g>
  );
}

function Fridge({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={3} fill={c} {...line} />
      <line x1={-w / 2} y1={d / 2 - 8} x2={w / 2} y2={d / 2 - 8} {...line} />
      <line x1={-w / 2 + 10} y1={-d / 2 + 10} x2={w / 2 - 10} y2={d / 2 - 18} {...thin} />
      <line x1={w / 2 - 10} y1={-d / 2 + 10} x2={-w / 2 + 10} y2={d / 2 - 18} {...thin} />
    </g>
  );
}

function Toilet({ w, d, c }) {
  const tank = d * 0.28;
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={tank} rx={3} fill={c} {...line} />
      <ellipse cx={0} cy={-d / 2 + tank + (d - tank) / 2} rx={w * 0.45} ry={(d - tank) / 2} fill={c} {...line} />
      <ellipse cx={0} cy={-d / 2 + tank + (d - tank) / 2 + 2} rx={w * 0.28} ry={(d - tank) / 2 - 8} fill="none" {...thin} />
    </g>
  );
}

function Basin({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={4} fill={c} {...line} />
      <ellipse cx={0} cy={3} rx={w * 0.36} ry={d * 0.3} fill="#f8fafc" {...line} />
      <circle cx={0} cy={-d / 2 + 6} r={2.5} fill={INK} />
    </g>
  );
}

function Bathtub({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={10} fill={c} {...line} />
      <rect x={-w / 2 + 8} y={-d / 2 + 8} width={w - 16} height={d - 16} rx={Math.min(30, d / 2 - 8)} fill="#f0f9ff" {...line} />
      <circle cx={w / 2 - 22} cy={0} r={3} fill="none" {...line} />
    </g>
  );
}

function Shower({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill={c} {...line} />
      <line x1={-w / 2} y1={-d / 2} x2={w / 2} y2={d / 2} {...thin} />
      <line x1={w / 2} y1={-d / 2} x2={-w / 2} y2={d / 2} {...thin} />
      <circle r={4} fill="#fff" {...line} />
    </g>
  );
}

function Door({ w, d }) {
  // Opening along the top edge, hinge on the left, door swings into the room
  const x0 = -w / 2, y0 = -d / 2;
  return (
    <g>
      <rect x={x0} y={y0} width={w} height={d} fill="transparent" />
      <line x1={x0} y1={y0} x2={w / 2} y2={y0} stroke="#fff" strokeWidth={12} />
      <line x1={x0} y1={y0} x2={x0} y2={y0 + d} {...line} strokeWidth={2.5} />
      <path d={`M${w / 2},${y0} A${w},${d} 0 0 1 ${x0},${y0 + d}`} fill="none" {...thin} strokeDasharray="4 3" />
    </g>
  );
}

function Window({ w, d, c }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill={c} {...line} />
      <line x1={-w / 2} y1={0} x2={w / 2} y2={0} {...thin} />
    </g>
  );
}

function Solid({ w, d, c, cross }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill={c} {...line} />
      {cross && (
        <>
          <line x1={-w / 2} y1={-d / 2} x2={w / 2} y2={d / 2} stroke="#fff" strokeOpacity={0.5} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <line x1={w / 2} y1={-d / 2} x2={-w / 2} y2={d / 2} stroke="#fff" strokeOpacity={0.5} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </>
      )}
    </g>
  );
}

function Label({ w, d, c, text }) {
  return (
    <g>
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="transparent" />
      <text textAnchor="middle" dominantBaseline="central" fontSize={d * 0.6} fill={c} fontWeight={600} style={{ fontFamily: 'Prompt, sans-serif' }}>
        {text || 'ข้อความ'}
      </text>
    </g>
  );
}

const DRAW = {
  sofa3: (p) => <Sofa {...p} seats={3} />,
  sofa2: (p) => <Sofa {...p} seats={2} />,
  armchair: (p) => <Sofa {...p} seats={1} />,
  lsofa: LSofa,
  coffee: Table,
  sideTable: Table,
  desk: Table,
  diningRect: Table,
  diningLong: Table,
  diningRound: ({ w, d, c }) => <ellipse rx={w / 2} ry={d / 2} fill={c} {...line} />,
  tvstand: TvStand,
  bookshelf: Shelf,
  rug: Rug,
  plant: Plant,
  lamp: Lamp,
  bedK: Bed,
  bedQ: Bed,
  bedS: Bed,
  wardrobe: (p) => <Cabinet {...p} doors={Math.max(2, Math.round(p.w / 50))} />,
  nightstand: (p) => <Cabinet {...p} doors={1} />,
  dresser: (p) => <Cabinet {...p} doors={2} />,
  cabinet: (p) => <Cabinet {...p} doors={2} />,
  chair: Chair,
  officeChair: OfficeChair,
  counter: Counter,
  stove: Stove,
  sinkK: SinkK,
  fridge: Fridge,
  toilet: Toilet,
  basin: Basin,
  bathtub: Bathtub,
  shower: Shower,
  door: Door,
  window: Window,
  wall: (p) => <Solid {...p} />,
  column: (p) => <Solid {...p} cross />,
  label: Label,
};

export function ItemShape({ item }) {
  const Draw = DRAW[item.type] || Table;
  return <Draw w={item.w} d={item.d} c={item.color} text={item.label} />;
}

export const itemName = (item) => item.label || catalogItem(item.type).name;

const fmt = (cm) => (cm >= 100 ? `${(cm / 100).toFixed(cm % 100 ? 2 : 0)} ม.` : `${Math.round(cm)} ซม.`);
export { fmt as formatLength };

// Room + grid + items. Rendered inside a <g> already scaled to centimetres.
export function PlanContent({ design, showGrid = true, showLabels = false, showDims = true }) {
  const { room, items } = design;
  const W = 10; // wall thickness (cm)
  const grid = [];
  if (showGrid) {
    for (let x = 50; x < room.w; x += 50) grid.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={room.d} stroke="#000" strokeOpacity={x % 100 ? 0.06 : 0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />);
    for (let y = 50; y < room.d; y += 50) grid.push(<line key={`y${y}`} x1={0} y1={y} x2={room.w} y2={y} stroke="#000" strokeOpacity={y % 100 ? 0.06 : 0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  }
  const dimFont = Math.max(10, Math.min(room.w, room.d) * 0.04);
  return (
    <g>
      <rect x={-W} y={-W} width={room.w + W * 2} height={room.d + W * 2} fill={room.wall} />
      <rect x={0} y={0} width={room.w} height={room.d} fill={room.floor} />
      {grid}
      {showDims && (
        <g fill="#57534e" fontSize={dimFont} style={{ fontFamily: 'Prompt, sans-serif' }} textAnchor="middle">
          <text x={room.w / 2} y={-W - dimFont * 0.7}>{fmt(room.w)}</text>
          <text x={-W - dimFont * 0.7} y={room.d / 2} transform={`rotate(-90 ${-W - dimFont * 0.7} ${room.d / 2})`}>{fmt(room.d)}</text>
        </g>
      )}
      {items.map((it) => (
        <g key={it.id} transform={`translate(${it.x} ${it.y}) rotate(${it.rot || 0})`}>
          <ItemShape item={it} />
          {showLabels && it.type !== 'label' && it.type !== 'door' && it.type !== 'window' && it.type !== 'wall' && (
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.max(7, Math.min(14, Math.min(it.w, it.d) * 0.16))}
              fill="#1c1917"
              stroke="#fff"
              strokeWidth={3}
              paintOrder="stroke"
              transform={`rotate(${-(it.rot || 0)})`}
              style={{ fontFamily: 'Prompt, sans-serif', pointerEvents: 'none' }}
            >
              {itemName(it)}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
