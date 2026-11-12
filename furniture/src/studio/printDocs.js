// Printable quotation and cut sheet. Opens a new window and starts the print dialog — choose "Save as PDF".
// (Printing from HTML keeps Thai text sharp and selectable in the PDF.)
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FrontDrawing, frontViewBox } from './FrontView';
import SheetLayout from './SheetLayout';
import { bandLabel, money } from './costing';
import { pieceSize, matById } from './model';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const thaiDate = (d = new Date()) => d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

const STYLE = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Prompt, sans-serif; color: #1c1917; font-size: 12px; margin: 0; }
  h1 { font-size: 22px; margin: 0; }
  h2 { font-size: 15px; margin: 18px 0 8px; }
  .muted { color: #78716c; }
  .head { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #1c1917; padding-bottom: 10px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #e7e5e4; padding: 6px 6px; text-align: left; vertical-align: top; }
  th { background: #f5f5f4; font-weight: 600; font-size: 11px; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .tot td { border: none; padding: 3px 6px; }
  .tot .big td { font-size: 16px; font-weight: 700; border-top: 2px solid #1c1917; padding-top: 8px; }
  .thumb { width: 90px; height: 90px; }
  .sheets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .sheet svg { display: block; width: 100%; height: auto; max-height: 300px; }
  .sheet { break-inside: avoid; border: 1px solid #e7e5e4; border-radius: 6px; padding: 6px; }
  .sign { display: flex; justify-content: space-between; margin-top: 40px; gap: 40px; }
  .sign div { flex: 1; text-align: center; border-top: 1px dotted #78716c; padding-top: 6px; }
  .bar { position: fixed; bottom: 16px; right: 16px; }
  @media screen { body { max-width: 900px; margin: 0 auto; padding: 24px 16px 80px; } }
  .bar button { font: inherit; padding: 8px 16px; border-radius: 10px; border: 0; background: #1c1917; color: #fff; cursor: pointer; }
  .pb { break-before: page; }
  @media print { .bar { display: none; } }
`;

function openDoc(title, body) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap" rel="stylesheet">
    <style>${STYLE}</style></head><body>
    <div class="bar"><button onclick="print()">พิมพ์ / บันทึก PDF</button></div>
    ${body}
    <script>document.fonts.ready.then(()=>setTimeout(()=>print(),400))</script></body></html>`);
  w.document.close();
  return true;
}

const pieceThumb = (piece, materials) => {
  const { vb } = frontViewBox(piece, materials, 0.06);
  return `<svg class="thumb" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${renderToStaticMarkup(createElement(FrontDrawing, { piece, materials, showDoors: true, dims: false }))}</svg>`;
};

const shopBlock = (settings) => `
  <div><h1>${esc(settings.shopName)}</h1>
  <div class="muted">${[settings.phone && `โทร ${esc(settings.phone)}`, settings.lineOaId && `LINE ${esc(settings.lineOaId)}`].filter(Boolean).join(' · ')}</div></div>`;

const describe = (piece, materials) => {
  const m = matById(materials, piece.carcass).name;
  const f = matById(materials, piece.front).name;
  const extra = [];
  if (piece.kind === 'box') {
    const doors = piece.columns.filter((c) => c.door !== 'none').length;
    const drawers = piece.columns.reduce((a, c) => a + c.items.filter((i) => i.kind === 'drawer').length, 0);
    const shelves = piece.columns.reduce((a, c) => a + c.items.filter((i) => i.kind === 'shelf').length, 0);
    const rods = piece.columns.reduce((a, c) => a + c.items.filter((i) => i.kind === 'rod').length, 0);
    const acc = (k) => piece.columns.reduce((a, c) => a + c.items.filter((i) => i.kind === k).length, 0);
    extra.push(`${piece.columns.length} ช่อง`);
    if (doors) extra.push(`ช่องมีบาน ${doors}`);
    if (shelves) extra.push(`ชั้น ${shelves}`);
    if (drawers) extra.push(`ลิ้นชัก ${drawers}`);
    if (rods) extra.push(`ราวแขวน ${rods}`);
    if (acc('shoe')) extra.push(`ชั้นรองเท้า ${acc('shoe')}`);
    if (acc('basket')) extra.push(`ตะกร้าลวด ${acc('basket')}`);
    if (acc('pants')) extra.push('ราวกางเกง');
    if (piece.countertop) extra.push('รวมท็อปเคาน์เตอร์');
  }
  return `โครง: ${esc(m)}${f !== m ? `<br>หน้าบาน: ${esc(f)}` : ''}${extra.length ? `<br>${extra.join(' · ')}` : ''}`;
};

export function printQuotation({ design, analysis: A, settings, info }) {
  const materials = design.pricing.materials;
  const rows = design.items
    .map((p, i) => {
      const price = A.piecePrices.find((x) => x.id === p.id)?.price || 0;
      return `<tr><td>${i + 1}</td><td>${pieceThumb(p, materials)}</td>
        <td><b>${esc(p.name)}</b><br><span class="muted">ขนาด ก×ล×ส ${pieceSize(p)}</span><br><span class="muted">${describe(p, materials)}</span></td>
        <td class="num">1</td><td class="num">${money(price)}</td></tr>`;
    })
    .join('');
  const deposit = Number(info.depositPct) || 0;
  const body = `
    <div class="head">${shopBlock(settings)}
      <div style="text-align:right"><h1>ใบเสนอราคา</h1>
        <div>เลขที่ ${esc(info.number)}</div><div>วันที่ ${thaiDate()}</div>
        <div class="muted">ยืนราคา ${esc(info.validDays || 15)} วัน</div></div></div>
    <table style="margin-bottom:12px"><tr>
      <td style="border:none;padding:0"><b>เรียน</b> ${esc(info.customer || '-')}${info.phone ? ` · โทร ${esc(info.phone)}` : ''}
      ${info.site ? `<br><b>สถานที่ติดตั้ง</b> ${esc(info.site)}` : ''}<br><b>โครงการ</b> ${esc(info.project || '')}</td></tr></table>
    <table>
      <thead><tr><th style="width:28px">#</th><th style="width:100px">แบบ</th><th>รายการ</th><th class="num">จำนวน</th><th class="num">ราคา (บาท)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="tot" style="width:55%;margin-left:auto;margin-top:10px">
      <tr><td>รวมเป็นเงิน</td><td class="num">${money(A.subtotal)}</td></tr>
      ${A.discount ? `<tr><td>ส่วนลด</td><td class="num">-${money(A.discount)}</td></tr>` : ''}
      ${A.vat ? `<tr><td>ภาษีมูลค่าเพิ่ม ${esc(design.pricing.vatPct)}%</td><td class="num">${money(A.vat)}</td></tr>` : ''}
      <tr class="big"><td>ยอดรวมทั้งสิ้น</td><td class="num">${money(A.total)} บาท</td></tr>
      ${deposit ? `<tr><td class="muted">มัดจำ ${deposit}%</td><td class="num muted">${money((A.total * deposit) / 100)}</td></tr>` : ''}
    </table>
    <h2>รายละเอียดวัสดุ</h2>
    <div class="muted">ใช้แผ่นไม้มาตรฐาน ${design.pricing.sheetW} × ${design.pricing.sheetH} ซม. รวม ${A.totalSheets} แผ่น ·
      พื้นที่ชิ้นงาน ${A.partArea.toFixed(2)} ตร.ม. · ปิดขอบ ${A.edgeM.toFixed(1)} ม.</div>
    ${info.notes ? `<h2>หมายเหตุ</h2><div style="white-space:pre-wrap">${esc(info.notes)}</div>` : ''}
    <div class="sign"><div>ผู้เสนอราคา</div><div>ผู้อนุมัติสั่งทำ</div></div>`;
  return openDoc(`ใบเสนอราคา ${info.number}`, body);
}

export function printCutSheet({ design, analysis: A, settings, name }) {
  const pr = design.pricing;
  const materials = pr.materials;
  const matSections = A.mats
    .map((m) => {
      const rows = A.rows
        .filter((r) => r.mat === m.id)
        .map((r) => `<tr><td>#${r.no}</td><td>${esc(r.pieceNo)}. ${esc(r.pieceName)}</td><td>${esc(r.name)}</td>
          <td class="num">${r.L}</td><td class="num">${r.W}</td><td class="num">${r.t * 10}</td><td class="num">${r.qty}</td><td>${bandLabel(r)}</td></tr>`)
        .join('');
      const sheets = m.layout.sheets
        .map((s, i) => `<div class="sheet"><div><b>แผ่นที่ ${i + 1}</b> <span class="muted">ใช้ ${Math.round((s.used / (pr.sheetW * pr.sheetH)) * 100)}%</span></div>
          ${renderToStaticMarkup(createElement(SheetLayout, { sheet: s, W: pr.sheetW, H: pr.sheetH, className: '' }))}</div>`)
        .join('');
      const over = m.layout.oversize.length
        ? `<p style="color:#be123c">ชิ้นที่ใหญ่กว่าแผ่นมาตรฐาน (ต้องต่อแผ่น/สั่งพิเศษ): ${m.layout.oversize.map((o) => `#${o.label} ${o.w}×${o.h}`).join(', ')}</p>`
        : '';
      return `<h2>${esc(m.material.name)} — ${m.sheets} แผ่น <span class="muted">(ใช้เนื้อไม้ ${Math.round(m.utilization * 100)}%)</span></h2>
        <table><thead><tr><th>ชิ้น</th><th>เฟอร์นิเจอร์</th><th>ชื่อชิ้นส่วน</th><th class="num">ยาว (ซม.)</th><th class="num">กว้าง (ซม.)</th><th class="num">หนา (มม.)</th><th class="num">จำนวน</th><th>ปิดขอบ</th></tr></thead>
        <tbody>${rows}</tbody></table>${over}
        <div class="sheets" style="margin-top:10px">${sheets}</div>`;
    })
    .join('');
  const pieces = design.items
    .map((p, i) => `<div class="sheet" style="text-align:center">${pieceThumb(p, materials).replace('class="thumb"', 'style="width:100%;height:110px"')}<div><b>${i + 1}. ${esc(p.name)}</b></div><div class="muted">${pieceSize(p)}</div></div>`)
    .join('');
  const body = `
    <div class="head">${shopBlock(settings)}
      <div style="text-align:right"><h1>ใบตัดไม้</h1><div>${esc(name)}</div><div>วันที่ ${thaiDate()}</div></div></div>
    <div class="muted">แผ่นมาตรฐาน ${pr.sheetW} × ${pr.sheetH} ซม. · ระยะใบเลื่อย ${pr.kerf} ซม. · ${pr.allowRotate ? 'หมุนชิ้นงานได้' : 'ไม่หมุนชิ้นงาน (ตามลายไม้)'}
      · รวม ${A.totalSheets} แผ่น · ปิดขอบรวม ${A.edgeM.toFixed(1)} ม.</div>
    <div class="sheets" style="margin-top:10px">${pieces}</div>
    ${matSections}
    ${A.hwLines.length ? `<h2>อุปกรณ์</h2><table><tbody>${A.hwLines.map((l) => `<tr><td>${esc(l.name)}</td><td class="num">${l.qty} ${l.unit}</td></tr>`).join('')}</tbody></table>` : ''}`;
  return openDoc(`ใบตัดไม้ ${name}`, body);
}

export function downloadCutCsv(A, name) {
  const head = ['ชิ้น', 'เฟอร์นิเจอร์', 'ชื่อชิ้นส่วน', 'วัสดุ', 'ยาว (ซม.)', 'กว้าง (ซม.)', 'หนา (มม.)', 'จำนวน', 'ปิดขอบยาว', 'ปิดขอบกว้าง', 'พื้นที่ (ตร.ม.)'];
  const matName = Object.fromEntries(A.mats.map((m) => [m.id, m.material.name]));
  const lines = A.rows.map((r) => [r.no, `${r.pieceNo}. ${r.pieceName}`, r.name, matName[r.mat] || r.mat, r.L, r.W, r.t * 10, r.qty, r.bandL, r.bandW, r.areaM2.toFixed(3)]);
  const csvEsc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + [head, ...lines].map((r) => r.map(csvEsc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${safeName(name)}-cutlist.csv`);
}

export const safeName = (s) => String(s || 'forma').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60);
export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
