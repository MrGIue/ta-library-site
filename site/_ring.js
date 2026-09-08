(function () {
  'use strict';

  /* ══ the ring assembly ══════════════════════════════════════════════════════
     Eleven parts click into one ring, forever, with no seam.

     Joe, 2026-09-07: "lets get rid of the astroid, keep the rings, just speed them
     up on how they fall into place and click in with eachother - we want an
     animation/motion graphic thats an infinite loop that doesnt have a detectable
     clip."

     Three consequences, and each one drove a real change:

       NO COMET. The nucleus, its coma, both tails and the eight-thousand-particle
       emitter are gone. Nothing external places the parts now — they arrive on
       their own, which is a cleaner reading of the argument anyway.

       THE CLICK IS THE EVENT. Each part comes in from outside and slightly ahead
       of its slot, overshoots on a back ease, and settles against its neighbour.
       It flashes white on contact and throws a small shockwave. Eleven of those in
       two and a half seconds is the motion.

       NO DETECTABLE CLIP. The old version snapped from a full ring to an empty one
       in a single frame, which is the seam he saw. Now the parts release in the
       same order they arrived, so a ripple travels the ring and runs straight into
       the next arrival ripple. Every position and every opacity is identical either
       side of the loop point, and the cycle is 4.50s on the nose, so 108 frames at
       24fps is a perfect loop.
     ═════════════════════════════════════════════════════════════════════════ */

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

  /* ── the loop clock ──────────────────────────────────────────────────────── */
  var STEP = 0.20;                 // between one part landing and the next starting
  var DUR = 0.34;                  // how long a single part takes to fly in and settle
  var ASSEMBLE = (N - 1) * STEP + DUR;
  var HOLD = 1.38;                 // the finished ring, held
  // The release is a WAVE, not a switch. Every part letting go at once is a global
  // event and the eye reads it as the loop point however softly it is faded. A
  // ripple travelling the ring in the order the parts arrived flows straight into
  // the next arrival ripple, so what you see is continuous motion around the ring
  // with nothing to mark where one pass ends.
  var STEP_R = 0.05, DUR_R = 0.28;
  var RETURN = (N - 1) * STEP_R + DUR_R;
  var CYCLE = ASSEMBLE + HOLD + RETURN;   // 4.50s exactly, so 108 frames at 24fps loops

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
  // preserveDrawingBuffer only while recording. WebGL clears the drawing buffer
  // after compositing, so a screenshot taken between a manual draw and the next
  // one comes back EMPTY — a black frame with only the DOM labels on it, which
  // looks exactly like an animation bug and is not one. It costs performance, so
  // it is gated on the capture flag and never on for a visitor.
  var renderer = new THREE.WebGLRenderer({
    canvas: cv, antialias: true, alpha: false,
    preserveDrawingBuffer: !!window.__ORBIT_FIXED_DT
  });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x06101F, 1);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  var TILT = 0.70, CAM_D = 17.2;
  camera.position.set(0, Math.sin(TILT) * CAM_D, Math.cos(TILT) * CAM_D);
  camera.lookAt(0, 0, 0);

  var R = 4.0, A0 = -Math.PI / 2;   // part 01 sits at 12 o'clock, running clockwise
  var CYAN = 0x44C7F4;
  function ang(t) { return A0 + t * Math.PI * 2; }

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

  /* ── the segment material: a lit rod, not a line ──
     Basic materials ignore normals, so a tube rendered in one flat colour reads
     exactly like the ribbon it replaced. This shades along the normal, so the rod
     has a lit top and an underside that falls away. uGhost swaps the fill for a
     rim-only outline; uHeat is the white pop on contact. */
  function segMaterials() {
    // ONE uniforms object, shared by both materials, so the per-frame updates in
    // the loop reach the caps without touching them separately.
    var u = {
      uOpacity: { value: 0.0 }, uHeat: { value: 0.0 }, uGhost: { value: 1.0 },
      uHot: { value: 0.55 },
      uCool: { value: new THREE.Color(CYAN) },
      uWhite: { value: new THREE.Color(0xFFF6EA) }
    };
    var vert =
      'varying vec3 vN; varying vec3 vW;' +
      'void main(){ vN = normalize(normalMatrix * normal);' +
      ' vec4 mv = modelViewMatrix * vec4(position,1.0); vW = mv.xyz;' +
      ' gl_Position = projectionMatrix * mv; }';
    var common =
      'varying vec3 vN; varying vec3 vW;' +
      'uniform float uOpacity; uniform float uHeat; uniform float uHot; uniform float uGhost;' +
      'uniform vec3 uCool; uniform vec3 uWhite;' +
      'void main(){' +
      ' vec3 v = normalize(-vW);' +
      ' float face = clamp(dot(normalize(vN), v), 0.0, 1.0);' +
      ' float rim  = pow(1.0 - face, 1.7);' +
      ' float body = 0.34 + 0.66 * face;' +
      ' float toWhite = (uHot * face + rim * 0.5 + uHeat) * (1.0 - uGhost);' +
      ' vec3 col = mix(uCool, uWhite, clamp(toWhite, 0.0, 1.0));';
    function make(alpha) {
      return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: u, vertexShader: vert,
        fragmentShader: common + alpha + ' gl_FragColor = vec4(col * (1.0 + uHeat * 1.8), a); }'
      });
    }
    return {
      uniforms: u,
      // the rod: solid when seated, rim-only outline while it is still floating
      body: make(' float a = uOpacity * mix(body + rim * 0.85, rim * 2.6, uGhost);'),
      // the rounded end: FILL only, never a rim. A sphere shaded with a rim term
      // draws a bright circle, so in the outline state each cap read as a little
      // donut stuck on the end of the pipe. Ghost parts get no caps at all.
      cap:  make(' float a = uOpacity * body * 0.86 * (1.0 - uGhost);')
    };
  }

  /* ── the eleven parts ── */
  var GAP = 0.010;                  // the seam that makes them read as separate pieces
  var parts = [], baseRot = [];
  for (var i = 0; i < N; i++) {
    var span = (1 / N - GAP * 2) * Math.PI * 2;
    var TUBE = 0.078;
    var g = new THREE.TorusGeometry(R, TUBE, 20, 150, span);
    g.rotateX(Math.PI / 2);         // torus angle now equals world angle
    var mats = segMaterials();
    var m = new THREE.Mesh(g, mats.body);
    m.userData.u = mats.uniforms;
    // A torus arc ends in a flat disc, so each of the twenty-two ends reads as a
    // blunt cut. A sphere of the same radius at each end rounds it off. They are
    // children, so they inherit the part's slide, drop and scale for free.
    [0, span].forEach(function (a) {
      var cap = new THREE.Mesh(new THREE.SphereGeometry(TUBE, 16, 12), mats.cap);
      cap.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      cap.renderOrder = 4; m.add(cap);
    });
    baseRot.push(-(ang(i / N + GAP)));
    m.rotation.y = baseRot[i];
    m.renderOrder = 4; scene.add(m); parts.push(m);
  }

  /* ── two hairline guide rings, so the empty state still reads as an instrument ── */
  [R * 1.20, R * 0.64].forEach(function (rr) {
    var g = new THREE.Mesh(ribbon(0, 1, rr, 0.004, 240),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.10,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.renderOrder = 1; scene.add(g);
  });

  /* ── a station tick at every seam, so you can see where a part still has to go ── */
  var ticks = [];
  for (var i = 0; i < N; i++) {
    var a = ang(i / N);
    var t = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.014),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.24,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    t.rotation.x = -Math.PI / 2; t.rotation.z = -a;
    t.position.set(Math.cos(a) * (R + 0.38), 0, Math.sin(a) * (R + 0.38));
    t.renderOrder = 2; scene.add(t); ticks.push(t);
  }

  /* ── a spoke from every stage label to its own first segment ──
     A floating label reads as an overlay dropped on a render; a label on a leader
     line is part of the same object. */
  var spokes = STAGE_FIRST.map(function (gi) {
    var a = ang((gi + 0.5) / N);
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(R * 0.32, 0.026),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.20,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = -a;
    mesh.position.set(Math.cos(a) * (R * 1.145), 0, Math.sin(a) * (R * 1.145));
    mesh.renderOrder = 2; scene.add(mesh);
    return mesh;
  });

  /* ── the shockwave thrown by a part landing ── */
  var WAVES = 6, waves = [];
  for (var i = 0; i < WAVES; i++) {
    var w = new THREE.Mesh(new THREE.RingGeometry(0.30, 0.34, 56), new THREE.MeshBasicMaterial({
      color: CYAN, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    w.rotation.x = -Math.PI / 2; w.renderOrder = 6; w.visible = false;
    scene.add(w); waves.push({ mesh: w, t: 1 });
  }
  var waveNext = 0;
  function fireWave(a) {
    var w = waves[waveNext]; waveNext = (waveNext + 1) % WAVES;
    w.mesh.position.set(Math.cos(a) * R, 0.002, Math.sin(a) * R);
    w.mesh.visible = true; w.t = 0;
  }

  /* ── the star field, in two parallax shells ── */
  function pointMat(scale, alpha) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPR: { value: DPR }, uScale: { value: scale }, uAlpha: { value: alpha } },
      vertexShader:
        'attribute float aAge; attribute float aSize;' +
        'varying float vAge; uniform float uPR; uniform float uScale;' +
        'void main(){ vAge=aAge;' +
        ' vec4 mv = modelViewMatrix * vec4(position,1.0);' +
        ' gl_PointSize = aSize * uPR * uScale / -mv.z;' +
        ' gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'varying float vAge; uniform float uAlpha;' +
        'void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c);' +
        // a tight crisp core, never a soft gradient blob — density carries the glow
        ' float core = smoothstep(0.5, 0.02, d); core = pow(core, 2.4);' +
        ' float a = core * (1.0 - vAge); a *= a * uAlpha;' +
        ' if (a < 0.003) discard;' +
        ' gl_FragColor = vec4(vec3(0.66, 0.87, 1.00), a); }'
    });
  }
  var shells = [];
  [{ n: 300, near: 7, far: 15, size: 2.0, a: 1.0, spin: 0.010 },
   { n: 260, near: 15, far: 26, size: 1.3, a: 0.6, spin: 0.005 }].forEach(function (shell) {
    var sg = new THREE.BufferGeometry();
    var sp = new Float32Array(shell.n * 3), sa = new Float32Array(shell.n), ss = new Float32Array(shell.n);
    for (var i = 0; i < shell.n; i++) {
      var rr = shell.near + Math.random() * (shell.far - shell.near), aa = Math.random() * Math.PI * 2;
      sp[i*3] = Math.cos(aa) * rr; sp[i*3+1] = (Math.random() - .5) * 11; sp[i*3+2] = Math.sin(aa) * rr;
      sa[i] = 0.30 + Math.random() * 0.34;
      ss[i] = shell.size * (0.7 + Math.random() * 1.3);
    }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('aAge', new THREE.BufferAttribute(sa, 1));
    sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
    var pts = new THREE.Points(sg, pointMat(9.0, 0.62 * shell.a));
    pts.renderOrder = 0; scene.add(pts);
    shells.push({ pts: pts, spin: shell.spin });
  });

  /* ── bloom, self-contained ──
     EffectComposer plus UnrealBloomPass would mean five more CDN files inside a
     block that gets pasted into WordPress, and each one is a way for the hero to
     silently not render. This scene is all additive emissive on near-black, which
     is the case a bright-pass-and-blur chain handles well. */
  var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var quadScene = new THREE.Scene();
  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  quadScene.add(quad);

  function rt(w, h) {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat, depthBuffer: true
    });
  }
  var rtScene = rt(2, 2), rtA = rt(2, 2), rtB = rt(2, 2);

  var brightMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uCut: { value: 0.20 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader:
      'varying vec2 vUv; uniform sampler2D tSrc; uniform float uCut;' +
      'void main(){ vec3 c = texture2D(tSrc, vUv).rgb;' +
      ' float l = dot(c, vec3(0.2126,0.7152,0.0722));' +
      ' float k = smoothstep(uCut, uCut + 0.28, l);' +   // a soft knee, so a dim part still contributes
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
    uniforms: { tBase: { value: null }, tGlow: { value: null },
                uAmt: { value: 1.45 }, uFlash: { value: 0.0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader:
      'varying vec2 vUv; uniform sampler2D tBase; uniform sampler2D tGlow;' +
      'uniform float uAmt; uniform float uFlash;' +
      'void main(){ vec3 b = texture2D(tBase, vUv).rgb; vec3 g = texture2D(tGlow, vUv).rgb;' +
      ' vec3 c = b + g * uAmt;' +
      // the pulse that covers the loop point, brightest at the centre of the frame
      ' float r = 1.0 - length(vUv - 0.5) * 1.25;' +
      ' c += vec3(0.62, 0.84, 1.00) * uFlash * clamp(r, 0.0, 1.0);' +
      // compress ONLY what is above 1.0; a shoulder over the whole frame lifts the
      // near-black ground and turns the deep navy to slate
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
  var SS_CAP = 1900;                 // keep the supersampled buffer off a laptop's knees
  function size() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    var pw = Math.floor(w * DPR), ph = Math.floor(h * DPR);
    var ss = Math.max(1, Math.min(2, SS_CAP / Math.max(pw, ph)));
    bw = Math.max(2, Math.floor(pw / 2)); bh = Math.max(2, Math.floor(ph / 2));
    rtScene.setSize(Math.floor(pw * ss), Math.floor(ph * ss));
    rtA.setSize(bw, bh); rtB.setSize(bw, bh);
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

  /* ── easing ──
     backOut overshoots past its target and settles. That overshoot IS the click:
     the part arrives a fraction too far, touches its neighbour, and rocks back. */
  function backOut(u) {
    var c1 = 2.10, c3 = c1 + 1;
    var p = u - 1;
    return 1 + c3 * p * p * p + c1 * p * p;
  }
  function easeInOut(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  var proj = new THREE.Vector3(), t0 = performance.now(), clock = 0;
  var heat = new Float32Array(N), clicked = new Uint8Array(N);
  var lastCount = -1, lastStage = -1, lastDone = -1;
  var hSuffix = document.createElement('span'); hSuffix.textContent = '/11';

  function placeChips() {
    var w = host.clientWidth, h = host.clientHeight;
    STAGE_FIRST.forEach(function (gi, si) {
      var a = ang((gi + 0.5) / N);
      proj.set(Math.cos(a) * R * 1.19, 0, Math.sin(a) * R * 1.19).project(camera);
      var cw = chips[si].offsetWidth / 2 + 14, ch = chips[si].offsetHeight / 2 + 14;
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
    //
    // window.__ORBIT_FIXED_DT makes the loop advance by a fixed step per frame
    // instead of by wall clock, so a recorder can sample every frame no matter how
    // slow its encoder is. Never set in production.
    var dt = window.__ORBIT_FIXED_DT ||
             Math.min(Math.max((now - t0) / 1000, 0), .05);
    t0 = now;

    var prev = clock;
    clock = (clock + dt) % CYCLE;
    if (clock < prev) { for (var i = 0; i < N; i++) clicked[i] = 0; }   // new cycle

    // How far through the return the loop is. 0 for most of the cycle; 1 at the
    // instant the parts are back where they started, which is also the instant the
    // pulse is brightest, so the crossing is not visible.
    var releasing = clock >= ASSEMBLE + HOLD;
    var relT = clock - ASSEMBLE - HOLD;
    // a swell rather than a strobe: the handoff has no discontinuity to hide, so
    // this is a beat, not a mask
    compMat.uniforms.uFlash.value =
      releasing ? Math.sin(Math.min(1, relT / RETURN) * Math.PI) * 0.16 : 0;

    var seated = 0;
    for (var i = 0; i < N; i++) {
      var u, ghost, place;
      if (releasing) {
        var r = Math.min(1, Math.max(0, (relT - i * STEP_R) / DUR_R));
        place = 1 - easeInOut(r);
        ghost = 1 - place;
        seated++;
      } else {
        u = Math.min(1, Math.max(0, (clock - i * STEP) / DUR));
        place = u <= 0 ? 0 : backOut(u);
        ghost = 1 - Math.min(1, u * 1.7);
        if (u >= 1) seated++;
        // the contact moment: fire once, on the frame the part first touches
        if (!clicked[i] && u > 0.60) {
          clicked[i] = 1; heat[i] = 1; fireWave(ang((i + 0.5) / N));
        }
      }

      var m = parts[i];
      m.scale.setScalar(1 + 0.16 * (1 - place));       // slides in radially
      m.position.y = 0.85 * (1 - place);               // and drops into the plane
      m.rotation.y = baseRot[i] - 0.075 * (1 - place); // sliding along until it butts up
      heat[i] = Math.max(0, heat[i] - dt * 3.4);       // the white pop, gone in a third of a second
      var u = m.userData.u;
      u.uGhost.value = ghost;
      u.uHeat.value = heat[i];
      u.uOpacity.value = 0.30 + 0.62 * (1 - ghost);
      ticks[i].material.opacity = 0.24 * (0.6 + 1.2 * (1 - ghost));
    }

    for (var i = 0; i < WAVES; i++) {
      var w = waves[i];
      if (w.t >= 1) { w.mesh.visible = false; continue; }
      w.t = Math.min(1, w.t + dt * 3.4);
      var e = 1 - Math.pow(1 - w.t, 3);
      w.mesh.scale.setScalar(0.4 + e * 2.5);
      w.mesh.material.opacity = (1 - w.t) * (1 - w.t);
    }

    shells.forEach(function (s) { s.pts.rotation.y += s.spin * dt; });

    var complete = clock >= ASSEMBLE;
    var si = complete ? STAGES.length - 1
                      : GUIDE_STAGE[Math.min(N - 1, Math.max(0, seated))];
    var done = complete ? 1 : 0;
    if (si !== lastStage || done !== lastDone) {
      lastStage = si; lastDone = done;
      hK.dataset.done = String(done);
      hK.textContent = complete ? 'One Complete System' : 'Parts In Place';
      hS.textContent = complete ? 'All Seven Stages' : STAGES[si].n;
      segs.forEach(function (el, k) { el.dataset.on = (complete || k <= si) ? '1' : '0'; });
      chips.forEach(function (el, k) {
        el.dataset.on = (!complete && k === si) ? '1' : '0';
        el.dataset.done = (complete || k < si) ? '1' : '0';
      });
      spokes.forEach(function (sp, k) {
        sp.material.opacity = 0.20 * ((complete || k <= si) ? 1.35 : 0.5);
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
