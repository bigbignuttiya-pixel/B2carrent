// Build-time SEO for the rental site (used by vite.config.js).
//
// On every build (Vercel included) it reads the live fleet and shop settings from Supabase and
// writes into the HTML what search engines read without running JavaScript:
//   * title, description, canonical link, Open Graph / Twitter share preview
//   * schema.org JSON-LD: AutoRental business (address, phone, hours, prices) + FAQPage
//   * a plain-Thai summary of the shop inside #root (models with starting prices, services,
//     pickup points, destinations, FAQ, contact). React replaces it as soon as the app starts.
// It also emits /robots.txt and /sitemap.xml. If Supabase cannot be reached, it falls back to the
// sample data in src/data.js, so a build never fails because of SEO.
import { readFileSync } from 'node:fs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const baht = (n) => '฿' + Number(n).toLocaleString('en-US');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

function supabaseConfig(root) {
  const src = readFileSync(new URL('src/lib/supabase.js', root), 'utf8');
  const url = process.env.VITE_SUPABASE_URL || (src.match(/DEFAULT_URL\s*=\s*'([^']*)'/) || [])[1];
  const key = process.env.VITE_SUPABASE_ANON_KEY || (src.match(/DEFAULT_ANON_KEY\s*=\s*'([^']*)'/) || [])[1];
  return url && key ? { url, key } : null;
}

