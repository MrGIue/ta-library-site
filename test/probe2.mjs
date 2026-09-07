import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
p.on('pageerror',e=>console.log('PAGEERROR:',String(e).slice(0,300)));
await p.goto(process.argv[2],{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,2500));
console.log(JSON.stringify(await p.evaluate(()=>{
  const d=window.__dbg; if(!d) return {err:'no __dbg — the IIFE returned early'};
  const {scene,camera,THREE}=d;
  const v=new THREE.Vector3(d.R,0,0).project(camera);
  const v2=new THREE.Vector3(0,0,0).project(camera);
  return {
    children: scene.children.length,
    camPos: camera.position.toArray().map(n=>+n.toFixed(2)),
    camRot: camera.rotation.toArray().slice(0,3).map(n=>+n.toFixed(3)),
    fov: camera.fov, aspect: +camera.aspect.toFixed(3), near: camera.near, far: camera.far,
    projOrigin: v2.toArray().map(n=>+n.toFixed(3)),
    projRingEdge: v.toArray().map(n=>+n.toFixed(3)),
    firstChild: { type: scene.children[0].type,
      visible: scene.children[0].visible,
      matType: scene.children[0].material.type,
      posCount: scene.children[0].geometry.attributes.position.count,
      idxCount: scene.children[0].geometry.index ? scene.children[0].geometry.index.count : 0 },
    rendererSize: [d.renderer.domElement.width, d.renderer.domElement.height],
  };
},null,1)));
await b.close();
