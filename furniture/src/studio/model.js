// FORMA STUDIO — parametric furniture model. Units: centimetres.
// One function (buildPiece) turns a piece into panels; the 2D view, 3D model, cut list and costing all read from it.
//
// Coordinates of a piece: x = width (left → right), y = height (floor → up), z = depth (back = 0 → front = D).

export const uid = () => Math.random().toString(36).slice(2, 10);
const r1 = (n) => Math.round(n * 10) / 10;

// Sheet materials (prices are starting estimates — every price is editable per project)
export const DEFAULT_MATERIALS = [
  { id: 'pb18', name: 'ปาร์ติเคิลบอร์ดปิดเมลามีน 18 มม.', t: 1.8, price: 850 },
  { id: 'mdf18', name: 'MDF ปิดเมลามีน 18 มม.', t: 1.8, price: 1150 },
  { id: 'hmr18', name: 'HMR กันชื้น ปิดเมลามีน 18 มม.', t: 1.8, price: 1450 },
  { id: 'ply20', name: 'ไม้อัดยาง 20 มม.', t: 2.0, price: 1100 },
  { id: 'mdf9', name: 'MDF 9 มม.', t: 0.9, price: 520 },
  { id: 'hdf6', name: 'MDF 6 มม. (แผ่นหลัง / ก้นลิ้นชัก)', t: 0.6, price: 380 },
  { id: 'ply4', name: 'ไม้อัด 4 มม.', t: 0.4, price: 260 },
];

export const SHEET_PRESETS = [
  { name: '120 × 240 ซม.', w: 120, h: 240 },
  { name: '122 × 244 ซม. (4×8 ฟุต)', w: 122, h: 244 },
  { name: '183 × 244 ซม.', w: 183, h: 244 },
];

export const DEFAULT_PRICING = {
  sheetW: 120,
  sheetH: 240,
  kerf: 0.4, // saw blade width
  allowRotate: true,
  materials: DEFAULT_MATERIALS,
  edgePerM: 15, // edge banding ฿ per metre
  hinge: 65,
  slide: 280, // drawer slides, per pair
  handle: 45,
  rodPerM: 120,
  slidingPerDoor: 650, // track + rollers per sliding door
  metalLegs: 1200, // per set of 4
  countertopPerM: 1800,
  laborPerSheet: 450, // cutting, edging, assembly per sheet used
  install: 0,
  marginPct: 30,
  discount: 0,
  vatPct: 0,
};

// Surface finishes for the 3D view (the cut list only cares about the sheet material)
export const FINISHES = [
  { id: 'oak', name: 'โอ๊คธรรมชาติ', kind: 'wood', color: '#d4b48a' },
  { id: 'ash', name: 'เถ้าขาว', kind: 'wood', color: '#e9ddc7' },
  { id: 'teak', name: 'สักทอง', kind: 'wood', color: '#b9814f' },
  { id: 'walnut', name: 'วอลนัท', kind: 'wood', color: '#6b4a33' },
  { id: 'white', name: 'ขาวด้าน', kind: 'solid', color: '#f3f1ec' },
  { id: 'cream', name: 'ครีม', kind: 'solid', color: '#e9e0cf' },
  { id: 'stone', name: 'เทาหิน', kind: 'solid', color: '#8d8f92' },
  { id: 'navy', name: 'น้ำเงินเมอร์', kind: 'solid', color: '#34507f' },
  { id: 'sage', name: 'เขียวเซจ', kind: 'solid', color: '#8c9a7e' },
  { id: 'black', name: 'ดำด้าน', kind: 'solid', color: '#2b2a29' },
  { id: 'mirror', name: 'กระจกเงา', kind: 'mirror', color: '#c9d3dc', frontOnly: true },
  { id: 'glass', name: 'กระจกฝ้า', kind: 'glass', color: '#dfe7ec', frontOnly: true },
];
export const finishById = (id) => FINISHES.find((f) => f.id === id) || null;

export const COLORS = ['#f5f5f4', '#e7e5e4', '#d6d3d1', '#78716c', '#292524', '#efe3cf', '#d9c3a5', '#c8a27a', '#a47551', '#7c5a3c', '#5b4636', '#cbd5e1', '#94a3b8', '#9fb7a0', '#e8d5c4'];

export const DOORS = [
  { id: 'none', name: 'ไม่มีบาน (ช่องเปิด)' },
  { id: 'left', name: 'บานเดี่ยว บานพับซ้าย' },
  { id: 'right', name: 'บานเดี่ยว บานพับขวา' },
  { id: 'double', name: 'บานคู่' },
  { id: 'flip', name: 'บานยกขึ้น (บานพับบน)' },
];

export const DOOR_STYLES = [
  { id: 'hinged', name: 'บานเปิด (ตั้งค่าแต่ละช่อง)' },
  { id: 'sliding', name: 'บานเลื่อน (เต็มหน้าตู้)' },
];