async function fetchTable(cfg, table, query) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(`${cfg.url}/rest/v1/${table}?${query}`, { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` }, signal: ctl.signal });
    if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function loadData(root, opts) {
  const data = await import(new URL('src/data.js', root).href);
  let vehicles = data.INITIAL_VEHICLES;
  let settings = data.DEFAULT_SETTINGS;
  let source = 'src/data.js';
  const cfg = process.env.VITE_DEMO_MODE === 'true' ? null : supabaseConfig(root);
  if (cfg) {
    try {
      const [v, s] = await Promise.all([
        fetchTable(cfg, opts.vehiclesTable, 'select=data,sort_order&order=sort_order'),
        fetchTable(cfg, opts.settingsTable, 'select=data&id=eq.1'),
      ]);
      if (v.length) { vehicles = v.map((r) => r.data); source = 'Supabase'; }
      if (s[0]?.data) settings = { ...settings, ...s[0].data };
    } catch (e) {
      console.warn(`[seo] Supabase unavailable (${e.message}) — using src/data.js`);
    }
  }
  return { vehicles, settings, faqs: data.FAQS || [], destinations: data.DESTINATIONS || [], locations: data.LOCATIONS || [], source };
}

// One line per model: "Honda PCX 160 — 6 คัน — เริ่มต้น ฿450/วัน"
function models(vehicles) {
  const by = new Map();
  for (const v of vehicles) {
    if (!v?.name || !(Number(v.pricePerDay) > 0)) continue;
    const m = by.get(v.name) || { name: v.name, type: v.type, category: v.category, price: Infinity, units: 0, seats: v.seats, engine: v.engineCc, fuel: v.fuelType };
    m.price = Math.min(m.price, Number(v.pricePerDay));
    m.units += 1;
    by.set(v.name, m);
  }
  return [...by.values()].sort((a, b) => (a.type === b.type ? a.price - b.price : a.type === 'Motorcycle' ? -1 : 1));
}

function hours(text) {
  const m = String(text || '').match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
  return m ? { opens: m[1].replace('.', ':').padStart(5, '0'), closes: m[2].replace('.', ':').padStart(5, '0') } : null;
}

function jsonLd(opts, d, list) {
  const s = d.settings;
  const prices = list.map((m) => m.price);
  const h = hours(s.openHours);
  const postal = (String(s.storeAddress || '').match(/\b(\d{5})\b/) || [])[1];
  const sameAs = [s.facebookUrl, /^https?:/.test(s.lineOaId || '') ? s.lineOaId : null].filter(Boolean);
  const business = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': opts.siteUrl + '/#business',
    name: opts.brand,
    alternateName: opts.brandTh,
    url: opts.siteUrl + '/',
    image: opts.siteUrl + opts.ogImage,
    description: opts.description(list),
    telephone: s.storePhone || undefined,
    priceRange: prices.length ? `${baht(Math.min(...prices))}-${baht(Math.max(...prices))} ต่อวัน` : undefined,
    currenciesAccepted: 'THB',
    paymentAccepted: 'PromptPay, เงินสด, โอนเงิน',
    areaServed: { '@type': 'City', name: 'นครศรีธรรมราช' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.storeAddress || undefined,
      addressLocality: 'เมืองนครศรีธรรมราช',
      addressRegion: 'นครศรีธรรมราช',
      postalCode: postal,
      addressCountry: 'TH',
    },
    openingHoursSpecification: h ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: h.opens, closes: h.closes }] : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    makesOffer: list.map((m) => ({
      '@type': 'Offer',
      name: `เช่า ${m.name}`,
      priceCurrency: 'THB',
      price: m.price,
      priceSpecification: { '@type': 'UnitPriceSpecification', price: m.price, priceCurrency: 'THB', unitCode: 'DAY', unitText: 'วัน' },
      itemOffered: { '@type': 'Product', name: m.name, category: m.type === 'Motorcycle' ? 'รถจักรยานยนต์ให้เช่า' : 'รถยนต์ให้เช่า' },
      areaServed: 'นครศรีธรรมราช',
    })),
  };
  const faq = d.faqs.length && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: d.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return [business, faq].filter(Boolean);
}

function staticBody(opts, d, list) {
  const s = d.settings;
  const bikes = list.filter((m) => m.type === 'Motorcycle');
  const cars = list.filter((m) => m.type !== 'Motorcycle');
  const row = (m) => `<li><strong>${esc(m.name)}</strong> — ${m.units > 1 ? `${m.units} คัน — ` : ''}เริ่มต้น ${baht(m.price)}/วัน${m.seats ? ` · ${esc(m.seats)} ที่นั่ง` : ''}${m.fuel ? ` · ${esc(m.fuel)}` : ''}</li>`;
  const t = opts.theme;
  return `<div id="seo-summary" style="max-width:960px;margin:0 auto;padding:24px 16px;font-family:Prompt,system-ui,sans-serif;line-height:1.6;color:${t.fg};background:${t.bg}">
<h1>${esc(opts.h1)}</h1>
<p>${esc(opts.intro)}</p>
${bikes.length ? `<h2>รถมอเตอร์ไซค์ให้เช่า นครศรีธรรมราช</h2><ul>${bikes.map(row).join('')}</ul>` : ''}
${cars.length ? `<h2>รถยนต์ให้เช่า นครศรีธรรมราช</h2><ul>${cars.map(row).join('')}</ul>` : ''}
<h2>บริการของเรา</h2>
<ul>${opts.services.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${d.locations.length ? `<h2>จุดรับ-ส่งรถ</h2><ul>${d.locations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
${d.destinations.length ? `<h2>ขับรถเที่ยวนครศรีธรรมราช: ที่เที่ยวแนะนำ</h2><ul>${d.destinations.map((x) => `<li><strong>${esc(x.name)}</strong>${x.distance ? ` (${esc(x.distance)} จากตัวเมือง)` : ''} — ${esc(x.desc)}</li>`).join('')}</ul>` : ''}
${d.faqs.length ? `<h2>คำถามที่พบบ่อย</h2>${d.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}` : ''}
<h2>ติดต่อ ${esc(opts.brand)}</h2>
<p>${s.storePhone ? `โทร ${esc(s.storePhone)} · ` : ''}${s.openHours ? `เปิด ${esc(s.openHours)} · ` : ''}${esc(s.storeAddress || 'นครศรีธรรมราช')}</p>
</div>`;
}

export function seoPlugin(opts) {
  let root;
  let built = null;
  const ensure = async () => built || (built = loadData(root, opts));
  return {
    name: 'rental-seo',
    configResolved(c) { root = new URL(`file://${c.root.replace(/\/?$/, '/')}`); },
    async transformIndexHtml(html) {
      const d = await ensure();
      const list = models(d.vehicles);
      const desc = opts.description(list);
      const url = opts.siteUrl + '/';
      const og = opts.siteUrl + opts.ogImage;
      const head = [
        `<meta name="description" content="${esc(desc)}" />`,
        `<meta name="keywords" content="${esc(opts.keywords.join(', '))}" />`,
        `<link rel="canonical" href="${esc(url)}" />`,
        `<meta name="robots" content="index, follow, max-image-preview:large" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:locale" content="th_TH" />`,
        `<meta property="og:site_name" content="${esc(opts.brand)}" />`,
        `<meta property="og:title" content="${esc(opts.title)}" />`,
        `<meta property="og:description" content="${esc(desc)}" />`,
        `<meta property="og:url" content="${esc(url)}" />`,
        `<meta property="og:image" content="${esc(og)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        ...jsonLd(opts, d, list).map((o) => `<script type="application/ld+json">${json(o)}</script>`),
      ].join('\n    ');
      console.log(`[seo] ${opts.brand}: ${list.length} models, ${d.vehicles.length} vehicles from ${d.source}`);
      return html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(opts.title)}</title>`)
        .replace(/\s*<meta name="description"[^>]*>/, '')
        .replace('</head>', `    ${head}\n  </head>`)
        .replace(/<div id="root"><\/div>/, `<div id="root">${staticBody(opts, d, list)}</div>`);
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${opts.siteUrl}/sitemap.xml\n` });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${opts.siteUrl}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
      });
    },
  };
}
