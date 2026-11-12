import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlanContent, formatLength } from './shapes';

// Render the plan (no selection handles) to a PNG and download it
export async function exportPng(design, { name, shopName, showLabels }) {
  const pad = 60;
  const { w, d } = design.room;
  const header = 70;
  const vbW = w + pad * 2;
  const vbH = d + pad * 2 + header;
  const scale = Math.min(4, 2400 / Math.max(vbW, vbH)); // px per cm, long side ≤ 2400px
  const pxW = Math.round(vbW * scale);
  const pxH = Math.round(vbH * scale);

  const content = renderToStaticMarkup(createElement(PlanContent, { design, showGrid: true, showLabels, showDims: true }));
  const area = ((w * d) / 10000).toFixed(1);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="${-pad} ${-pad - header} ${vbW} ${vbH}">
    <rect x="${-pad}" y="${-pad - header}" width="${vbW}" height="${vbH}" fill="#ffffff"/>
    <text x="${-pad + 20}" y="${-pad - header + 34}" font-size="26" font-weight="600" fill="#1c1917" font-family="Prompt, sans-serif">${escapeXml(name || 'แบบห้อง')}</text>
    <text x="${-pad + 20}" y="${-pad - header + 60}" font-size="15" fill="#78716c" font-family="Prompt, sans-serif">ขนาดห้อง ${formatLength(w)} × ${formatLength(d)} · ${area} ตร.ม. · ออกแบบด้วย ${escapeXml(shopName || '')}</text>
    ${content}
  </svg>`;

  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${(name || 'design').replace(/[\\/:*?"<>|]+/g, '-')}.png`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}
