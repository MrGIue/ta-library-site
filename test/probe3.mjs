import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
for (const pref of ['no-preference','reduce']) {
  const p=await b.newPage(); await p.setViewport({width:1440,height:900});
  await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:pref}]);
  await p.goto(process.argv[2],{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,2500));
  const r=await p.evaluate(()=>{
    const c=document.getElementById('ring');
    const gl=c.getContext('webgl2')||c.getContext('webgl');
    const px=new Uint8Array(4*c.width*c.height);
    gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
    let n=0; for(let i=3;i<px.length;i+=4) if(px[i]>8) n++;
    return { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
             glPixels:n, of:c.width*c.height };
  });
  console.log(pref.padEnd(14), JSON.stringify(r));
  await p.close();
}
await b.close();
