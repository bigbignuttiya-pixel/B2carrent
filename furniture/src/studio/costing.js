// Sheet nesting (guillotine cuts, best-short-side-fit) and project costing
import { buildPiece, matById } from './model';

const r1 = (n) => Math.round(n * 10) / 10;

// parts: [{ id, label, w, h }] (one entry per physical piece). Returns { sheets: [{ placed: [...] }], oversize: [...] }
export function nestSheets(parts, sheetW, sheetH, kerf = 0.4, allowRotate = true) {
  const items = [...parts].sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h);
  const sheets = [];
  const oversize = [];
  const fitsSheet = (w, h) => (w <= sheetW && h <= sheetH) || (allowRotate && h <= sheetW && w <= sheetH);

  for (const it of items) {
    if (!fitsSheet(it.w, it.h)) {
      oversize.push(it);
      continue;
    }
    let best = null;
    const tryIn = (s, si) => {
      s.free.forEach((f, fi) => {
        const opts = [[it.w, it.h, false]];
        if (allowRotate && it.w !== it.h) opts.push([it.h, it.w, true]);
        opts.forEach(([w, h, rot]) => {
          if (w <= f.w + 1e-6 && h <= f.h + 1e-6) {
            const score = Math.min(f.w - w, f.h - h);
            if (!best || score < best.score - 1e-9) best = { si, fi, w, h, rot, score };
          }
        });
      });
    };
    sheets.forEach(tryIn);
    if (!best) {
      sheets.push({ free: [{ x: 0, y: 0, w: sheetW, h: sheetH }], placed: [] });
      tryIn(sheets[sheets.length - 1], sheets.length - 1);
    }
    const s = sheets[best.si];
    const f = s.free[best.fi];
    s.placed.push({ ...it, x: f.x, y: f.y, pw: best.w, ph: best.h, rotated: best.rot });
    s.free.splice(best.fi, 1);
    const rw = f.w - best.w - kerf;
    const rh = f.h - best.h - kerf;
    // split along the shorter leftover so the bigger offcut stays in one piece
    if (f.w - best.w < f.h - best.h) {
      if (rw > 0) s.free.push({ x: f.x + best.w + kerf, y: f.y, w: rw, h: best.h });
      if (rh > 0) s.free.push({ x: f.x, y: f.y + best.h + kerf, w: f.w, h: rh });
    } else {
      if (rw > 0) s.free.push({ x: f.x + best.w + kerf, y: f.y, w: rw, h: f.h });
      if (rh > 0) s.free.push({ x: f.x, y: f.y + best.h + kerf, w: best.w, h: rh });
    }
  }
  return { sheets: sheets.map((s) => ({ placed: s.placed, used: s.placed.reduce((a, p) => a + p.w * p.h, 0) })), oversize };
}