export const ELEMENT_KINDS = {
  shelf: { name: 'ชั้นวาง', defaultH: 0 },
  drawer: { name: 'ลิ้นชัก', defaultH: 18 },
  rod: { name: 'ราวแขวน', defaultH: 0 },
};

// ---------- templates ----------
const col = (w, door, items = []) => ({ id: uid(), w, door, items: items.map((it) => ({ id: uid(), ...it })) });
const sh = (y) => ({ kind: 'shelf', y });
const dr = (y, h = 18) => ({ kind: 'drawer', y, h });
const rod = (y) => ({ kind: 'rod', y });

export const TEMPLATES = [
  {
    id: 'wardrobe2', group: 'ตู้', name: 'ตู้เสื้อผ้า 2 บาน', make: () => ({
      kind: 'box', W: 120, H: 220, D: 60, plinth: 8,
      columns: [col(57.3, 'left', [rod(165), sh(175)]), col(57.3, 'right', [sh(40), sh(80), sh(120), sh(160)])],
    }),
  },
  {
    id: 'wardrobe3', group: 'ตู้', name: 'ตู้เสื้อผ้า 3 บาน + ลิ้นชัก', make: () => ({
      kind: 'box', W: 180, H: 220, D: 60, plinth: 8,
      columns: [
        col(56.2, 'left', [rod(165), sh(175)]),
        col(56.2, 'left', [dr(0, 20), dr(22, 20), sh(60), sh(100), rod(150), sh(175)]),
        col(56.2, 'right', [sh(40), sh(80), sh(120), sh(160)]),
      ],
    }),
  },
  {
    id: 'kitchenBase', group: 'ครัว', name: 'ตู้ครัวล่าง บานคู่', make: () => ({
      kind: 'box', W: 80, H: 86, D: 58, plinth: 10, countertop: true, carcass: 'hmr18',
      columns: [col(76.4, 'double', [sh(30)])],
    }),
  },
  {
    id: 'kitchenDrawer', group: 'ครัว', name: 'ตู้ครัวล่าง ลิ้นชัก 3 ชั้น', make: () => ({
      kind: 'box', W: 60, H: 86, D: 58, plinth: 10, countertop: true, carcass: 'hmr18',
      columns: [col(56.4, 'none', [dr(0, 24), dr(24.5, 24), dr(49, 22)])],
    }),
  },
  {
    id: 'kitchenWall', group: 'ครัว', name: 'ตู้ครัวแขวน', make: () => ({
      kind: 'box', W: 80, H: 70, D: 33, plinth: 0, elev: 145, carcass: 'hmr18',
      columns: [col(76.4, 'double', [sh(32)])],
    }),
  },
  {
    id: 'bookshelf', group: 'ตู้', name: 'ชั้นหนังสือ', make: () => ({
      kind: 'box', W: 80, H: 180, D: 30, plinth: 5,
      columns: [col(76.4, 'none', [sh(35), sh(70), sh(105), sh(140)])],
    }),
  },
  {
    id: 'tvCabinet', group: 'ตู้', name: 'ตู้วางทีวี', make: () => ({
      kind: 'box', W: 180, H: 50, D: 42, plinth: 8,
      columns: [col(56.2, 'none', [dr(0, 17), dr(17.5, 17)]), col(56.2, 'none', [sh(17)]), col(56.2, 'flip', [])],
    }),
  },
  {
    id: 'shoe', group: 'ตู้', name: 'ตู้รองเท้า', make: () => ({
      kind: 'box', W: 80, H: 110, D: 35, plinth: 8,
      columns: [col(76.4, 'double', [sh(20), sh(40), sh(60), sh(80)])],
    }),
  },
  { id: 'desk', group: 'โต๊ะ', name: 'โต๊ะทำงาน', make: () => ({ kind: 'table', W: 120, H: 75, D: 60, legs: 'panel', apron: 30 }) },
  { id: 'dining', group: 'โต๊ะ', name: 'โต๊ะอาหาร ขาเหล็ก', make: () => ({ kind: 'table', W: 150, H: 75, D: 80, legs: 'metal', apron: 0 }) },
  { id: 'bed5', group: 'เตียง', name: 'เตียง 5 ฟุต', make: () => ({ kind: 'bed', W: 150, H: 30, D: 200, headH: 100 }) },
  { id: 'bed6', group: 'เตียง', name: 'เตียง 6 ฟุต', make: () => ({ kind: 'bed', W: 180, H: 30, D: 200, headH: 110 }) },
  { id: 'box', group: 'ตู้', name: 'ตู้เปล่า (กำหนดเอง)', make: () => ({ kind: 'box', W: 60, H: 80, D: 40, plinth: 0, columns: [col(56.4, 'none', [])] }) },
];

