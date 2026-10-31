// ============================================================
// 100Percent — "The Descent"
// Custom Three.js scroll-driven camera journey (index page).
// Posture: igloo.inc — one fixed canvas, scroll is the camera
// dolly, the scene never stops moving. Gold on navy abyss.
//
// 4 SECTORS — one shape per sector, camera snaps between them.
// No overlapping. Minimal elastic movement.
// ============================================================

/* global THREE */

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

  // ---------- 4 Sector Shapes (one per sector) ----------
  // Sector Y positions: 0, -12, -24, -36 (descending path)
  var sectorShapes = [];

  // Sector 1 — Crystal (Icosahedron, gold)
  var crystalGroup = new THREE.Group();
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
  crystalGroup.add(core);

  var shellLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.66, 0)),
    new THREE.LineBasicMaterial({ color: 0xe8edf2, transparent: true, opacity: 0.16 })
  );
  crystalGroup.add(shellLines);

  var innerLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, 0)),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.35 })
  );
  crystalGroup.add(innerLines);

  crystalGroup.position.set(0, 0, 0);
  scene.add(crystalGroup);
  sectorShapes.push({ mesh: crystalGroup, y: 0 });

  // Sector 2 — Octahedron (Station 01)
  var octaGroup = new THREE.Group();
  var octaGeo = new THREE.OctahedronGeometry(0.85, 0);
  var octaMat = new THREE.MeshStandardMaterial({
    color: 0x1d3a5c,
    metalness: 0.25,
    roughness: 0.4,
    flatShading: true,
    emissive: 0x11263e,
    emissiveIntensity: 0.7
  });
  var octa = new THREE.Mesh(octaGeo, octaMat);
  octaGroup.add(octa);

  var octaEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(octaGeo),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 })
  );
  octaGroup.add(octaEdges);

  octaGroup.position.set(2.3, -12, 0);
  scene.add(octaGroup);
  sectorShapes.push({ mesh: octaGroup, y: -12 });

  // Sector 3 — Torus Knot (Station 02)
  var knotGroup = new THREE.Group();
  var knotGeo = new THREE.TorusKnotGeometry(0.55, 0.16, 96, 12);
  var knotMat = new THREE.MeshStandardMaterial({
    color: 0x1d3a5c,
    metalness: 0.25,
    roughness: 0.4,
    flatShading: true,
    emissive: 0x11263e,
    emissiveIntensity: 0.7
  });
  var knot = new THREE.Mesh(knotGeo, knotMat);
  knotGroup.add(knot);

  var knotEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(knotGeo),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 })
  );
  knotGroup.add(knotEdges);

  knotGroup.position.set(-2.3, -24, 0);
  scene.add(knotGroup);
  sectorShapes.push({ mesh: knotGroup, y: -24 });

  // Sector 4 — Dodecahedron (Station 03)
  var dodecaGroup = new THREE.Group();
  var dodecaGeo = new THREE.DodecahedronGeometry(0.85, 0);
  var dodecaMat = new THREE.MeshStandardMaterial({
    color: 0x1d3a5c,
    metalness: 0.25,
    roughness: 0.4,
    flatShading: true,
    emissive: 0x11263e,
    emissiveIntensity: 0.7
  });
  var dodeca = new THREE.Mesh(dodecaGeo, dodecaMat);
  dodecaGroup.add(dodeca);

  var dodecaEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(dodecaGeo),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 })
  );
  dodecaGroup.add(dodecaEdges);

  dodecaGroup.position.set(2.3, -36, 0);
  scene.add(dodecaGroup);
  sectorShapes.push({ mesh: dodecaGroup, y: -36 });

  // ---------- Orbital rings (hero level, behind crystal) ----------
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

  // ---------- Particle field ----------
  var COUNT = 2600;
  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var gold = new THREE.Color(0xd4af37);
  var snow = new THREE.Color(0xbfd0e0);
  var mixed;

  for (var i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = 10 - Math.random() * 52;   // spans all 4 sectors
    positions[i * 3 + 2] = (Math.random() - 0.5) * 28;

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

  // ---------- Finale ring (sector 4 platform) ----------
  var finaleRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.014, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.4 })
  );
  finaleRing.rotation.x = Math.PI / 2;
  finaleRing.position.y = -36;
  scene.add(finaleRing);

  // ---------- Camera path — 4 discrete positions (one per sector) ----------
  var cameraPath = [
    new THREE.Vector3(0, 0, 6.9),    // sector 1 — face the crystal
    new THREE.Vector3(2.6, -12, 6.4), // sector 2 — octahedron right
    new THREE.Vector3(-2.4, -24, 5.4), // sector 3 — knot left
    new THREE.Vector3(0, -36, 6.0)    // sector 4 — dodecahedron centre
  ];

  // Focus targets — what the camera LOOKS at per sector.
  var focusPath = [
    new THREE.Vector3(0, 0, 0),      // sector 1 — crystal
    new THREE.Vector3(2.3, -12, 0),  // sector 2 — octahedron
    new THREE.Vector3(-2.3, -24, 0), // sector 3 — knot
    new THREE.Vector3(2.3, -36, 0)   // sector 4 — dodecahedron
  ];

  // ---------- Scroll state ----------
  var progress = 0;        // 0..1 linear scroll progress
  var targetProgress = 0;
  var sectorIndex = 0;     // current sector (0..3)
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  // Expose progress setter so main.js can drive camera + text from one ScrollTrigger.
  window.__descentSetProgress = function (p) {
    targetProgress = Math.min(Math.max(p, 0), 1);
    var idx = Math.min(Math.floor(targetProgress * sectorShapes.length), sectorShapes.length - 1);
    sectorIndex = idx;
  };

  // ---------- Mouse parallax ----------
  document.addEventListener('mousemove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  // ---------- Render loop ----------
  var clock = new THREE.Clock();
  var camPos = new THREE.Vector3();
  var lookAhead = new THREE.Vector3();

  function tick() {
    var t = clock.getElapsedTime();

    // Continuous idle life — each shape rotates slowly in place.
    sectorShapes.forEach(function (s, i) {
      s.mesh.rotation.y = t * (0.15 + i * 0.05);
      s.mesh.rotation.x = Math.sin(t * 0.2 + i) * 0.15;
      s.mesh.position.y = sectorShapes[i].y + Math.sin(t * 0.4 + i) * 0.02;
    });

    crystalGroup.rotation.y = t * 0.12;
    crystalGroup.rotation.x = Math.sin(t * 0.17) * 0.22;
    crystalGroup.position.y = Math.sin(t * 0.5) * 0.14;

    ring.rotation.z = t * 0.05;
    ring2.rotation.z = -t * 0.035;

    particles.rotation.y = t * 0.008;

    finaleRing.rotation.z = t * 0.08;

    // Smooth-follow scroll progress (minimal elastic — low lerp factor).
    progress += (targetProgress - progress) * 0.06;

    // Snap camera to current sector position with slight easing.
    var targetCam = cameraPath[sectorIndex];
    var targetFocus = focusPath[sectorIndex];
    camPos.lerpVectors(camPos, targetCam, 0.08);
    lookAhead.lerpVectors(lookAhead, targetFocus, 0.08);

    // Mouse parallax offset.
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    camera.position.set(
      camPos.x + mouse.x * 0.7,
      camPos.y + mouse.y * 0.45 + Math.sin(t * 0.4) * 0.05,
      camPos.z
    );

    lookAhead.x += mouse.x * 0.25;
    lookAhead.y += mouse.y * 0.15;
    camera.lookAt(lookAhead);

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(tick);
  }

  function computeProgressManually() {
    var doc = document.documentElement;
    var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    targetProgress = Math.min(Math.max(window.scrollY / max, 0), 1);
    var idx = Math.min(Math.floor(targetProgress * sectorShapes.length), sectorShapes.length - 1);
    sectorIndex = idx;
  }

  // ---------- Scroll integration ----------
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduced) {
    // Main.js owns the ScrollTrigger; scene.js only consumes __descentSetProgress.
  } else {
    window.addEventListener('scroll', computeProgressManually, { passive: true });
  }

  if (reduced) {
    targetProgress = 0;
    progress = 0;
    window.addEventListener('scroll', function () {
      computeProgressManually();
      progress = targetProgress;
      tick();
    }, { passive: true });
  }

  // ---------- Resize ----------
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- Cleanup ----------
  window.addEventListener('beforeunload', function () {
    renderer.dispose();
    coreGeo.dispose();
    coreMat.dispose();
    pGeo.dispose();
  });

  tick();

  window.__descentScene = { renderer: renderer, camera: camera };
})();
