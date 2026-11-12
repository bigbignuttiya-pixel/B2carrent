// Renders the landing page's showcase photos with the studio's 3D engine.
// Usage: npm run dev (port 5173 or set APP=http://localhost:PORT/) then: node scripts/render-showcase.cjs
// Needs Playwright with a Chromium that supports WebGL.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = process.env.APP || 'http://localhost:5173/';
const OUT = path.join(__dirname, '..', 'public', 'showcase');
const ONLY = process.argv[2];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`${APP}#render`);
  const jobs = await page.evaluate(async () => {
    const s = await import('/src/customer/showcase.js');
    const pick = (list, w, h, q) => list.map((x) => ({ id: x.id, w, h, q }));
    return [...pick(s.HERO_SHOTS, 1920, 1080, 0.82), ...pick(s.PRODUCTS, 900, 700, 0.84), ...pick(s.PORTFOLIO, 1400, 940, 0.84)];
  });
  for (const job of jobs) {
    if (ONLY && !job.id.includes(ONLY)) continue;
    const t = Date.now();
    const data = await page.evaluate(async ({ id, w, h, q }) => {
      const s = await import('/src/customer/showcase.js');
      const { renderShot } = await import('/src/studio/renderShot.js');
      const shot = [...s.HERO_SHOTS, ...s.PRODUCTS, ...s.PORTFOLIO].find((x) => x.id === id);
      return renderShot({ pieces: shot.pieces, width: w, height: h, azimuth: shot.azimuth ?? 22, zoom: shot.zoom ?? (id.startsWith('pf-') || id.startsWith('hero') ? 1 : 0.8), open: shot.open, wall: shot.wall, quality: q });
    }, job);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, `${job.id}.jpg`), buf);
    console.log(job.id, `${Math.round(buf.length / 1024)} KB`, `${Date.now() - t} ms`);
  }
  await browser.close();
})();