export function newPiece(templateId, extra = {}) {
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const base = {
    id: uid(),
    template: tpl.id,
    name: tpl.name,
    carcass: 'pb18',
    front: 'pb18',
    back: 'hdf6',
    color: '#efe3cf',
    frontColor: '#d9c3a5',
    finish: null,
    frontFinish: null,
    shelfFinish: null,
    doorStyle: 'hinged',
    slideCount: 2,
    plinth: 0,
    elev: 0,
    countertop: false,
    ...tpl.make(),
    ...extra,
  };
  return normalizePiece(base, DEFAULT_MATERIALS);
}

export const newStudioDesign = () => ({
  version: 1,
  kind: 'studio',
  room: { kind: 'studio' }, // marker read by the projects list
  items: [newPiece('wardrobe2')],
  pricing: DEFAULT_PRICING,
  photo: null,
});

export const matById = (materials, id) => materials.find((m) => m.id === id) || materials[0] || DEFAULT_MATERIALS[0];

// Keep columns filling the inner width exactly; clamp elements inside the cabinet
export function normalizePiece(p, materials) {
  if (p.kind !== 'box') return p;
  const t = matById(materials, p.carcass).t;
  const cols = p.columns?.length ? p.columns : [col(10, 'none')];
  const inner = p.W - 2 * t - (cols.length - 1) * t;
  const sum = cols.reduce((s, c) => s + Math.max(1, c.w), 0);
  const innerH = innerHeight(p, materials);
  const columns = cols.map((c) => ({
    ...c,
    w: r1((Math.max(1, c.w) / sum) * inner),
    items: c.items.map((it) => {
      const h = it.kind === 'drawer' ? Math.max(8, Math.min(it.h || 18, innerH)) : 0;
      const top = it.kind === 'shelf' ? innerH - t : it.kind === 'drawer' ? innerH - h : innerH - 5;
      return { ...it, h, y: r1(Math.max(0, Math.min(it.y, top))) };
    }),
  }));
  // fix rounding so widths add up exactly
  const diff = r1(inner - columns.reduce((s, c) => s + c.w, 0));
  if (columns.length) columns[columns.length - 1].w = r1(columns[columns.length - 1].w + diff);
  return { ...p, columns };
}

export const innerHeight = (p, materials) => r1(p.H - (p.plinth || 0) - 2 * matById(materials, p.carcass).t);

// x position (inside the cabinet) where column i starts
export function columnX(p, materials, i) {
  const t = matById(materials, p.carcass).t;
  let x = t;
  for (let k = 0; k < i; k++) x += p.columns[k].w + t;
  return x;
}

export const hingesFor = (h) => (h <= 90 ? 2 : h <= 150 ? 3 : h <= 200 ? 4 : 5);

