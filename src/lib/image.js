// Read an image File, downscale it and re-encode as JPEG data URL.
// Keeps photos small enough to store in localStorage (demo backend).
export function compressImage(file, maxSize = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('not-image'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode-failed'));
    };
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; // flatten transparent PNGs
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

// Approximate decoded byte size of a data URL (for UI hints)
export const dataUrlKB = (s) => (s && s.startsWith('data:') ? Math.round((s.length * 3) / 4 / 1024) : 0);

// Photos with a transparent background (cut-outs) are shown "contained" on a soft backdrop
export const isCutout = (url) => typeof url === 'string' && (/^data:image\/png/.test(url) || /\.png(\?|$)/i.test(url));
