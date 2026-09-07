// Render each page at real viewports, screenshot it, and measure horizontal overflow.
// Run: node test/shot.mjs <baseUrl> <outDir> <page...>
// puppeteer-core is borrowed from Projects/prospecting-cockpit/test/node_modules
// (see CLAUDE.md); NODE_PATH must point there.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const PPT = 'C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer = (await import(pathToFileURL(PPT).href)).default;

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , base, outDir, ...pages] = process.argv;
fs.mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { name: '1440', width: 1440, height: 900, isMobile: false },
  { name: '1024', width: 1024, height: 800, isMobile: false },
  { name: '390',  width: 390,  height: 844, isMobile: true  },
  { name: '320',  width: 320,  height: 720, isMobile: true  },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--force-color-profile=srgb', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-gl=angle'],
});

const report = [];
for (const p of pages) {
  for (const v of VIEWS) {
    const page = await browser.newPage();
    await page.setViewport({ width: v.width, height: v.height, isMobile: v.isMobile, deviceScaleFactor: v.isMobile ? 2 : 1 });
    // headless Chrome reports prefers-reduced-motion: reduce by default, which
    // silently freezes any motion gated on it. Force the real-user value.
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    page.on('requestfailed', r => errs.push('REQFAIL ' + r.url().slice(0, 90)));
    await page.goto(`${base}/${p}`, { waitUntil: 'networkidle0', timeout: 45000 });
    await new Promise(r => setTimeout(r, v.name === '1440' ? 2600 : 1400)); // let motion settle

    const m = await page.evaluate(() => ({
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      h: document.documentElement.scrollHeight,
      noAlt: [...document.images].filter(i => !i.alt && i.alt !== '').length,
      noHref: [...document.querySelectorAll('a')].filter(a => !a.getAttribute('href')).length,
      canvasPainted: (() => {
        const c = document.querySelector('canvas');
        if (!c) return 'none';
        return c.width > 0 && c.height > 0 ? `${c.width}x${c.height}` : 'zero';
      })(),
    }));

    const file = path.join(outDir, `${p.replace(/\W+/g, '_')}-${v.name}.png`);
    await page.screenshot({ path: file, fullPage: v.name === '1440' });
    report.push({ page: p, view: v.name, ...m, errs: errs.slice(0, 3) });
    await page.close();
  }
}
await browser.close();

console.log('page       view  overflow  height  canvas       noAlt noHref  errors');
for (const r of report) {
  console.log(
    r.page.padEnd(10), r.view.padEnd(5),
    String(r.overflow).padStart(8), String(r.h).padStart(7),
    String(r.canvasPainted).padStart(12),
    String(r.noAlt).padStart(6), String(r.noHref).padStart(6),
    r.errs.length ? '  ' + r.errs.join(' | ') : '  -'
  );
}
const bad = report.filter(r => r.overflow > 0 || r.errs.length);
console.log(bad.length ? `\nFAIL: ${bad.length} of ${report.length} checks` : `\nPASS: ${report.length} checks clean`);