// ---------- panels ----------
// part: { name, mat, a, b (cut size), bandA, bandB (edges banded along a / b: 0–2), box, role, color, anim }
// box: { x, y, z, sx, sy, sz } in piece coordinates (for 3D)
// anim: { id, type: 'door'|'drawer'|'flip', ... } — parts with the same anim.id move together in 3D
export function buildPiece(p, materials) {
  const parts = [];
  const hw = { hinge: 0, slide: 0, handle: 0, rodCm: 0, metalLegs: 0, countertopCm: 0, slidingDoor: 0 };
  const extras = []; // non-panel 3D objects: rods, legs, countertop
  const add = (part) => parts.push(part);

  if (p.kind === 'table') return buildTable(p, materials, parts, hw, extras);
  if (p.kind === 'bed') return buildBed(p, materials, parts, hw, extras);

  const cm = matById(materials, p.carcass);
  const fm = matById(materials, p.front);
  const bm = matById(materials, p.back);
  const t = cm.t, ft = fm.t, bt = bm.t;
  const { W, H, D } = p;
  const pl = p.plinth || 0;
  const y0 = pl + t; // inner bottom
  const Hi = innerHeight(p, materials);
  const color = p.color, fcolor = p.frontColor;

  add({ name: 'แผ่นข้าง', mat: cm.id, a: H, b: D, bandA: 1, bandB: 0, box: { x: 0, y: 0, z: 0, sx: t, sy: H, sz: D }, color });
  add({ name: 'แผ่นข้าง', mat: cm.id, a: H, b: D, bandA: 1, bandB: 0, box: { x: W - t, y: 0, z: 0, sx: t, sy: H, sz: D }, color });
  add({ name: 'แผ่นพื้นตู้', mat: cm.id, a: W - 2 * t, b: D, bandA: 1, bandB: 0, box: { x: t, y: pl, z: 0, sx: W - 2 * t, sy: t, sz: D }, color });
  add({ name: 'แผ่นหลังคาตู้', mat: cm.id, a: W - 2 * t, b: D, bandA: 1, bandB: 0, box: { x: t, y: H - t, z: 0, sx: W - 2 * t, sy: t, sz: D }, color });
  add({ name: 'แผ่นหลัง', mat: bm.id, a: H - pl, b: W, bandA: 0, bandB: 0, box: { x: 0, y: pl, z: -bt, sx: W, sy: H - pl, sz: bt }, color: shadeHex(color, -0.08) });
  if (pl > 0) {
    add({ name: 'บังโป๊ฐาน (หน้า)', mat: cm.id, a: W - 2 * t, b: pl, bandA: 1, bandB: 0, box: { x: t, y: 0, z: D - 3 - t, sx: W - 2 * t, sy: pl, sz: t }, color: shadeHex(color, -0.25) });
    add({ name: 'คานฐาน (หลัง)', mat: cm.id, a: W - 2 * t, b: pl, bandA: 0, bandB: 0, box: { x: t, y: 0, z: 2, sx: W - 2 * t, sy: pl, sz: t }, color });
  }
  if (p.countertop) {
    hw.countertopCm += W;
    extras.push({ type: 'box', box: { x: -1, y: H, z: -bt, sx: W + 2, sy: 3, sz: D + bt + ft + 2 }, color: '#a8a29a' });
  }

  const n = p.columns.length;
  const sliding = p.doorStyle === 'sliding';
  // Overlay edges for doors / drawer fronts: outer edge of the cabinet, or the middle of a divider
  const leftEdge = (i) => (i === 0 ? 0 : columnX(p, materials, i) - t / 2);
  const rightEdge = (i) => (i === n - 1 ? W : columnX(p, materials, i) + p.columns[i].w + t / 2);
  const gap = 0.2;

  p.columns.forEach((c, i) => {
    const x = columnX(p, materials, i);
    if (i > 0) {
      add({ name: 'แผ่นกั้นช่อง', mat: cm.id, a: Hi, b: D, bandA: 1, bandB: 0, box: { x: x - t, y: y0, z: 0, sx: t, sy: Hi, sz: D }, color });
    }
    const hasDoor = sliding || (c.door && c.door !== 'none');
    const setback = hasDoor ? 2 : 0;

    c.items.forEach((it) => {
      if (it.kind === 'shelf') {
        add({ name: 'ชั้นวาง', mat: cm.id, a: c.w, b: D - setback, bandA: 1, bandB: 0, box: { x, y: y0 + it.y, z: 0, sx: c.w, sy: t, sz: D - setback }, color: finishById(p.shelfFinish)?.color || color, shelf: true });
      } else if (it.kind === 'rod') {
        hw.rodCm += c.w;
        extras.push({ type: 'rod', from: [x, y0 + it.y, D / 2], to: [x + c.w, y0 + it.y, D / 2] });
      } else if (it.kind === 'drawer') {
        const anim = { id: `${p.id}:${it.id}`, type: 'drawer', dz: Math.max(15, (D - 5) * 0.75) };
        const bd = Math.max(20, Math.floor((D - 5 - (hasDoor ? 3 : 0)) / 5) * 5); // drawer box depth
        const bh = Math.max(6, it.h - 5);
        const bw = c.w - 2.6; // 13 mm slide clearance each side
        const bx = x + 1.3;
        const by = y0 + it.y + 1.5;
        const bz = (hasDoor ? D - 3 : D) - bd;
        hw.slide += 1;
        if (!hasDoor) {
          hw.handle += 1;
          const fx = leftEdge(i) + gap;
          const fw = rightEdge(i) - leftEdge(i) - 2 * gap;
          // the lowest drawer front also covers the bottom panel; the top one the top panel when it reaches it
          const fy = it.y <= 0.5 ? pl + gap : y0 + it.y + gap;
          const fyTop = it.y + it.h >= Hi - 0.5 ? H - gap : y0 + it.y + it.h - gap;
          add({ name: 'หน้าลิ้นชัก', mat: fm.id, a: fw, b: fyTop - fy, bandA: 2, bandB: 2, box: { x: fx, y: fy, z: D, sx: fw, sy: fyTop - fy, sz: ft }, color: fcolor, role: 'front', anim, handle: 'drawer' });
        } else {
          add({ name: 'หน้าลิ้นชักใน', mat: cm.id, a: bw, b: bh, bandA: 1, bandB: 0, box: { x: bx, y: by, z: D - 3, sx: bw, sy: bh, sz: t }, color: shadeHex(color, -0.05), anim });
        }
        add({ name: 'ข้างลิ้นชัก', mat: cm.id, a: bd, b: bh, bandA: 1, bandB: 0, box: { x: bx, y: by, z: bz, sx: t, sy: bh, sz: bd }, color, anim });
        add({ name: 'ข้างลิ้นชัก', mat: cm.id, a: bd, b: bh, bandA: 1, bandB: 0, box: { x: bx + bw - t, y: by, z: bz, sx: t, sy: bh, sz: bd }, color, anim });
        add({ name: 'หัว-ท้ายลิ้นชัก', mat: cm.id, a: bw - 2 * t, b: bh, bandA: 1, bandB: 0, box: { x: bx + t, y: by, z: bz, sx: bw - 2 * t, sy: bh, sz: t }, color, anim });
        add({ name: 'หัว-ท้ายลิ้นชัก', mat: cm.id, a: bw - 2 * t, b: bh, bandA: 1, bandB: 0, box: { x: bx + t, y: by, z: bz + bd - t - (hasDoor ? t : 0), sx: bw - 2 * t, sy: bh, sz: t }, color, anim });
        add({ name: 'ก้นลิ้นชัก', mat: bm.id, a: bw, b: bd, bandA: 0, bandB: 0, box: { x: bx, y: by - bt, z: bz, sx: bw, sy: bt, sz: bd }, color: shadeHex(color, -0.08), anim });
      }
    });

    if (hasDoor && !sliding) {
      const dx = leftEdge(i) + gap;
      const dw = rightEdge(i) - leftEdge(i) - 2 * gap;
      const dy = pl + gap;
      const dh = H - pl - 2 * gap;
      const leaf = (name, lx, lw, hinge) => {
        const anim = { id: `${p.id}:${c.id}:${hinge}:${lx}`, type: hinge === 'top' ? 'flip' : 'door', hinge, pivot: hinge === 'left' ? lx : hinge === 'right' ? lx + lw : dy + dh };
        hw.hinge += hingesFor(hinge === 'top' ? lw : dh);
        hw.handle += 1;
        add({ name, mat: fm.id, a: dh, b: lw, bandA: 2, bandB: 2, box: { x: lx, y: dy, z: D, sx: lw, sy: dh, sz: ft }, color: fcolor, role: 'front', anim, handle: hinge });
      };
      if (c.door === 'double') {
        const lw = dw / 2 - gap / 2;
        leaf('บานประตู', dx, lw, 'left');
        leaf('บานประตู', dx + lw + gap, lw, 'right');
      } else if (c.door === 'flip') {
        leaf('บานยก', dx, dw, 'top');
      } else {
        leaf('บานประตู', dx, dw, c.door);
      }
    }
  });

  if (sliding) {
    const N = Math.max(2, Math.min(4, p.slideCount || 2));
    const ov = 3; // overlap between neighbouring doors
    const pw = (W + (N - 1) * ov) / N;
    const dy = pl + 0.5;
    const dh = H - pl - 1;
    for (let k = 0; k < N; k++) {
      const front = k % 2 === 1;
      const lx = k * (pw - ov);
      const anim = { id: `${p.id}:slide:${k}`, type: 'slide', dx: front ? (k === N - 1 ? -(pw - ov) : pw - ov) * 0.92 : 0 };
      hw.slidingDoor += 1;
      add({ name: 'บานเลื่อน', mat: fm.id, a: dh, b: pw, bandA: 2, bandB: 2, box: { x: lx, y: dy, z: D + (front ? ft + 0.6 : 0.2), sx: pw, sy: dh, sz: ft }, color: fcolor, role: 'front', anim });
    }
    extras.push({ type: 'box', box: { x: 0, y: H - 1.2, z: D, sx: W, sy: 1.2, sz: 2 * ft + 1 }, color: '#a8a29e' });
    extras.push({ type: 'box', box: { x: 0, y: pl, z: D, sx: W, sy: 0.6, sz: 2 * ft + 1 }, color: '#a8a29e' });
  }

  return finish(p, parts, hw, extras);
}

