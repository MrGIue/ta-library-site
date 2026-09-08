import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const url=process.argv[2];
for (const v of [[1440,900],[1024,800],[390,844],[320,700]]) {
  const p=await b.newPage(); await p.setViewport({width:v[0],height:v[1]});
  await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.evaluate(async()=>{const H=document.body.scrollHeight;
    for(let y=0;y<H;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}window.scrollTo(0,0);});
  await new Promise(r=>setTimeout(r,3000));
  const m=await p.evaluate(()=>{
    const im=[...document.querySelectorAll('.ta-lib .dcard img')];
    const g=document.querySelector('.ta-del .grid');
    return { over: Math.max(0, document.documentElement.scrollWidth-window.innerWidth),
      h: document.body.scrollHeight, imgs: im.length, loaded: im.filter(i=>i.complete&&i.naturalWidth>0).length,
      cols: g?getComputedStyle(g).gridTemplateColumns.split(' ').length:0,
      cards: g?g.children.length:0,
      noHref: [...document.querySelectorAll('.ta-lib a')].filter(a=>!a.getAttribute('href')).length };
  });
  console.log(v[0], JSON.stringify(m));
  if (v[0]===1440) await p.screenshot({path:'delivery/shots/_live_full.png', fullPage:true});
  await p.close();
}
await b.close();
