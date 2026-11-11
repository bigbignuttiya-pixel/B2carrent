// Background removal for vehicle photos, done in the admin's browser (free, no API key).
// Uses MediaPipe Interactive Segmenter (Apache-2.0): the admin taps the vehicle and the model
// cuts out that object. Loaded lazily the first time the tool is used.

const WASM_PATH = '/mediapipe/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';

let segmenterPromise = null;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, InteractiveSegmenter } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      return InteractiveSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    })().catch((err) => {
      segmenterPromise = null; // allow retry
      throw err;
    });
  }
  return segmenterPromise;
}

export const preloadBackgroundRemover = () => getSegmenter().then(() => true);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = src;
  });
}

/**
 * Cut out the object at (x, y) — normalized 0..1 coordinates of the tap.
 * Returns a transparent PNG data URL cropped to the object (with a small margin), max 1000px.
 */
export async function removeBackground(src, point = { x: 0.5, y: 0.55 }, { maxSize = 1000, threshold = 0.5 } = {}) {
  const [segmenter, img] = await Promise.all([getSegmenter(), loadImage(src)]);

  // Work on a downscaled copy for speed and consistent output size
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const result = segmenter.segment(canvas, { keypoint: { x: point.x, y: point.y } });
  const mask = result.confidenceMasks?.[0];
  if (!mask) throw new Error('no_mask');
  const conf = mask.getAsFloat32Array();
  const mw = mask.width;
  const mh = mask.height;

  const data = ctx.getImageData(0, 0, w, h);
  let minX = w, minY = h, maxX = -1, maxY = -1, kept = 0;
  for (let y = 0; y < h; y++) {
    const my = Math.min(mh - 1, Math.floor((y * mh) / h));
    for (let x = 0; x < w; x++) {
      const mx = Math.min(mw - 1, Math.floor((x * mw) / w));
      const c = conf[my * mw + mx];
      // soft edge: ramp alpha around the threshold
      const a = Math.max(0, Math.min(1, (c - (threshold - 0.15)) / 0.3));
      const i = (y * w + x) * 4 + 3;
      data.data[i] = Math.round(data.data[i] * a);
      if (a > 0.5) {
        kept++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  result.close?.();
  if (!kept || kept < w * h * 0.01) throw new Error('nothing_found');
  ctx.putImageData(data, 0, 0);

  // Crop to the vehicle with a 4% margin
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  const cx = Math.max(0, minX - pad);
  const cy = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad + 1) - cx;
  const ch = Math.min(h, maxY + pad + 1) - cy;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
  return { dataUrl: out.toDataURL('image/png'), coverage: kept / (w * h) };
}

export { isCutout } from './image';