function buildTable(p, materials, parts, hw, extras) {
  const cm = matById(materials, p.carcass);
  const t = cm.t;
  const { W, H, D } = p;
  const color = p.color;
  parts.push({ name: 'หน้าโต๊ะ', mat: cm.id, a: W, b: D, bandA: 2, bandB: 2, box: { x: 0, y: H - t, z: 0, sx: W, sy: t, sz: D }, color: p.frontColor });
  if (p.legs === 'metal') {
    hw.metalLegs += 1;
    const i = 6;
    [[i, i], [W - i, i], [i, D - i], [W - i, D - i]].forEach(([x, z]) => extras.push({ type: 'leg', at: [x, z], h: H - t }));
  } else {
    const li = 3;
    parts.push({ name: 'ขาโต๊ะ (แผ่น)', mat: cm.id, a: H - t, b: D - 6, bandA: 2, bandB: 1, box: { x: li, y: 0, z: 3, sx: t, sy: H - t, sz: D - 6 }, color });
    parts.push({ name: 'ขาโต๊ะ (แผ่น)', mat: cm.id, a: H - t, b: D - 6, bandA: 2, bandB: 1, box: { x: W - li - t, y: 0, z: 3, sx: t, sy: H - t, sz: D - 6 }, color });
  }
  if (p.apron > 0) {
    const ax = p.legs === 'metal' ? 8 : 3 + t;
    const aw = W - 2 * ax;
    parts.push({ name: 'บังตา', mat: cm.id, a: aw, b: p.apron, bandA: 1, bandB: 0, box: { x: ax, y: H - t - p.apron, z: 6, sx: aw, sy: p.apron, sz: t }, color });
  }
  return finish(p, parts, hw, extras);
}

