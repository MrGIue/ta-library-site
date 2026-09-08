import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage();
await p.setViewport({width:+process.argv[4]||1440,height:+process.argv[5]||900});
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
await p.goto(process.argv[2],{waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,6000));
await p.screenshot({path:process.argv[3]});
console.log('ok', process.argv[3]);
await b.close();
