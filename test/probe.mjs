import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage();
await p.setViewport({width:1440,height:900});
p.on('console',m=>console.log('CONSOLE:',m.text().slice(0,200)));
p.on('pageerror',e=>console.log('PAGEERROR:',String(e).slice(0,300)));
await p.goto(process.argv[2],{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,3000));
console.log(JSON.stringify(await p.evaluate(()=>{
  const c=document.getElementById('ring');
  const gl=c.getContext('webgl2')||c.getContext('webgl');
  const out={hasThree:!!window.THREE, cw:c.width, ch:c.height,
    css:[c.clientWidth,c.clientHeight], glLost:gl?gl.isContextLost():'nogl'};
  // read the framebuffer straight off the live canvas
  if(gl){ const px=new Uint8Array(4*16); gl.readPixels(c.width>>1, c.height>>1, 4,4, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out.centerPixels=Array.from(px.slice(0,16)); }
  const s=document.createElement('canvas'); s.width=c.width; s.height=c.height;
  const x=s.getContext('2d'); x.drawImage(c,0,0);
  const d=x.getImageData(0,0,s.width,s.height).data;
  let nonzero=0, maxA=0;
  for(let i=3;i<d.length;i+=4){ if(d[i]>8){nonzero++; if(d[i]>maxA)maxA=d[i];} }
  out.paintedPixels=nonzero; out.maxAlpha=maxA;
  return out;
},null,1)));
await b.close();