function buildBed(p, materials, parts, hw, extras) {
  const cm = matById(materials, p.carcass);
  const t = cm.t;
  const color = p.color;
  const Wo = p.W + 2 * t + 2; // mattress + 1 cm clearance each side
  const Lo = p.D + 2 * t + 2;
  const railH = p.H + 8; // rails stand 8 cm above the platform
  const headH = Math.max(railH, p.headH || 100);
  parts.push({ name: 'หัวเตียง', mat: matById(materials, p.front).id, a: Wo, b: headH, bandA: 2, bandB: 2, box: { x: 0, y: 0, z: 0, sx: Wo, sy: headH, sz: t }, color: p.frontColor, role: 'front' });
  parts.push({ name: 'ท้ายเตียง', mat: cm.id, a: Wo, b: railH, bandA: 2, bandB: 2, box: { x: 0, y: 0, z: Lo - t, sx: Wo, sy: railH, sz: t }, color });
  parts.push({ name: 'ข้างเตียง', mat: cm.id, a: Lo - 2 * t, b: railH, bandA: 1, bandB: 0, box: { x: 0, y: 0, z: t, sx: t, sy: railH, sz: Lo - 2 * t }, color });
  parts.push({ name: 'ข้างเตียง', mat: cm.id, a: Lo - 2 * t, b: railH, bandA: 1, bandB: 0, box: { x: Wo - t, y: 0, z: t, sx: t, sy: railH, sz: Lo - 2 * t }, color });
  const platW = Wo - 2 * t;
  const platL = Lo - 2 * t;
  const nPanels = Math.max(1, Math.ceil(platW / 118)); // each platform board fits across a 120 cm sheet
  const pw = platW / nPanels;
  for (let k = 0; k < nPanels; k++) {
    parts.push({ name: 'แผ่นรองที่นอน', mat: cm.id, a: platL, b: pw, bandA: 0, bandB: 0, box: { x: t + k * pw, y: p.H - t, z: t, sx: pw - 0.1, sy: t, sz: platL }, color: shadeHex(color, -0.05) });
  }
  const beams = Math.max(1, nPanels - 1) + 1;
  for (let k = 0; k < beams; k++) {
    const bx = t + ((k + 1) * platW) / (beams + 1) - t / 2;
    parts.push({ name: 'คานรับพื้นเตียง', mat: cm.id, a: platL, b: p.H - t, bandA: 0, bandB: 0, box: { x: bx, y: 0, z: t, sx: t, sy: p.H - t, sz: platL }, color });
  }
  return finish(p, parts, hw, extras, { outerW: Wo, outerD: Lo, outerH: headH });
}

function finish(p, parts, hw, extras, outer) {
  parts.forEach((x, i) => {
    x.finish = x.role === 'front' ? p.frontFinish : x.shelf ? p.shelfFinish || p.finish : p.finish;
    x.a = r1(x.a);
    x.b = r1(x.b);
    x.key = `${p.id}:${i}`;
    x.piece = p.id;
  });
  return {
    parts,
    hw,
    extras,
    outer: outer || { outerW: p.W, outerD: p.D + (p.kind === 'box' ? 1 : 0), outerH: p.H + (p.countertop ? 3 : 0) },
  };
}

// Collision check for the 2D editor: elements overlapping in the same column
export function overlaps(p, materials, c) {
  const t = matById(materials, p.carcass).t;
  const spans = c.items.map((it) => ({ id: it.id, lo: it.y, hi: it.y + (it.kind === 'shelf' ? t : it.kind === 'drawer' ? it.h : 3) }));
  const bad = new Set();
  spans.forEach((a, i) => spans.forEach((b, j) => i < j && a.lo < b.hi - 0.05 && b.lo < a.hi - 0.05 && (bad.add(a.id), bad.add(b.id))));
  return bad;
}

// Place a new element in the biggest free gap of a column
export function freeSpot(p, materials, c, kind) {
  const t = matById(materials, p.carcass).t;
  const Hi = innerHeight(p, materials);
  const size = kind === 'drawer' ? 18 : kind === 'shelf' ? t : 3;
  const spans = c.items
    .map((it) => [it.y, it.y + (it.kind === 'shelf' ? t : it.kind === 'drawer' ? it.h : 3)])
    .sort((a, b) => a[0] - b[0]);
  let best = { lo: 0, hi: Hi };
  let bestLen = -1;
  let cur = 0;
  [...spans, [Hi, Hi]].forEach(([lo, hi]) => {
    if (lo - cur > bestLen) {
      bestLen = lo - cur;
      best = { lo: cur, hi: lo };
    }
    cur = Math.max(cur, hi);
  });
  if (kind === 'drawer') return r1(best.lo);
  return r1(Math.max(0, Math.min(Hi - size, (best.lo + best.hi) / 2 - size / 2)));
}

