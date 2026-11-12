// Render a still image of pieces with the 3D showroom (used offline to make the website's showcase photos)
import { createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import Viewer3D from './Viewer3D';
import { DEFAULT_MATERIALS, newPiece } from './model';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function renderShot({ pieces, width = 1200, height = 800, azimuth = 22, zoom = 1, open = false, wall = '#e8e4dc', quality = 0.86, lift = 0 }) {
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '0', top: '0', width: `${width}px`, height: `${height}px`, zIndex: 9999 });
  document.body.appendChild(host);
  const ref = createRef();
  const root = createRoot(host);
  const list = pieces.map((p) => (p.id ? p : newPiece(p.template, p)));
  const render = (allOpen) =>
    root.render(createElement(Viewer3D, { ref, pieces: list, materials: DEFAULT_MATERIALS, selectedId: null, allOpen, showRoom: true, showDecor: true, wallColor: wall }));
  render(false);
  await wait(900);
  ref.current.setAzimuth(azimuth);
  if (zoom !== 1) ref.current.zoom(zoom);
  if (lift) ref.current.lift?.(lift);
  if (open) {
    render(true);
    await wait(2600);
  }
  await wait(500);
  const png = ref.current.snapshot();
  root.unmount();
  host.remove();
  const img = new Image();
  await new Promise((ok) => ((img.onload = ok), (img.src = png)));
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/jpeg', quality);
}