// Everything the cut list, sheet layouts, costing and quotation need, from one pass over the project
export function analyzeProject(design) {
  const pr = design.pricing;
  const materials = pr.materials;
  const pieces = design.items.map((p) => ({ piece: p, ...buildPiece(p, materials) }));

  // Cut list rows: identical parts of the same piece are grouped
  const rows = [];
  pieces.forEach(({ piece, parts }, pi) => {
    const map = new Map();
    parts.forEach((x) => {
      const [L, Wd] = x.a >= x.b ? [x.a, x.b] : [x.b, x.a];
      const [bL, bW] = x.a >= x.b ? [x.bandA, x.bandB] : [x.bandB, x.bandA];
      const k = `${x.name}|${x.mat}|${L}|${Wd}|${bL}|${bW}`;
      if (map.has(k)) map.get(k).qty += 1;
      else map.set(k, { piece: piece.id, pieceNo: pi + 1, pieceName: piece.name, name: x.name, mat: x.mat, L, W: Wd, bandL: bL, bandW: bW, qty: 1 });
    });
    rows.push(...map.values());
  });
  rows.forEach((r, i) => {
    r.no = i + 1;
    r.t = matById(materials, r.mat).t;
    r.areaM2 = (r.L * r.W * r.qty) / 10000;
    r.edgeM = ((r.bandL * r.L + r.bandW * r.W) * r.qty) / 100;
  });

  // Nest each material on its own sheets
  const byMat = {};
  rows.forEach((r) => {
    (byMat[r.mat] ||= []).push(...Array.from({ length: r.qty }, (_, q) => ({ id: `${r.no}-${q}`, label: String(r.no), w: r.L, h: r.W, row: r.no })));
  });
  const sheetArea = pr.sheetW * pr.sheetH;
  const mats = Object.entries(byMat).map(([id, list]) => {
    const m = matById(materials, id);
    const res = nestSheets(list, pr.sheetW, pr.sheetH, Number(pr.kerf) || 0, pr.allowRotate);
    const used = list.reduce((a, x) => a + x.w * x.h, 0);
    const sheets = res.sheets.length + res.oversize.length; // oversized parts need their own (joined/special) sheet
    return {
      id,
      material: m,
      layout: res,
      sheets,
      partArea: used / 10000,
      utilization: res.sheets.length ? used / (res.sheets.length * sheetArea) : 0,
      cost: sheets * (Number(m.price) || 0),
    };
  });
  const matCostById = Object.fromEntries(mats.map((m) => [m.id, m]));

  // Hardware totals
  const hw = { hinge: 0, slide: 0, handle: 0, rodCm: 0, metalLegs: 0, countertopCm: 0, slidingDoor: 0 };
  pieces.forEach((p) => Object.keys(hw).forEach((k) => (hw[k] += p.hw[k])));
  const hwLines = [
    ['บานพับถ้วย', hw.hinge, 'ตัว', pr.hinge],
    ['รางลิ้นชัก', hw.slide, 'คู่', pr.slide],
    ['มือจับ', hw.handle, 'ชิ้น', pr.handle],
    ['ราวแขวนผ้า', r1(hw.rodCm / 100), 'ม.', pr.rodPerM],
    ['ชุดรางบานเลื่อน', hw.slidingDoor, 'บาน', pr.slidingPerDoor],
    ['ขาโต๊ะเหล็ก', hw.metalLegs, 'ชุด', pr.metalLegs],
    ['ท็อปเคาน์เตอร์', r1(hw.countertopCm / 100), 'ม.', pr.countertopPerM],
  ]
    .filter(([, q]) => q > 0)
    .map(([name, qty, unit, price]) => ({ name, qty, unit, price: Number(price) || 0, total: qty * (Number(price) || 0) }));

  const edgeM = rows.reduce((a, r) => a + r.edgeM, 0);
  const totalSheets = mats.reduce((a, m) => a + m.sheets, 0);
  const materialCost = mats.reduce((a, m) => a + m.cost, 0);
  const edgeCost = edgeM * (Number(pr.edgePerM) || 0);
  const hardwareCost = hwLines.reduce((a, l) => a + l.total, 0);
  const laborCost = totalSheets * (Number(pr.laborPerSheet) || 0);
  const install = Number(pr.install) || 0;
  const cost = materialCost + edgeCost + hardwareCost + laborCost + install;
  const margin = 1 + (Number(pr.marginPct) || 0) / 100;

  // Per-piece price: share of each material's sheet cost by part area, plus its own edging and hardware
  const totalArea = rows.reduce((a, r) => a + r.areaM2, 0) || 1;
  const piecePrices = pieces.map(({ piece, hw: phw }) => {
    const own = rows.filter((r) => r.piece === piece.id);
    let c = 0;
    own.forEach((r) => {
      const m = matCostById[r.mat];
      if (m && m.partArea > 0) c += (r.areaM2 / m.partArea) * m.cost;
      c += r.edgeM * (Number(pr.edgePerM) || 0);
    });
    const area = own.reduce((a, r) => a + r.areaM2, 0);
    c += (area / totalArea) * (laborCost + install);
    c += phw.hinge * pr.hinge + phw.slide * pr.slide + phw.handle * pr.handle + (phw.rodCm / 100) * pr.rodPerM + phw.metalLegs * pr.metalLegs + (phw.countertopCm / 100) * pr.countertopPerM + (phw.slidingDoor || 0) * (pr.slidingPerDoor || 0);
    return { id: piece.id, cost: c, price: Math.round(c * margin), area };
  });

  const subtotal = piecePrices.reduce((a, x) => a + x.price, 0);
  const discount = Math.min(subtotal, Number(pr.discount) || 0);
  const afterDiscount = subtotal - discount;
  const vat = Math.round(afterDiscount * ((Number(pr.vatPct) || 0) / 100));
  const total = afterDiscount + vat;

  return {
    pieces,
    rows,
    mats,
    hwLines,
    edgeM,
    totalSheets,
    partArea: totalArea === 1 && !rows.length ? 0 : totalArea,
    sheetArea: sheetArea / 10000,
    materialCost,
    edgeCost,
    hardwareCost,
    laborCost,
    install,
    cost,
    piecePrices,
    subtotal,
    discount,
    vat,
    total,
    profit: afterDiscount - cost,
  };
}

export const money = (n) => Number(Math.round(n || 0)).toLocaleString('th-TH');
export const bandLabel = (r) => {
  const s = [];
  if (r.bandL) s.push(`ยาว ${r.bandL}`);
  if (r.bandW) s.push(`กว้าง ${r.bandW}`);
  return s.length ? s.join(' · ') : '–';
};