export function shadeHex(hex, amt) {
  const n = parseInt(String(hex || '#cccccc').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const pieceSize = (p) => `${r1(p.W)} × ${r1(p.D)} × ${r1(p.H)} ซม.`;

// ---------- quick configuration (counts → positions) ----------
export const countItems = (c) => ({
  shelves: c.items.filter((i) => i.kind === 'shelf').length,
  rods: c.items.filter((i) => i.kind === 'rod').length,
  drawers: c.items.filter((i) => i.kind === 'drawer').length,
});

// Lay out a column from counts: drawers stacked at the bottom, hanging space at the top, shelves spread evenly
export function autoLayout(p, materials, colIndex, counts) {
  const t = matById(materials, p.carcass).t;
  const Hi = innerHeight(p, materials);
  const drawers = Math.max(0, Math.min(8, counts.drawers));
  let rods = Math.max(0, Math.min(2, counts.rods));
  let shelves = Math.max(0, Math.min(12, counts.shelves));
  const dh = Hi < 100 ? Math.max(10, Math.min(25, Math.floor(Hi / Math.max(1, drawers)) - 1)) : 20;
  const items = [];
  for (let k = 0; k < drawers; k++) items.push({ id: uid(), kind: 'drawer', y: r1(k * (dh + 0.5)), h: dh });
  const base = drawers ? r1(drawers * (dh + 0.5) + (shelves || rods ? 0.5 : 0)) : 0;
  if (drawers && (shelves || rods)) {
    items.push({ id: uid(), kind: 'shelf', y: base });
    shelves = Math.max(0, shelves - 1);
  }
  const floor = drawers && items.length > drawers ? base + t : base;
  let top = Hi;
  if (rods > 0 && Hi - floor < 60) rods = 0;
  if (rods > 0) {
    let rodY = Hi - 6;
    if (shelves > 0 && Hi - floor > 150) {
      items.push({ id: uid(), kind: 'shelf', y: r1(Hi - 30) });
      shelves -= 1;
      rodY = Hi - 36;
    }
    items.push({ id: uid(), kind: 'rod', y: r1(rodY) });
    top = rodY - (rods === 2 ? (rodY - floor) / 2 : 100);
    if (rods === 2) items.push({ id: uid(), kind: 'rod', y: r1(floor + (rodY - floor) / 2 - 4) });
    if (rods === 2) top = floor; // double hanging: no shelves left below
  }
  const span = top - floor;
  if (shelves > 0 && span > 25) {
    const n = Math.min(shelves, Math.floor(span / 18));
    for (let k = 1; k <= n; k++) items.push({ id: uid(), kind: 'shelf', y: r1(Math.min(Hi - t, floor + (k * span) / (n + 1))) });
  }
  return { ...p, columns: p.columns.map((c, i) => (i === colIndex ? { ...c, items } : c)) };
}

// Props for the 3D showroom: folded clothes on shelves, garments on rods
const BOOK = ['#7c2d12', '#1e3a5f', '#e7e2d8', '#3f4a3a', '#a16207', '#57534e', '#9f1239', '#d6d3d1', '#1c1917', '#b45309'];
const SHOE = ['#1c1917', '#78350f', '#f5f5f4', '#44403c', '#9a3412', '#e7e5e4'];
const CLOTH = ['#e7e2d8', '#9aa5b1', '#3f4a5a', '#c9b79c', '#7d8b6a', '#d8c3b0', '#5a5f66', '#efe9e1', '#a6806a', '#2f3640'];
export function decorFor(p, materials) {
  if (p.kind === 'bed') {
    const t = matById(materials, p.carcass).t;
    const x0 = t + 1, z0 = t + 1, y = p.H;
    const out = [
      { type: 'fold', box: { x: x0, y, z: z0, sx: p.W, sy: 22, sz: p.D }, color: '#f4f1ea' },
      { type: 'fold', box: { x: x0 - 3, y: y + 14, z: z0 + p.D * 0.34, sx: p.W + 6, sy: 10, sz: p.D * 0.68 }, color: '#d8cdbd' },
      { type: 'fold', box: { x: x0 - 3.5, y: y + 23, z: z0 + p.D * 0.34, sx: p.W + 7, sy: 2, sz: 38 }, color: '#bfae96' },
    ];
    const n = p.W >= 140 ? 2 : 1;
    const pw = Math.min(65, (p.W - 20) / n - 6);
    for (let k = 0; k < n; k++) out.push({ type: 'fold', box: { x: x0 + 10 + k * ((p.W - 20) / n) + ((p.W - 20) / n - pw) / 2, y: y + 22, z: z0 + 6, sx: pw, sy: 13, sz: 40 }, color: '#fbfaf7' });
    return out;
  }
  if (p.kind !== 'box' || p.D < 25) return [];
  const tpl = p.template || '';
  const style = tpl.startsWith('kitchen') ? 'kitchen' : tpl === 'shoe' ? 'shoes' : tpl === 'bookshelf' || tpl === 'tvCabinet' ? 'books' : 'clothes';
  const t = matById(materials, p.carcass).t;
  const y0 = (p.plinth || 0) + t;
  const Hi = innerHeight(p, materials);
  const out = [];
  let seed = p.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  p.columns.forEach((c, i) => {
    const x = columnX(p, materials, i);
    const els = c.items.map((it) => ({ ...it, top: it.y + (it.kind === 'shelf' ? t : it.kind === 'drawer' ? it.h : 0) })).sort((a, b) => a.y - b.y);
    const surfaces = [{ y: 0 }, ...els.filter((e) => e.kind === 'shelf').map((e) => ({ y: e.top }))];
    surfaces.forEach((sf) => {
      const above = els.filter((e) => e.y >= sf.y - 0.1 && e.y > sf.y + 0.1).sort((a, b) => a.y - b.y)[0];
      const blocked = els.some((e) => e.kind === 'drawer' && e.y <= sf.y + 0.1 && e.top > sf.y);
      if (blocked || (sf.y === 0 && els.some((e) => e.kind === 'drawer' && e.y < 1))) return;
      const clear = (above ? above.y : Hi) - sf.y;
      if (above?.kind === 'rod' || clear < 16 || clear > 90) return;
      const yb = y0 + sf.y;
      if (style === 'books') {
        // a row of books with a gap or two, sometimes a small box
        let bx = x + 2;
        while (bx < x + c.w - 6) {
          if (rnd() < 0.12) {
            bx += 6 + rnd() * 10;
            continue;
          }
          const bw = 2 + rnd() * 2.5;
          const bh = Math.min(clear - 3, 18 + rnd() * 10);
          out.push({ type: 'fold', box: { x: bx, y: yb, z: p.D - 4 - Math.min(22, p.D - 8), sx: bw, sy: bh, sz: Math.min(22, p.D - 8) }, color: BOOK[Math.floor(rnd() * BOOK.length)] });
          bx += bw + 0.3;
        }
        return;
      }
      if (style === 'shoes') {
        const n = Math.floor((c.w - 4) / 22);
        for (let k = 0; k < n; k++) {
          const col = SHOE[Math.floor(rnd() * SHOE.length)];
          const sx = x + 3 + k * ((c.w - 4) / n);
          [0, 9.5].forEach((dx) => out.push({ type: 'fold', box: { x: sx + dx, y: yb, z: p.D - 4 - Math.min(27, p.D - 6), sx: 8.5, sy: Math.min(clear - 2, 9), sz: Math.min(27, p.D - 6) }, color: col }));
        }
        return;
      }
      if (style === 'kitchen') {
        const n = Math.floor((c.w - 4) / 26);
        for (let k = 0; k < n; k++) {
          const sx = x + 3 + k * ((c.w - 4) / n);
          if (k % 2 === 0) for (let l = 0; l < Math.min(6, Math.floor((clear - 4) / 2.2)); l++) out.push({ type: 'fold', box: { x: sx, y: yb + l * 2.2, z: p.D * 0.25, sx: 22, sy: 1.8, sz: 22 }, color: '#f8f7f4' });
          else out.push({ type: 'fold', box: { x: sx + 4, y: yb, z: p.D * 0.3, sx: 10, sy: Math.min(clear - 3, 16), sz: 10 }, color: rnd() < 0.5 ? '#d9c8a6' : '#b8c4c8' });
        }
        return;
      }
      const n = Math.floor((c.w - 4) / 30);
      for (let k = 0; k < n; k++) {
        if (rnd() < 0.25) continue;
        const layers = Math.max(1, Math.min(5, Math.floor((clear - 6) / 5.5) - Math.floor(rnd() * 2)));
        const sw = 24 + rnd() * 3;
        const sx = x + 2 + k * ((c.w - 4) / n) + ((c.w - 4) / n - sw) / 2;
        for (let l = 0; l < layers; l++) {
          out.push({ type: 'fold', box: { x: sx + (rnd() - 0.5) * 1.5, y: yb + l * 5.2, z: p.D * 0.2, sx: sw, sy: 5, sz: Math.min(30, p.D * 0.62) }, color: CLOTH[Math.floor(rnd() * CLOTH.length)] });
        }
      }
    });
    els.filter((e) => e.kind === 'rod' && style === 'clothes').forEach((r) => {
      const below = els.filter((e) => e.top <= r.y && e.kind !== 'rod').reduce((a, e) => Math.max(a, e.top), 0);
      const room = r.y - below - 8;
      if (room < 30) return;
      const n = Math.floor((c.w - 6) / 7);
      for (let k = 0; k < n; k++) {
        if (rnd() < 0.2) continue;
        const len = Math.min(room, 55 + rnd() * 50);
        out.push({ type: 'garment', box: { x: x + 4 + k * ((c.w - 8) / n), y: y0 + r.y - 3 - len, z: p.D / 2 - 21, sx: 1.6, sy: len, sz: Math.min(42, p.D - 14) }, color: CLOTH[Math.floor(rnd() * CLOTH.length)] });
      }
    });
  });
  return out;
}
