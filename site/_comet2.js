(function () {
  'use strict';

  /* ══ the assembly run, v2 ═══════════════════════════════════════════════════
     Same argument as v1 and Joe's own: the analogy is ASSEMBLY, not collection.
     Eleven arc segments float apart, visibly not a thing yet. A comet flies the
     path and seats each one in order until the ring closes and reads as a system.

     What changed, and why. Joe, 2026-09-07: "that graphic isnt quite there, the
     quality and detail needs to be turned up." v1 was a diagram — flat ribbons at
     twelve percent opacity, a nucleus with no light spill, chips floating loose
     with nothing tying them to the ring. Four lifts:

       1. REAL BLOOM. A self-contained bright-pass and blur chain, composited back.
          No post-processing bundle to load: six extra script tags is six more ways
          for a pasted WordPress block to fail, and this scene is all additive
          emissive on near-black, which is the easy case.
       2. The segments are TUBES, not ribbons. Real geometry with normals, so they
          have a lit top and a dark underside and a silhouette that survives bloom.
       3. Every chip is SPOKED to its own segment. A floating label reads as
          separate UI; a label on a leader line reads as part of the machine.
       4. Seating is an EVENT. A shockwave ring and a spark burst, so eleven
          arrivals are eleven moments rather than a slow opacity ramp.

     One engine, three presets, chosen with window.ORBIT_PRESET.
     ═════════════════════════════════════════════════════════════════════════ */

  var PRESETS = {
    // Precision engineering. The ring as an instrument being assembled: strong
    // ticks and spokes, restrained glow, the comet the only truly bright thing.
    instrument: {
      bloom: 0.85, bloomThreshold: 0.30, tube: 0.044, segHot: 0.35,
      spoke: 0.55, tick: 0.55, starAlpha: 0.0, tailAlpha: 0.18, tailScale: 10.0,
      shock: 0.55, shockColor: 0x44C7F4, sparks: 90, heat: 0.0, guides: 0.22,
      tilt: 1.28, dial: 1
    },
    // Cinematic. The glow does the work: wide bloom, a long bright tail, deep
    // star field. The ring closing is the payoff shot.
    deepfield: {
      bloom: 1.45, bloomThreshold: 0.20, tube: 0.078, segHot: 0.55,
      spoke: 0.20, tick: 0.24, starAlpha: 0.62, tailAlpha: 0.34, tailScale: 14.0,
      shock: 1.0, shockColor: 0x44C7F4, sparks: 150, heat: 0.0, guides: 0.10,
      tilt: 0.70, dial: 0
    },
    // Forged. Each segment arrives white-hot and cools to electric over about a
    // second and a half, with a white shockwave and a spark burst on impact.
    forge: {
      bloom: 1.35, bloomThreshold: 0.22, tube: 0.086, segHot: 0.5,
      spoke: 0.22, tick: 0.26, starAlpha: 0.5, tailAlpha: 0.30, tailScale: 13.0,
      shock: 1.25, shockColor: 0xFFF3E2, sparks: 260, heat: 1.0, guides: 0.10,
      tilt: 0.70, dial: 0
    }
  };
  var CFG = PRESETS[window.ORBIT_PRESET] || PRESETS.deepfield;

  var STAGES = [
    { n: 'Profile', g: 2 }, { n: 'Content', g: 3 }, { n: 'Engagement', g: 1 },
    { n: 'Prospecting', g: 1 }, { n: 'Offers', g: 2 }, { n: 'Objections', g: 1 },
    { n: 'Proof', g: 1 }
  ];
  var GUIDE_STAGE = [], STAGE_FIRST = [];
  STAGES.forEach(function (s, si) {
    STAGE_FIRST.push(GUIDE_STAGE.length);
    for (var i = 0; i < s.g; i++) GUIDE_STAGE.push(si);
  });
  var N = GUIDE_STAGE.length;

  var host = document.getElementById('orbit'), cv = document.getElementById('path');
  var hK = document.getElementById('hK'), hN = document.getElementById('hN'),
      hS = document.getElementById('hS'), hBar = document.getElementById('hBar');
  var segs = STAGES.map(function () { var i = document.createElement('i'); hBar.appendChild(i); return i; });
  var chips = STAGES.map(function (s) {
    var d = document.createElement('div'); d.className = 'chip'; d.textContent = s.n;
    host.appendChild(d); return d;
  });
  if (!window.THREE) { cv.style.display = 'none'; return; }

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x06101F, 1);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  // Tighter FOV and a shorter throw than v1, so the ring fills more of the frame.
  var TILT = CFG.tilt, CAM_D = CFG.dial ? 19.8 : 18.3;
  camera.position.set(0, Math.sin(TILT) * CAM_D, Math.cos(TILT) * CAM_D);
  camera.lookAt(0, 0, 0);

  var R = 4.0, A0 = -Math.PI / 2;          // part 01 sits at 12 o'clock, running clockwise
  var CYAN = 0x44C7F4;
  function ang(t) { return A0 + t * Math.PI * 2; }

  /* ── a flat ribbon arc, still used for the hairline guide rings ── */
  function ribbon(fromT, toT, rad, halfW, seg) {
    var g = new THREE.BufferGeometry(), pos = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var f = fromT + (toT - fromT) * (i / seg), a = ang(f), c = Math.cos(a), s = Math.sin(a);
      pos.push((rad - halfW) * c, 0, (rad - halfW) * s, (rad + halfW) * c, 0, (rad + halfW) * s);
      if (i < seg) { var b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); return g;
  }

  /* ── the segment material: a lit rod, not a line ────────────────────────────
     Basic materials ignore normals, so a tube rendered with one flat colour reads
     exactly like the ribbon it replaced. This shades along the normal so the top
     catches light and the underside falls away, and pushes a hot core through the
     middle that bloom then blows out. uHeat drives the forge preset's cooling. */
  function segMaterial(hot) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.0 }, uHeat: { value: 0.0 }, uHot: { value: hot },
        uGhost: { value: 1.0 },
        uCool: { value: new THREE.Color(CYAN) },
        uWhite: { value: new THREE.Color(0xFFF6EA) }
      },
      vertexShader:
        'varying vec3 vN; varying vec3 vW;' +
        'void main(){ vN = normalize(normalMatrix * normal);' +
        ' vec4 mv = modelViewMatrix * vec4(position,1.0); vW = mv.xyz;' +
        ' gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'varying vec3 vN; varying vec3 vW;' +
        'uniform float uOpacity; uniform float uHeat; uniform float uHot; uniform float uGhost;' +
        'uniform vec3 uCool; uniform vec3 uWhite;' +
        'void main(){' +
        ' vec3 v = normalize(-vW);' +
        // facing the camera is the lit top of the rod; the grazing edge is the rim
        ' float face = clamp(dot(normalize(vN), v), 0.0, 1.0);' +
        ' float rim  = pow(1.0 - face, 2.2);' +
        ' float body = 0.34 + 0.66 * face;' +
        ' float toWhite = (uHot * face + rim * 0.5 + uHeat) * (1.0 - uGhost);' +
        ' vec3 col = mix(uCool, uWhite, clamp(toWhite, 0.0, 1.0));' +
        // solid when seated, outline only while it is still floating
        ' float a = uOpacity * mix(body + rim * 0.85, rim * 2.6, uGhost);' +
        ' gl_FragColor = vec4(col * (1.0 + uHeat * 1.6), a); }'
    });
  }

  /* ── the eleven parts, as real tubes ── */
  var GAP = 0.010;                         // the seam that makes them read as separate pieces
  var parts = [], seat = new Float32Array(N), heat = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    var span = (1 / N - GAP * 2) * Math.PI * 2;
    var g = new THREE.TorusGeometry(R, CFG.tube, 14, 90, span);
    g.rotateX(Math.PI / 2);                // torus angle now equals world angle
    var m = new THREE.Mesh(g, segMaterial(CFG.segHot));
    m.rotation.y = -(ang(i / N + GAP));    // rotating by -a shifts the start to a
    m.renderOrder = 4; scene.add(m); parts.push(m);
  }

  /* ── two hairline guide rings, so the empty state still reads as an instrument ── */
  [R * 1.20, R * 0.64].forEach(function (rr) {
    var g = new THREE.Mesh(ribbon(0, 1, rr, 0.004, 240),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true,
        opacity: CFG.guides, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        depthWrite: false }));
    g.renderOrder = 1; scene.add(g);
  });

  /* ── a station tick at every seam, so you can see where a part still has to go ── */
  var ticks = [];
  for (var i = 0; i < N; i++) {
    var a = ang(i / N);
    var t = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.014),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true,
        opacity: CFG.tick, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        depthWrite: false }));
    t.rotation.x = -Math.PI / 2; t.rotation.z = -a;
    t.position.set(Math.cos(a) * (R + 0.38), 0, Math.sin(a) * (R + 0.38));
    t.renderOrder = 2; scene.add(t); ticks.push(t);
  }

  /* ── the dial's graduated scale, instrument preset only ── */
  if (CFG.dial) {
    for (var i = 0; i < 88; i++) {
      var a = ang(i / 88), major = i % 8 === 0;
      var t = new THREE.Mesh(new THREE.PlaneGeometry(major ? 0.30 : 0.15, 0.010),
        new THREE.MeshBasicMaterial({ color: CYAN, transparent: true,
          opacity: major ? 0.42 : 0.17, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending, depthWrite: false }));
      t.rotation.x = -Math.PI / 2; t.rotation.z = -a;
      t.position.set(Math.cos(a) * (R * 1.06), 0, Math.sin(a) * (R * 1.06));
      t.renderOrder = 1; scene.add(t);
    }
  }

  /* ── a spoke from every stage label to its own first segment ─────────────────
     v1 left the chips floating. A label with nothing joining it to the ring reads
     as an overlay someone dropped on top of a render; a label on a leader line is
     part of the same object. Joe has called this out before on other graphics. */
  var spokes = STAGE_FIRST.map(function (gi) {
    var a = ang((gi + 0.5) / N);
    var geo = new THREE.PlaneGeometry(R * 0.32, 0.026);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: CYAN, transparent: true, opacity: CFG.spoke,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = -a;
    mesh.position.set(Math.cos(a) * (R * 1.145), 0, Math.sin(a) * (R * 1.145));
    mesh.renderOrder = 2; scene.add(mesh);
    return mesh;
  });

  /* ── a shockwave ring, fired when a part seats ── */
  var WAVES = 4, waves = [];
  for (var i = 0; i < WAVES; i++) {
    var w = new THREE.Mesh(new THREE.RingGeometry(0.30, 0.34, 56), new THREE.MeshBasicMaterial({
      color: CFG.shockColor, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    w.rotation.x = -Math.PI / 2; w.renderOrder = 6; w.visible = false;
    scene.add(w); waves.push({ mesh: w, t: 1 });
  }
  var waveNext = 0;
  function fireWave(x, z) {
    if (CFG.shock <= 0) return;
    var w = waves[waveNext]; waveNext = (waveNext + 1) % WAVES;
    w.mesh.position.set(x, 0.002, z); w.mesh.visible = true; w.t = 0;
  }

  /* ── a crisp point shader for stars, coma, tails and sparks ── */
  function pointMat(scale, alpha) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPR: { value: DPR }, uScale: { value: scale }, uAlpha: { value: alpha } },
      vertexShader:
        'attribute float aAge; attribute float aSize; attribute float aKind;' +
        'varying float vAge; varying float vKind; uniform float uPR; uniform float uScale;' +
        'void main(){ vAge=aAge; vKind=aKind;' +
        ' vec4 mv = modelViewMatrix * vec4(position,1.0);' +
        ' gl_PointSize = aSize * (1.0 - aAge*0.45) * uPR * uScale / -mv.z;' +
        ' gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'varying float vAge; varying float vKind; uniform float uAlpha;' +
        'void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c);' +
        // a tight crisp core, never a soft gradient blob — density carries the glow
        ' float core = smoothstep(0.5, 0.02, d); core = pow(core, 2.4);' +
        ' float a = core * (1.0 - vAge); a *= a * uAlpha;' +
        ' if (a < 0.003) discard;' +
        ' vec3 hot  = vec3(1.00, 1.00, 0.99);' +
        ' vec3 dust = vec3(0.66, 0.87, 1.00);' +
        ' vec3 ion  = vec3(0.24, 0.75, 1.00);' +
        ' vec3 col = mix(dust, ion, clamp(vKind, 0.0, 1.0));' +
        ' col = mix(hot, col, clamp(vAge * 2.6, 0.0, 1.0));' +
        ' gl_FragColor = vec4(col, a); }'
    });
  }

  /* ── the star field, in two parallax shells ── */
  (CFG.starAlpha <= 0 ? [] :
   [{ n: 300, near: 7, far: 15, size: 2.0, a: 1.0 },
    { n: 260, near: 15, far: 26, size: 1.3, a: 0.6 }]).forEach(function (shell) {
    var sg = new THREE.BufferGeometry();
    var sp = new Float32Array(shell.n * 3), sa = new Float32Array(shell.n),
        ss = new Float32Array(shell.n), sk = new Float32Array(shell.n);
    for (var i = 0; i < shell.n; i++) {
      var rr = shell.near + Math.random() * (shell.far - shell.near), aa = Math.random() * Math.PI * 2;
      sp[i*3] = Math.cos(aa) * rr; sp[i*3+1] = (Math.random() - .5) * 11; sp[i*3+2] = Math.sin(aa) * rr;
      sa[i] = 0.30 + Math.random() * 0.34;
      ss[i] = shell.size * (0.7 + Math.random() * 1.3);
      sk[i] = Math.random() * .5;
    }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('aAge', new THREE.BufferAttribute(sa, 1));
    sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
    sg.setAttribute('aKind', new THREE.BufferAttribute(sk, 1));
    var pts = new THREE.Points(sg, pointMat(9.0, CFG.starAlpha * shell.a));
    pts.renderOrder = 0; scene.add(pts);
  });

  /* ── the nucleus ── */
  var nucGeo = new THREE.IcosahedronGeometry(0.21, 1);
  var np = nucGeo.attributes.position;
  for (var i = 0; i < np.count; i++) {                       // rough it up so it reads as rock
    var f = 0.74 + Math.random() * 0.5;
    np.setXYZ(i, np.getX(i) * f, np.getY(i) * f, np.getZ(i) * f);
  }
  np.needsUpdate = true; nucGeo.computeVertexNormals();
  var nucleus = new THREE.Mesh(nucGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  nucleus.renderOrder = 12; scene.add(nucleus);
  var halo = new THREE.Mesh(new THREE.CircleGeometry(0.52, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Color(0x9FE0FF) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 uCol;' +
      'void main(){ float d = length(vUv - 0.5) * 2.0;' +
      ' float a = pow(max(0.0, 1.0 - d), 3.0) * 0.40;' +
      ' gl_FragColor = vec4(uCol, a); }'
  }));
  halo.rotation.x = -Math.PI / 2; halo.renderOrder = 11; scene.add(halo);

  /* ── the tails ── */
  var P = 8600, cur = 0;
  var pg = new THREE.BufferGeometry();
  var pPos = new Float32Array(P * 3), pAge = new Float32Array(P),
      pSize = new Float32Array(P), pKind = new Float32Array(P);
  var vx = new Float32Array(P), vy = new Float32Array(P), vz = new Float32Array(P),
      age = new Float32Array(P), life = new Float32Array(P);
  for (var i = 0; i < P; i++) { pAge[i] = 1; life[i] = 1; }
  pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pg.setAttribute('aAge', new THREE.BufferAttribute(pAge, 1));
  pg.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
  pg.setAttribute('aKind', new THREE.BufferAttribute(pKind, 1));
  var tails = new THREE.Points(pg, pointMat(CFG.tailScale, CFG.tailAlpha));
  tails.renderOrder = 8; scene.add(tails);

  function emit(t0h, t1h, n, boost) {
    for (var k = 0; k < n; k++) {
      var i = cur; cur = (cur + 1) % P;
      var u = Math.random();
      var th = t0h + (t1h - t0h) * u;                 // sub-frame position along the arc
      var aa = ang(th), x = Math.cos(aa) * R, z = Math.sin(aa) * R;
      var tx = -Math.sin(aa), tz = Math.cos(aa);
      var ox = Math.cos(aa), oz = Math.sin(aa);       // outward from the hub
      var ion = Math.random() < 0.34;
      var slow = Math.random() < 0.06;                // these stay and form the coma
      var back = slow ? 0.05 : (ion ? 2.90 : 1.90) * (0.6 + Math.random() * 0.8) * boost;
      var out  = slow ? 0.04 : (ion ? 0.60 : 0.10) * (0.5 + Math.random());
      var jit  = slow ? 0.11 : (ion ? 0.03 : 0.34);
      pPos[i*3]   = x + (Math.random() - .5) * 0.10;
      pPos[i*3+1] = (Math.random() - .5) * (ion ? 0.05 : 0.14);
      pPos[i*3+2] = z + (Math.random() - .5) * 0.10;
      vx[i] = -tx * back + ox * out + (Math.random() - .5) * jit;
      vy[i] = (Math.random() - .5) * jit * 0.7;
      vz[i] = -tz * back + oz * out + (Math.random() - .5) * jit;
      life[i] = slow ? 0.40 + Math.random() * 0.30
                     : (ion ? 2.6 + Math.random() * 1.6 : 4.0 + Math.random() * 2.5);
      age[i] = 0;
      pSize[i] = slow ? 2.2 + Math.random() * 2.4
                      : (ion ? 1.5 + Math.random() * 1.7 : 2.4 + Math.random() * 3.6);
      pKind[i] = ion ? 1 : 0;
    }
  }

  /* ── sparks: a hard radial burst at the seam, thrown when a part lands ── */
  function sparkBurst(aa, n) {
    var x = Math.cos(aa) * R, z = Math.sin(aa) * R;
    for (var k = 0; k < n; k++) {
      var i = cur; cur = (cur + 1) % P;
      var dir = Math.random() * Math.PI * 2, up = (Math.random() - .5) * 2.2;
      var sp = 1.6 + Math.random() * 4.4;
      pPos[i*3] = x; pPos[i*3+1] = 0; pPos[i*3+2] = z;
      vx[i] = Math.cos(dir) * sp; vy[i] = up; vz[i] = Math.sin(dir) * sp;
      life[i] = 0.34 + Math.random() * 0.62;
      age[i] = 0;
      pSize[i] = 1.6 + Math.random() * 3.0;
      pKind[i] = 0;                                   // dust colours read hot at low age
    }
  }

  /* ── bloom, self-contained ─────────────────────────────────────────────────
     A bright pass at half resolution, then four ping-pong blur pairs at growing
     radius, composited back over the scene. Loading EffectComposer and
     UnrealBloomPass would mean five more CDN files inside a pasted WordPress
     block, and every one of them is a way for the hero graphic to silently not
     render. Everything here is additive emissive on near-black, which is the
     case a hand-rolled bloom handles well. */
  var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var quadGeo = new THREE.PlaneGeometry(2, 2);
  var quadScene = new THREE.Scene();
  var quad = new THREE.Mesh(quadGeo, null);
  quadScene.add(quad);

  function rt(w, h) {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat, depthBuffer: true
    });
  }
  var rtScene = rt(2, 2), rtA = rt(2, 2), rtB = rt(2, 2);

  var brightMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uCut: { value: CFG.bloomThreshold } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader:
      'varying vec2 vUv; uniform sampler2D tSrc; uniform float uCut;' +
      'void main(){ vec3 c = texture2D(tSrc, vUv).rgb;' +
      ' float l = dot(c, vec3(0.2126,0.7152,0.0722));' +
      // a soft knee, so a segment just under the cut still contributes a little
      ' float k = smoothstep(uCut, uCut + 0.28, l);' +
      ' gl_FragColor = vec4(c * k, 1.0); }'
  });
  var blurMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uStep: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader:
      'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uStep;' +
      'void main(){ vec3 s = texture2D(tSrc, vUv).rgb * 0.2270270270;' +
      ' s += texture2D(tSrc, vUv + uStep * 1.3846153846).rgb * 0.3162162162;' +
      ' s += texture2D(tSrc, vUv - uStep * 1.3846153846).rgb * 0.3162162162;' +
      ' s += texture2D(tSrc, vUv + uStep * 3.2307692308).rgb * 0.0702702703;' +
      ' s += texture2D(tSrc, vUv - uStep * 3.2307692308).rgb * 0.0702702703;' +
      ' gl_FragColor = vec4(s, 1.0); }'
  });
  var compMat = new THREE.ShaderMaterial({
    uniforms: { tBase: { value: null }, tGlow: { value: null }, uAmt: { value: CFG.bloom } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader:
      'varying vec2 vUv; uniform sampler2D tBase; uniform sampler2D tGlow; uniform float uAmt;' +
      'void main(){ vec3 b = texture2D(tBase, vUv).rgb; vec3 g = texture2D(tGlow, vUv).rgb;' +
      ' vec3 c = b + g * uAmt;' +
      // Compress ONLY the range above 1.0. A shoulder applied to the whole frame
      // lifts the near-black ground and the deep navy turns to slate — that is
      // exactly what the first render did.
      ' vec3 over = max(vec3(0.0), c - vec3(1.0));' +
      ' c = min(c, vec3(1.0)) + over / (vec3(1.0) + over);' +
      ' gl_FragColor = vec4(c, 1.0); }'
  });

  function pass(mat, target) {
    quad.material = mat;
    renderer.setRenderTarget(target || null);
    renderer.render(quadScene, quadCam);
  }

  var bw = 2, bh = 2;
  function size() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    var pw = Math.floor(w * DPR), ph = Math.floor(h * DPR);
    bw = Math.max(2, Math.floor(pw / 2)); bh = Math.max(2, Math.floor(ph / 2));
    rtScene.setSize(pw, ph); rtA.setSize(bw, bh); rtB.setSize(bw, bh);
  }
  window.addEventListener('resize', size); size();

  function draw() {
    renderer.setRenderTarget(rtScene);
    renderer.clear();
    renderer.render(scene, camera);

    brightMat.uniforms.tSrc.value = rtScene.texture;
    pass(brightMat, rtA);
    [1, 2, 4, 8].forEach(function (r) {
      blurMat.uniforms.tSrc.value = rtA.texture;
      blurMat.uniforms.uStep.value.set(r / bw, 0);
      pass(blurMat, rtB);
      blurMat.uniforms.tSrc.value = rtB.texture;
      blurMat.uniforms.uStep.value.set(0, r / bh);
      pass(blurMat, rtA);
    });

    compMat.uniforms.tBase.value = rtScene.texture;
    compMat.uniforms.tGlow.value = rtA.texture;
    pass(compMat, null);
  }

  var LAP = 30, head = 0, seated = 0, lastStage = -1, lastIdx = -1;
  var proj = new THREE.Vector3(), t0 = performance.now(), prevHead = 0;
  var hold = 0, lastCount = -1, complete = false;
  var hSuffix = document.createElement('span'); hSuffix.textContent = '/11';

  function placeChips() {
    var w = host.clientWidth, h = host.clientHeight;
    STAGE_FIRST.forEach(function (gi, si) {
      var a = ang((gi + 0.5) / N);
      proj.set(Math.cos(a) * R * 1.30, 0, Math.sin(a) * R * 1.30).project(camera);
      var cw = chips[si].offsetWidth / 2 + 3, ch = chips[si].offsetHeight / 2 + 3;
      chips[si].style.left = Math.max(cw, Math.min(w - cw, (proj.x * .5 + .5) * w)) + 'px';
      chips[si].style.top  = Math.max(ch, Math.min(h - ch, (-proj.y * .5 + .5) * h)) + 'px';
    });
  }

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);      // prime the camera matrices before projecting
  placeChips();

  (function frame(now) {
    // the first rAF timestamp is the FRAME START and can precede the seeded
    // performance.now(), so dt arrives negative. Clamp both ends.
    var dt = Math.min(Math.max((now - t0) / 1000, 0), .05); t0 = now;

    if (hold > 0) {                    // the finished ring holds, whole, before it resets
      hold -= dt;
      if (hold <= 0) {
        for (var i = 0; i < N; i++) { seat[i] = 0; heat[i] = 0; }
        head = 0; prevHead = 0; seated = 0; lastIdx = -1; lastStage = -1;
        lastCount = -1; complete = false;
      }
    } else {
      var local = (head * N) % 1;
      var speed = 0.46 + 0.54 * Math.pow(Math.sin(local * Math.PI), 0.8);
      head = (head + (dt / LAP) * speed) % 1;
      if (head < 0) head += 1;
    }

    var idx = ((Math.floor(head * N) % N) + N) % N;
    var a = ang(head), x = Math.cos(a) * R, z = Math.sin(a) * R;

    if (!complete && idx !== lastIdx) {
      if (lastIdx !== -1) {                                // the part snaps home
        emit(head, head, 150, 1.8);
        sparkBurst(ang(idx / N), CFG.sparks);
        fireWave(Math.cos(ang(idx / N)) * R, Math.sin(ang(idx / N)) * R);
        if (lastIdx >= 0 && lastIdx < N) heat[lastIdx] = CFG.heat;
      }
      if (lastIdx === N - 1 && idx === 0) {                // the eleventh closed the ring
        seated = N; complete = true; hold = 2.6;
        heat[N - 1] = CFG.heat;
      } else {
        lastIdx = idx; seated = idx;
      }
    }

    // seat every part the comet has already passed; the rest float outside the ring
    for (var i = 0; i < N; i++) {
      var want = i < seated ? 1 : 0;
      seat[i] += (want - seat[i]) * Math.min(1, dt * 7.5);
      var s = seat[i];
      parts[i].scale.setScalar(1 + 0.115 * (1 - s));         // slides in radially
      parts[i].position.y = 0.55 * (1 - s);                  // and drops into the plane
      heat[i] = Math.max(0, heat[i] - dt * 0.68);            // white-hot cools to electric
      parts[i].material.uniforms.uOpacity.value = 0.30 + 0.62 * s;
      parts[i].material.uniforms.uGhost.value = 1 - s;
      parts[i].material.uniforms.uHeat.value = heat[i] * s;
      ticks[i].material.opacity = CFG.tick * (0.5 + 1.1 * s);
    }
    spokes.forEach(function (sp, si) {
      var done = complete || si < lastStage || (si === lastStage);
      sp.material.opacity = CFG.spoke * (done ? 1.35 : 0.5);
    });

    for (var i = 0; i < WAVES; i++) {
      var w = waves[i];
      if (w.t >= 1) { w.mesh.visible = false; continue; }
      w.t = Math.min(1, w.t + dt * 3.1);
      var e = 1 - Math.pow(1 - w.t, 3);
      w.mesh.scale.setScalar(0.4 + e * 2.5);
      w.mesh.material.opacity = (1 - w.t) * (1 - w.t) * CFG.shock;
    }

    if (!complete) {
      nucleus.visible = halo.visible = true;
      nucleus.position.set(x, 0, z);
      nucleus.rotation.x += dt * 1.1; nucleus.rotation.y += dt * 1.6;
      halo.position.set(x, 0.001, z);
      halo.scale.setScalar(0.94 + Math.sin(now / 300) * 0.06);
      var span = head - prevHead; if (span < -0.5) span += 1;   // the arc covered this frame
      emit(prevHead, prevHead + span, Math.round(86 + 74 * speed), 1);
      prevHead = head;
    } else {
      nucleus.visible = halo.visible = false;                 // the ring is the subject now
    }

    for (var i = 0; i < P; i++) {
      if (age[i] >= life[i]) { pAge[i] = 1; continue; }
      age[i] += dt;
      var px = pPos[i*3], pz = pPos[i*3+2];
      var rl = Math.sqrt(px * px + pz * pz) || 1;
      var push = (pKind[i] > .5 ? 2.0 : 0.26) * dt;          // solar wind, straight out from the hub
      vx[i] += (px / rl) * push; vz[i] += (pz / rl) * push;
      var drag = 1 - (pKind[i] > .5 ? 0.07 : 0.12) * dt;
      vx[i] *= drag; vy[i] *= drag; vz[i] *= drag;
      pPos[i*3]   = px + vx[i] * dt;
      pPos[i*3+1] = pPos[i*3+1] + vy[i] * dt;
      pPos[i*3+2] = pz + vz[i] * dt;
      pAge[i] = Math.min(1, age[i] / life[i]);
    }
    pg.attributes.position.needsUpdate = true;
    pg.attributes.aAge.needsUpdate = true;
    pg.attributes.aSize.needsUpdate = true;
    pg.attributes.aKind.needsUpdate = true;

    var si = complete ? STAGES.length - 1 : GUIDE_STAGE[idx];
    if (si !== lastStage || complete !== (hK.dataset.done === '1')) {
      lastStage = si;
      hK.dataset.done = complete ? '1' : '0';
      hK.textContent = complete ? 'One Complete System' : 'Parts In Place';
      hS.textContent = complete ? 'All Seven Stages' : STAGES[si].n;
      segs.forEach(function (el, k) { el.dataset.on = (complete || k <= si) ? '1' : '0'; });
      chips.forEach(function (el, k) {
        el.dataset.on = (!complete && k === si) ? '1' : '0';
        el.dataset.done = (complete || k < si) ? '1' : '0';
      });
    }
    if (seated !== lastCount) {
      lastCount = seated;
      hN.textContent = String(seated).padStart(2, '0');
      hN.appendChild(hSuffix);
    }

    placeChips();
    draw();
    requestAnimationFrame(frame);
  })(performance.now());
})();
