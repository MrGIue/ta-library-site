import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:320,height:700});
await p.goto(process.argv[2],{waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,3500));
console.log(JSON.stringify(await p.evaluate(()=>{
  const W=window.innerWidth, out=[];
  document.querySelectorAll('*').forEach(el=>{
    const r=el.getBoundingClientRect();
    if (r.right > W+1 && r.width>0) out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className&&el.className.baseVal!==undefined?el.className.baseVal:String(el.className||'')).slice(0,60),
      right: Math.round(r.right), w: Math.round(r.width),
      inTaLib: !!el.closest('.ta-lib') });
  });
  return out.slice(0,12);
}), null, 1));
await b.close();
