import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
await p.goto(process.argv[2],{waitUntil:'networkidle0'});
await p.evaluate(async()=>{ const H=document.body.scrollHeight;
  for(let y=0;y<H;y+=600){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60)); }
  window.scrollTo(0,0); });
await new Promise(r=>setTimeout(r,1200));
const sel=process.argv[4];
const el=await p.$(sel);
await el.screenshot({path:process.argv[3]});
await b.close();
