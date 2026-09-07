import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
p.on('pageerror',e=>console.log('PAGEERROR:',String(e).slice(0,400)));
await p.goto(process.argv[2],{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,2500));
console.log(JSON.stringify(await p.evaluate(()=>{
  const c=document.getElementById('ring');
  const gl=c.getContext('webgl2')||c.getContext('webgl');
  const px=new Uint8Array(4*c.width*c.height);
  gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
  let n=0,samp=[]; for(let i=3;i<px.length;i+=4) if(px[i]>8){ n++; if(samp.length<3) samp.push([px[i-3],px[i-2],px[i-1],px[i]]); }
  const d=window.__dbg;
  const box=d.scene.children[0].geometry.boundingBox ||
    (d.scene.children[0].geometry.computeBoundingBox(), d.scene.children[0].geometry.boundingBox);
  return { frames: window.__frames||0, rendered: window.__rendered||0,
    chipErr: window.__chipErr||null, glPixels:n, samples:samp,
    trackBBox: [box.min.toArray().map(v=>+v.toFixed(2)), box.max.toArray().map(v=>+v.toFixed(2))],
    uHead: d.scene.children[0].material.uniforms.uHead.value };
},null,1)));
await b.close();
