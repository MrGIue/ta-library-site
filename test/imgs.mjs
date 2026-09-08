import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
await p.goto(process.argv[2],{waitUntil:'networkidle0'});
// walk the page so lazy images enter the viewport, the way a reader would
await p.evaluate(async()=>{ const H=document.body.scrollHeight;
  for(let y=0;y<H;y+=600){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60)); }
  window.scrollTo(0,0); });
await new Promise(r=>setTimeout(r,1500));
console.log(JSON.stringify(await p.evaluate(()=>{
  // .gcard is the pay page, .dcard the delivery page — one harness serves both
  const im=[...document.querySelectorAll('.ta-lib .gcard img, .ta-lib .dcard img')];
  return { count: im.length,
    loaded: im.filter(i=>i.complete && i.naturalWidth>0).length,
    natural: im.slice(0,3).map(i=>i.naturalWidth+'x'+i.naturalHeight),
    rendered: im.slice(0,3).map(i=>Math.round(i.getBoundingClientRect().width)+'px') };
})));
await p.screenshot({path:process.argv[3], fullPage:true});
await b.close();
