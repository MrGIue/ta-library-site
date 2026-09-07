// Click each concept tab, screenshot it, and measure overflow + errors per tab.
// Run: node test/tabs.mjs <url> <outDir>
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const PPT = 'C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer = (await import(pathToFileURL(PPT).href)).default;

const [, , url, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const VIEWS = [
  { name: '1440', width: 1440, height: 900, isMobile: false },
  { name: '390',  width: 390,  height: 844, isMobile: true },
];
const TABS = ['pa', 'pb', 'pc'];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--force-color-profile=srgb', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-gl=angle'],
});
const rows = [];
for (const v of VIEWS) {
  const page = await browser.newPage();
  await page.setViewport({ width: v.width, height: v.height, isMobile: v.isMobile, deviceScaleFactor: v.isMobile ? 2 : 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  page.on('requestfailed', r => errs.push('REQFAIL ' + r.url().slice(0, 80)));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
  for (const t of TABS) {
    const before = errs.length;
    await page.click(`[aria-controls="${t}"]`);
    await new Promise(r => setTimeout(r, 2400));
    const m = await page.evaluate((id) => {
      const p = document.getElementById(id);
      const c = p.querySelector('canvas');
      const svg = p.querySelector('svg');
      return {
        visible: !p.hidden,
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        h: document.documentElement.scrollHeight,
        canvas: c ? `${c.width}x${c.height}` : (svg ? `svg:${svg.childElementCount}` : 'none'),
      };
    }, t);
    await page.screenshot({ path: `${outDir}/${t}-${v.name}.png`, fullPage: v.name === '1440' });
    rows.push({ tab: t, view: v.name, ...m, errs: errs.slice(before, before + 2) });
  }
  await page.close();
}
await browser.close();
console.log('tab  view  vis  overflow  height  paint        errors');
for (const r of rows) {
  console.log(r.tab.padEnd(4), r.view.padEnd(5), String(r.visible).padEnd(5),
    String(r.overflow).padStart(7), String(r.h).padStart(7), String(r.canvas).padStart(12),
    r.errs.length ? '  ' + r.errs.join(' | ') : '  -');
}
const bad = rows.filter(r => r.overflow > 0 || r.errs.length || !r.visible || r.canvas === 'none');
console.log(bad.length ? `\nFAIL: ${bad.length} of ${rows.length}` : `\nPASS: ${rows.length} checks clean`);
