// Contrast audit against the real painted ancestor, plus grid uniformity.
import { pathToFileURL } from 'node:url';
const PPT='C:/Users/jloeb/Projects/prospecting-cockpit/test/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const puppeteer=(await import(pathToFileURL(PPT).href)).default;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=angle','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
await p.goto(process.argv[2],{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,1800));
const out=await p.evaluate(()=>{
  const parse=s=>{const m=s.match(/[\d.]+/g); if(!m) return null;
    return {r:+m[0],g:+m[1],b:+m[2],a:m.length>3?+m[3]:1};};
  const over=(fg,bg)=>({r:fg.r*fg.a+bg.r*(1-fg.a), g:fg.g*fg.a+bg.g*(1-fg.a), b:fg.b*fg.a+bg.b*(1-fg.a), a:1});
  const lin=c=>{c/=255; return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  const L=c=>0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);
  const ratio=(a,b)=>{const x=L(a),y=L(b),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+0.05)/(lo+0.05);};
  function groundOf(el){
    let n=el, stack=[];
    while(n && n!==document.documentElement){
      const c=parse(getComputedStyle(n).backgroundColor);
      if(c && c.a>0){ stack.push(c); if(c.a>=1) break; }
      n=n.parentElement;
    }
    let base={r:255,g:255,b:255,a:1};
    for(let i=stack.length-1;i>=0;i--) base=over(stack[i],base);
    return base;
  }
  const fails=[], seen=[];
  document.querySelectorAll('body *').forEach(el=>{
    const txt=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
    if(!txt) return;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0) return;
    const fg=parse(cs.color); if(!fg) return;
    const bg=groundOf(el);
    const eff=over(fg,bg);
    const size=parseFloat(cs.fontSize), wt=parseInt(cs.fontWeight)||400;
    const large=size>=24||(size>=18.66&&wt>=700);
    const r=ratio(eff,bg), need=large?3:4.5;
    seen.push(1);
    if(r<need) fails.push({t:txt.slice(0,42), col:cs.color, bg:`rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
      size:+size.toFixed(1), wt, r:+r.toFixed(2), need});
  });
  // grid uniformity: any last row left partly empty
  // group children by their actual top offset, so an item spanning every column
  // counts as a full row instead of reading as a stranded single
  const grids=[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).display==='grid'&&e.children.length>2)
    .map(g=>{
      const cs=getComputedStyle(g);
      const cols=cs.gridTemplateColumns.split(' ').filter(Boolean).length;
      const gw=g.getBoundingClientRect().width;
      const rows=new Map();
      [...g.children].forEach(c=>{
        const r=c.getBoundingClientRect();
        if(!r.width) return;
        const key=Math.round(r.top);
        rows.set(key,(rows.get(key)||0)+r.width);
      });
      const keys=[...rows.keys()].sort((a,b)=>a-b);
      const lastFill=keys.length?rows.get(keys[keys.length-1])/gw:1;
      return {cls:g.className||g.tagName, cols, items:g.children.length,
              rows:keys.length, lastFill:+lastFill.toFixed(2),
              stranded: cols>1 && keys.length>1 && lastFill < 0.45};});
  return {checked:seen.length, fails, grids};
});
console.log(`contrast: ${out.checked} text nodes checked, ${out.fails.length} failures`);
out.fails.forEach(f=>console.log(`  FAIL ${f.r}:1 (need ${f.need})  ${f.size}px/${f.wt}  ${f.col} on ${f.bg}  "${f.t}"`));
console.log('\ngrids:');
out.grids.forEach(g=>console.log(`  ${String(g.cls).slice(0,28).padEnd(28)} cols=${g.cols} items=${g.items} rows=${g.rows} lastRowFill=${g.lastFill} ${g.stranded?'STRANDED':'ok'}`));
await b.close();
process.exit(out.fails.length||out.grids.some(g=>g.stranded)?1:0);
