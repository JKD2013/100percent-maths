// ============================================================
// 100Percent — "The Descent"
// Custom Three.js scroll-driven camera journey (index page).
// Posture: igloo.inc — one fixed canvas, scroll is the camera
// dolly, the scene never stops moving. Gold on navy abyss.
// ============================================================

/* global THREE, gsap, ScrollTrigger */

(function () {
  'use strict';

  var canvas = document.getElementById('scene');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Renderer / Scene / Camera ----------
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x050a12, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a12, 0.05);

  var camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 120
  );

  // ---------- Lights ----------
  scene.add(new THREE.AmbientLight(0x2c3e57, 0.9));

  var keyLight = new THREE.PointLight(0xd4af37, 2.2, 60);
  keyLight.position.set(5, 4, 7);
  scene.add(keyLight);

  var fillLight = new THREE.PointLight(0xe8edf2, 0.55, 50);
  fillLight.position.set(-6, -3, 4);
  scene.add(fillLight);

  // ---------- The Crystal (hero object) ----------
  var crystal = new THREE.Group();

  var coreGeo = new THREE.IcosahedronGeometry(1.5, 0);
  var coreMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.3,
    roughness: 0.35,
    flatShading: true,
    emissive: 0x6b4f0e,
    emissiveIntensity: 0.55
  });
  var core = new THREE.Mesh(coreGeo, coreMat);
  crystal.add(core);

  var shellLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.66, 0)),
    new THREE.LineBasicMaterial({ color: 0xe8edf2, transparent: true, opacity: 0.16 })
  );
  crystal.add(shellLines);

  var innerLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, 0)),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.35 })
  );
  crystal.add(innerLines);

  scene.add(crystal);

  // ---------- Orbital ring (hero level) ----------
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.012, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xe8edf2, transparent: true, opacity: 0.22 })
  );
  ring.rotation.x = Math.PI / 2.35;
  ring.position.y = 0.2;
  scene.add(ring);

  var ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(4.6, 0.008, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.14 })
  );
  ring2.rotation.x = Math.PI / 1.9;
  ring2.rotation.z = 0.4;
  scene.add(ring2);

  // ---------- Station specimens (the descent) ----------
  // Positioned along the camera path; DOM captions align with these.
  var stationDefs = [
    { y: -11.5, x: 2.3, type: 'octa' },
    { y: -21.0, x: -2.3, type: 'knot' },
    { y: -30.5, x: 2.3, type: 'dodeca' }
  ];

  var stations = [];
  stationDefs.forEach(function (def) {
    var geo;
    if (def.type === 'octa') geo = new THREE.OctahedronGeometry(0.85, 0);
    else if (def.type === 'knot') geo = new THREE.TorusKnotGeometry(0.55, 0.16, 96, 12);
    else geo = new THREE.DodecahedronGeometry(0.85, 0);

    var mat = new THREE.MeshStandardMaterial({
      color: 0x1d3a5c,
      metalness: 0.25,
      roughness: 0.4,
      flatShading: true,
      emissive: 0x11263e,
      emissiveIntensity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(def.x, def.y, 0);

    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 })
    );
    mesh.add(edges);

    scene.add(mesh);
    stations.push(mesh);
  });

  // ---------- Particle field ----------
  var COUNT = 2600;
  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var gold = new THREE.Color(0xd4af37);
  var snow = new THREE.Color(0xbfd0e0);
  var mixed;

  for (var i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = 10 - Math.random() * 58;   // spans the whole descent
    positions[i * 3 + 2] = (Math.random() - 0.5) * 22;

    mixed = Math.random() < 0.22 ? gold : snow;
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    sizeAttenuation: true
  }));
  scene.add(particles);

  // ---------- Finale ring (the platform) ----------
  var finaleRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.014, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.4 })
  );
  finaleRing.rotation.x = Math.PI / 2;
  finaleRing.position.y = -41;
  scene.add(finaleRing);

  // ---------- Camera path + focus path ----------
  var path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, 6.9),      // hero — face the crystal
    new THREE.Vector3(2.6, -4.8, 6.4),   // begin swing
    new THREE.Vector3(-2.4, -11.5, 5.4), // station 01 (object right)
    new THREE.Vector3(2.2, -21.0, 5.2),  // station 02 (object left)
    new THREE.Vector3(-2.0, -30.5, 5.0), // station 03 (object right)
    new THREE.Vector3(0, -37.5, 6.0),    // approach finale
    new THREE.Vector3(0, -41.0, 8.6)     // finale platform pull-back
  ], false, 'catmullrom', 0.35);

  // Focus targets — what the camera LOOKS at per beat, so every
  // station is framed exactly (igloo's fixed-path dolly).
  var focusPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),          // hero: the crystal
    new THREE.Vector3(1.4, -5.5, 0),     // transition
    new THREE.Vector3(2.3, -11.5, 0),    // station 01
    new THREE.Vector3(-2.3, -21.0, 0),   // station 02
    new THREE.Vector3(2.3, -30.5, 0),    // station 03
    new THREE.Vector3(0.8, -37.5, 0),    // approach
    new THREE.Vector3(0, -41, 0)         // finale platform
  ], false, 'catmullrom', 0.35);

  var progress = 0;        // 0..1 camera path progress
  var targetProgress = 0;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  // ---------- Beat-anchor remap ----------
  // DOM beats and the 3D path must agree: when a beat's center hits the
  // viewport center, the camera sits exactly at that beat's path position.
  var anchors = [0, 1];  // scroll-normalized positions per path waypoint

  function measureAnchors() {
    var beats = document.querySelectorAll('#journey .beat');
    if (!beats.length) return;
    var doc = document.documentElement;
    var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    var vh = window.innerHeight;

    // Path waypoint for each beat index (8 beats → 7 waypoints+ends).
    var beatToT = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 0.9, 1];

    var points = [];
    for (var i = 0; i < beats.length; i++) {
      var el = beats[i];
      var center = el.offsetTop + el.offsetHeight / 2 - vh / 2;
      center = Math.min(Math.max(center, 0), max);
      points.push({ s: center / max, t: beatToT[i] || 1 });
    }
    // Ensure monotonic and pinned ends.
    points[0].s = 0;
    points[points.length - 1].s = 1;
    for (var j = 1; j < points.length; j++) {
      if (points[j].s <= points[j - 1].s) points[j].s = points[j - 1].s + 0.001;
    }
    anchors = points;
  }

  function remap(sn) {
    if (!anchors || anchors.length < 2) return sn;
    if (sn <= anchors[0].s) return anchors[0].t;
    for (var i = 1; i < anchors.length; i++) {
      if (sn <= anchors[i].s) {
        var a = anchors[i - 1], b = anchors[i];
        var local = (sn - a.s) / Math.max(b.s - a.s, 1e-6);
        return a.t + (b.t - a.t) * local;
      }
    }
    return anchors[anchors.length - 1].t;
  }

  function computeProgressManually() {
    var doc = document.documentElement;
    var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    targetProgress = remap(Math.min(Math.max(window.scrollY / max, 0), 1));
  }

  // ---------- Scroll integration ----------
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) { targetProgress = remap(self.progress); }
    });
  } else {
    window.addEventListener('scroll', computeProgressManually, { passive: true });
  }

  if (reduced) {
    targetProgress = 0;
    progress = 0;
  }

  // Measure once settled, again after fonts/layout, and on resize.
  setTimeout(measureAnchors, 300);
  setTimeout(measureAnchors, 1500);
  window.addEventListener('resize', function () {
    measureAnchors();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener('load', measureAnchors);

  // ---------- Mouse parallax ----------
  document.addEventListener('mousemove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  // ---------- Render loop ----------
  var clock = new THREE.Clock();
  var lookAhead = new THREE.Vector3();
  var camPos = new THREE.Vector3();

  function tick() {
    var t = clock.getElapsedTime();

    // Continuous idle life — the scene never freezes.
    crystal.rotation.y = t * 0.12;
    crystal.rotation.x = Math.sin(t * 0.17) * 0.22;
    crystal.position.y = Math.sin(t * 0.5) * 0.14;

    ring.rotation.z = t * 0.05;
    ring2.rotation.z = -t * 0.035;

    innerLines.rotation.y = -t * 0.2;
    innerLines.rotation.z = t * 0.1;

    particles.rotation.y = t * 0.008;

    stations.forEach(function (s, idx) {
      s.rotation.y = t * (0.25 + idx * 0.06);
      s.rotation.x = Math.sin(t * 0.3 + idx * 2.1) * 0.35;
      s.position.y += Math.sin(t * 0.7 + idx * 1.7) * 0.0022;
    });

    finaleRing.rotation.z = t * 0.08;

    // Smooth-follow scroll progress.
    progress += (targetProgress - progress) * (reduced ? 1 : 0.055);

    // Camera along path + parallax + idle bob; focus locked per beat.
    // getPoint (not getPointAt): uniform t hits control points exactly,
    // so remap waypoint values land precisely on stations.
    path.getPoint(progress, camPos);
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    camera.position.set(
      camPos.x + mouse.x * 0.7,
      camPos.y + mouse.y * 0.45 + Math.sin(t * 0.4) * 0.1,
      camPos.z
    );

    focusPath.getPoint(progress, lookAhead);
    lookAhead.x += mouse.x * 0.25;
    lookAhead.y += mouse.y * 0.15;
    camera.lookAt(lookAhead);

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(tick);
  }

  // Render a static frame for reduced motion; animated loop otherwise.
  tick();
  if (reduced) {
    // Re-render on scroll/resize so the static frame still tracks progress.
    window.addEventListener('scroll', function () {
      computeProgressManually();
      progress = targetProgress;
      tick();
    }, { passive: true });
  }

  // ---------- Cleanup ----------
  window.addEventListener('beforeunload', function () {
    renderer.dispose();
    coreGeo.dispose();
    coreMat.dispose();
    pGeo.dispose();
  });

  window.__descentScene = { renderer: renderer, camera: camera, path: path };
})();
