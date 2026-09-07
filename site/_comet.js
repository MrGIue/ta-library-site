  /* ── the comet run ───────────────────────────────────── */
  // A real comet: an irregular nucleus, a coma built from particles rather than a
  // soft blob, and TWO tails — a broad curved dust tail and a narrow ion tail that
  // points away from the hub, which is how a comet actually behaves. It lives in a
  // dark viewport because an additive coma and tail only exist against darkness.
  //
  // The flight IS the content here, so the loop runs on every machine. Windows
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
  var hN = document.getElementById('hN'), hS = document.getElementById('hS'), hBar = document.getElementById('hBar');
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
  var TILT = 0.74, CAM_D = 20.6;
  camera.position.set(0, Math.sin(TILT) * CAM_D, Math.cos(TILT) * CAM_D);
  camera.lookAt(0, 0, 0);

  var R = 4.0, A0 = -Math.PI / 2;        // stop 01 sits at 12 o'clock, running clockwise
  var CYAN = 0x44C7F4;
  function ang(t) { return A0 + t * Math.PI * 2; }

  function band(rad, halfW, seg) {      // real ribbon geometry: gl.LINES is 1px and aliased
    var g = new THREE.BufferGeometry(), pos = [], tt = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var f = i / seg, a = ang(f), c = Math.cos(a), s = Math.sin(a);
      pos.push((rad - halfW) * c, 0, (rad - halfW) * s, (rad + halfW) * c, 0, (rad + halfW) * s);
      tt.push(f, f);
      if (i < seg) { var b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
    g.setIndex(idx); return g;
  }

  var laneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uHead: { value: 0 }, uCol: { value: new THREE.Color(CYAN) } },
    vertexShader: 'attribute float aT; varying float vT;' +
      'void main(){ vT=aT; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying float vT; uniform float uHead; uniform vec3 uCol;' +
      'void main(){ float done = 1.0 - smoothstep(uHead-0.004, uHead+0.0015, vT);' +
      ' gl_FragColor = vec4(uCol, mix(0.13,0.92,done)); }'
  });
  scene.add(new THREE.Mesh(band(R, 0.035, 512), laneMat));
  scene.add(new THREE.Mesh(band(R * 1.16, 0.004, 256),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .10, side: THREE.DoubleSide })));
  scene.add(new THREE.Mesh(band(R * 0.66, 0.004, 256),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .08, side: THREE.DoubleSide })));

  /* ── a crisp point shader used for stars, coma and both tails ── */
  function pointMat(scale) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPR: { value: DPR }, uScale: { value: scale } },
      vertexShader:
        'attribute float aAge; attribute float aSize; attribute float aKind;' +
        'varying float vAge; varying float vKind; uniform float uPR; uniform float uScale;' +
        'void main(){ vAge=aAge; vKind=aKind;' +
        ' vec4 mv = modelViewMatrix * vec4(position,1.0);' +
        ' gl_PointSize = aSize * (1.0 - aAge*0.45) * uPR * uScale / -mv.z;' +
        ' gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'varying float vAge; varying float vKind;' +
        'void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c);' +
        // a tight crisp core, never a soft gradient blob — density carries the glow
        ' float core = smoothstep(0.5, 0.02, d); core = pow(core, 2.4);' +
        ' float a = core * (1.0 - vAge); a *= a;' +
        ' if (a < 0.003) discard;' +
        ' vec3 hot  = vec3(1.00, 1.00, 0.99);' +
        ' vec3 dust = vec3(0.66, 0.87, 1.00);' +
        ' vec3 ion  = vec3(0.24, 0.75, 1.00);' +
        ' vec3 col = mix(dust, ion, vKind);' +
        ' col = mix(hot, col, clamp(vAge * 2.6, 0.0, 1.0));' +
        ' gl_FragColor = vec4(col, a); }'
    });
  }

  /* ── the star field, static and faint ── */
  var SF = 420, sg = new THREE.BufferGeometry();
  var sp = new Float32Array(SF * 3), sa = new Float32Array(SF), ss = new Float32Array(SF), sk = new Float32Array(SF);
  for (var i = 0; i < SF; i++) {
    var rr = 7 + Math.random() * 16, aa = Math.random() * Math.PI * 2;
    sp[i*3] = Math.cos(aa) * rr; sp[i*3+1] = (Math.random() - .5) * 11; sp[i*3+2] = Math.sin(aa) * rr;
    sa[i] = 0.55 + Math.random() * 0.3; ss[i] = 1.2 + Math.random() * 2.2; sk[i] = Math.random() * .5;
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('aAge', new THREE.BufferAttribute(sa, 1));
  sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  sg.setAttribute('aKind', new THREE.BufferAttribute(sk, 1));
  scene.add(new THREE.Points(sg, pointMat(9.0)));

  /* ── the guide markers ── */
  var pods = [], glows = [];
  var podGeo = new THREE.RingGeometry(0.105, 0.145, 40), glowGeo = new THREE.CircleGeometry(0.30, 36);
  for (var i = 0; i < N; i++) {
    var a = ang(i / N), x = Math.cos(a) * R, z = Math.sin(a) * R;
    var pod = new THREE.Mesh(podGeo, new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: .30 }));
    var glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
      color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    pod.rotation.x = -Math.PI / 2; pod.position.set(x, 0.004, z); pod.renderOrder = 4;
    glow.rotation.x = -Math.PI / 2; glow.position.set(x, 0.003, z); glow.renderOrder = 3;
    scene.add(pod); scene.add(glow); pods.push(pod); glows.push(glow);
  }

  /* ── the nucleus: a small irregular body, not a disc ── */
  var nucGeo = new THREE.IcosahedronGeometry(0.155, 1);
  var np = nucGeo.attributes.position;
  for (var i = 0; i < np.count; i++) {                       // rough it up so it reads as rock
    var f = 0.74 + Math.random() * 0.5;
    np.setXYZ(i, np.getX(i) * f, np.getY(i) * f, np.getZ(i) * f);
  }
  np.needsUpdate = true; nucGeo.computeVertexNormals();
  var nucleus = new THREE.Mesh(nucGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  nucleus.renderOrder = 12; scene.add(nucleus);
  var halo = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Color(0x9FE0FF) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 uCol;' +
      'void main(){ float d = length(vUv - 0.5) * 2.0;' +
      ' float a = pow(max(0.0, 1.0 - d), 3.4) * 0.5;' +
      ' gl_FragColor = vec4(uCol, a); }'
  }));
  halo.rotation.x = -Math.PI / 2; halo.renderOrder = 11; scene.add(halo);

  /* ── the tails ── */
  var P = 3000, cur = 0;
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
  var tails = new THREE.Points(pg, pointMat(13.0));
  tails.renderOrder = 8; scene.add(tails);

  function emit(x, z, tx, tz, n, boost) {
    var rl = Math.sqrt(x * x + z * z) || 1, ox = x / rl, oz = z / rl;   // outward from the hub
    for (var k = 0; k < n; k++) {
      var i = cur; cur = (cur + 1) % P;
      var ion = Math.random() < 0.30;
      var slow = Math.random() < 0.22;                                   // these stay and form the coma
      var back = slow ? 0.05 : (ion ? 0.9 : 0.45) * (0.6 + Math.random() * 0.8) * boost;
      var out  = slow ? 0.04 : (ion ? 0.55 : 0.22) * (0.5 + Math.random());
      var jit  = slow ? 0.16 : (ion ? 0.05 : 0.20);
      pPos[i*3]   = x + (Math.random() - .5) * 0.10;
      pPos[i*3+1] = (Math.random() - .5) * (ion ? 0.05 : 0.14);
      pPos[i*3+2] = z + (Math.random() - .5) * 0.10;
      vx[i] = -tx * back + ox * out + (Math.random() - .5) * jit;
      vy[i] = (Math.random() - .5) * jit * 0.7;
      vz[i] = -tz * back + oz * out + (Math.random() - .5) * jit;
      life[i] = slow ? 0.5 + Math.random() * 0.4
                     : (ion ? 1.0 + Math.random() * 0.7 : 1.7 + Math.random() * 1.3);
      age[i] = 0;
      pSize[i] = slow ? 3.0 + Math.random() * 3.0
                      : (ion ? 2.2 + Math.random() * 2.2 : 4.0 + Math.random() * 5.0);
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

  var LAP = 30, head = 0, collected = 0, lastStage = -1, lastIdx = -1;
  var pulse = new Array(N).fill(0), proj = new THREE.Vector3(), t0 = performance.now();

  function placeChips() {
    var w = host.clientWidth, h = host.clientHeight;
    STAGE_FIRST.forEach(function (gi, si) {
      var a = ang(gi / N);
      proj.set(Math.cos(a) * R * 1.30, 0, Math.sin(a) * R * 1.30).project(camera);
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

    var local = (head * N) % 1;
    var speed = 0.46 + 0.54 * Math.pow(Math.sin(local * Math.PI), 0.8);
    head = (head + (dt / LAP) * speed) % 1;
    if (head < 0) head += 1;
    var idx = ((Math.floor(head * N) % N) + N) % N;

    var a = ang(head), x = Math.cos(a) * R, z = Math.sin(a) * R;
    var tx = -Math.sin(a), tz = Math.cos(a);                 // direction of travel

    if (idx !== lastIdx) {
      if (lastIdx !== -1) { pulse[lastIdx] = 1; emit(x, z, tx, tz, 220, 1.9); }  // pickup flare
      lastIdx = idx; collected = idx;
      if (idx === 0) { pulse.fill(0); collected = 0; }
    }
    laneMat.uniforms.uHead.value = head;

    nucleus.position.set(x, 0, z);
    nucleus.rotation.x += dt * 1.1; nucleus.rotation.y += dt * 1.6;
    halo.position.set(x, 0.001, z);
    halo.scale.setScalar(0.94 + Math.sin(now / 300) * 0.06);

    emit(x, z, tx, tz, Math.round(30 + 26 * speed), 1);

    for (var i = 0; i < P; i++) {
      if (age[i] >= life[i]) { pAge[i] = 1; continue; }
      age[i] += dt;
      var px = pPos[i*3], pz = pPos[i*3+2];
      var rl = Math.sqrt(px * px + pz * pz) || 1;
      var push = (pKind[i] > .5 ? 1.35 : 0.42) * dt;         // solar wind, straight out from the hub
      vx[i] += (px / rl) * push; vz[i] += (pz / rl) * push;
      var drag = 1 - (pKind[i] > .5 ? 0.5 : 0.9) * dt;
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

    for (var i = 0; i < N; i++) {
      var got = i < collected;
      pods[i].material.color.setHex(got ? CYAN : 0xFFFFFF);
      pods[i].material.opacity = got ? .95 : .30;
      if (pulse[i] > 0) pulse[i] = Math.max(0, pulse[i] - dt * 1.5);
      glows[i].material.opacity = (got ? .16 : 0) + pulse[i] * .55;
      glows[i].scale.setScalar(1 + (1 - pulse[i]) * pulse[i] * 2.4);
    }

    var si = GUIDE_STAGE[idx];
    if (si !== lastStage) {
      lastStage = si; hS.textContent = STAGES[si].n;
      segs.forEach(function (el, k) { el.dataset.on = k <= si ? '1' : '0'; });
      chips.forEach(function (el, k) {
        el.dataset.on = k === si ? '1' : '0'; el.dataset.done = k < si ? '1' : '0';
      });
    }
    hN.innerHTML = String(collected).padStart(2, '0') + '<span>/11</span>';

    placeChips();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  })(performance.now());
