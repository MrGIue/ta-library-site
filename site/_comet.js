  /* ── the assembly run ────────────────────────────────── */
  // The analogy is ASSEMBLY, not collection. The ring starts as eleven separate
  // arc segments floating apart from each other — visibly not a thing yet. The
  // comet flies the path and seats each segment as it passes, in order, until
  // the eleven close into one complete ring. An open ring reads as incomplete;
  // a closed one reads as a system.
  //
  // It lives in a dark viewport because a coma and a tail are additive light and
  // do not exist against white. The loop runs on every machine: Windows
  // "Animation effects: off" reports prefers-reduced-motion and froze an earlier build.
  var STAGES = [
    { n:'Profile', g:2 }, { n:'Content', g:3 }, { n:'Engagement', g:1 },
    { n:'Prospecting', g:1 }, { n:'Offers', g:2 }, { n:'Objections', g:1 }, { n:'Proof', g:1 }
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
  var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setPixelRatio(DPR); renderer.setClearAlpha(0);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  var TILT = 0.72, CAM_D = 18.3;
  camera.position.set(0, Math.sin(TILT) * CAM_D, Math.cos(TILT) * CAM_D);
  camera.lookAt(0, 0, 0);

  var R = 4.0, A0 = -Math.PI / 2;        // part 01 sits at 12 o'clock, running clockwise
  var CYAN = 0x44C7F4;
  function ang(t) { return A0 + t * Math.PI * 2; }

  function arc(fromT, toT, rad, halfW, seg) {
    var g = new THREE.BufferGeometry(), pos = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var f = fromT + (toT - fromT) * (i / seg), a = ang(f), c = Math.cos(a), s = Math.sin(a);
      pos.push((rad - halfW) * c, 0, (rad - halfW) * s, (rad + halfW) * c, 0, (rad + halfW) * s);
      if (i < seg) { var b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); return g;
  }

  /* ── the eleven parts ── */
  var GAP = 0.008;                        // the seam that makes them read as separate pieces
  var parts = [], seat = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    var m = new THREE.Mesh(arc(i / N + GAP, (i + 1) / N - GAP, R, 0.055, 48),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .12, side: THREE.DoubleSide }));
    m.renderOrder = 2; scene.add(m); parts.push(m);
  }
  // two hairline guide rings, so the empty state still reads as an instrument
  [R * 1.17, R * 0.66].forEach(function (rr) {
    var g = new THREE.Mesh(arc(0, 1, rr, 0.004, 240),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .08, side: THREE.DoubleSide }));
    scene.add(g);
  });
  // a station tick at every seam, so you can see where a part still has to go
  var ticks = [];
  for (var i = 0; i < N; i++) {
    var a = ang(i / N);
    var t = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.012),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: .18, side: THREE.DoubleSide }));
    t.rotation.x = -Math.PI / 2; t.rotation.z = -a;
    t.position.set(Math.cos(a) * (R + 0.34), 0, Math.sin(a) * (R + 0.34));
    scene.add(t); ticks.push(t);
  }

  /* ── a crisp point shader for stars, coma and both tails ── */
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
        ' vec3 col = mix(dust, ion, vKind);' +
        ' col = mix(hot, col, clamp(vAge * 2.6, 0.0, 1.0));' +
        ' gl_FragColor = vec4(col, a); }'
    });
  }

  /* ── the star field ── */
  var SF = 420, sg = new THREE.BufferGeometry();
  var sp = new Float32Array(SF * 3), sa = new Float32Array(SF), ss = new Float32Array(SF), sk = new Float32Array(SF);
  for (var i = 0; i < SF; i++) {
    var rr = 7 + Math.random() * 16, aa = Math.random() * Math.PI * 2;
    sp[i*3] = Math.cos(aa) * rr; sp[i*3+1] = (Math.random() - .5) * 11; sp[i*3+2] = Math.sin(aa) * rr;
    sa[i] = 0.30 + Math.random() * 0.34; ss[i] = 1.1 + Math.random() * 2.0; sk[i] = Math.random() * .5;
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('aAge', new THREE.BufferAttribute(sa, 1));
  sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  sg.setAttribute('aKind', new THREE.BufferAttribute(sk, 1));
  scene.add(new THREE.Points(sg, pointMat(9.0, 0.5)));

  /* ── the nucleus ── */
  var nucGeo = new THREE.IcosahedronGeometry(0.20, 1);
  var np = nucGeo.attributes.position;
  for (var i = 0; i < np.count; i++) {                       // rough it up so it reads as rock
    var f = 0.74 + Math.random() * 0.5;
    np.setXYZ(i, np.getX(i) * f, np.getY(i) * f, np.getZ(i) * f);
  }
  np.needsUpdate = true; nucGeo.computeVertexNormals();
  var nucleus = new THREE.Mesh(nucGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  nucleus.renderOrder = 12; scene.add(nucleus);
  var halo = new THREE.Mesh(new THREE.CircleGeometry(0.46, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Color(0x9FE0FF) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 uCol;' +
      'void main(){ float d = length(vUv - 0.5) * 2.0;' +
      ' float a = pow(max(0.0, 1.0 - d), 3.0) * 0.34;' +
      ' gl_FragColor = vec4(uCol, a); }'
  }));
  halo.rotation.x = -Math.PI / 2; halo.renderOrder = 11; scene.add(halo);

  /* ── the tails ── */
  var P = 7200, cur = 0;
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
  var tails = new THREE.Points(pg, pointMat(13.0, 0.26));
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

  function size() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', size); size();

  var LAP = 30, head = 0, seated = 0, lastStage = -1, lastIdx = -1;
  var proj = new THREE.Vector3(), t0 = performance.now(), prevHead = 0;
  var hold = 0, lastCount = -1, complete = false;
  var hSuffix = document.createElement('span'); hSuffix.textContent = '/11';

  function placeChips() {
    var w = host.clientWidth, h = host.clientHeight;
    STAGE_FIRST.forEach(function (gi, si) {
      var a = ang((gi + 0.5) / N);
      proj.set(Math.cos(a) * R * 1.22, 0, Math.sin(a) * R * 1.22).project(camera);
      var cw = chips[si].offsetWidth / 2 + 3, ch = chips[si].offsetHeight / 2 + 3;
      chips[si].style.left = Math.max(cw, Math.min(w - cw, (proj.x * .5 + .5) * w)) + 'px';
      chips[si].style.top  = Math.max(ch, Math.min(h - ch, (-proj.y * .5 + .5) * h)) + 'px';
    });
  }

  renderer.render(scene, camera);      // prime the camera matrices before projecting
  placeChips();

  (function frame(now) {
    // the first rAF timestamp is the FRAME START and can precede the seeded
    // performance.now(), so dt arrives negative. Clamp both ends.
    var dt = Math.min(Math.max((now - t0) / 1000, 0), .05); t0 = now;

    if (hold > 0) {                    // the finished ring holds, whole, before it resets
      hold -= dt;
      if (hold <= 0) {
        for (var i = 0; i < N; i++) seat[i] = 0;
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
      if (lastIdx !== -1) emit(head, head, 150, 1.8);       // the part snaps home
      if (lastIdx === N - 1 && idx === 0) {                 // the eleventh closed the ring
        seated = N; complete = true; hold = 2.6;
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
      parts[i].material.opacity = 0.12 + 0.83 * s;
      ticks[i].material.opacity = 0.18 + 0.5 * s;
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
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  })(performance.now());
