// 3D showroom (three.js): realistic finishes, a room around the furniture, clothes on shelves and rods.
// Orbit with mouse / one finger, zoom with wheel / two fingers. Tap a door or drawer to open / close it.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildPiece, decorFor, finishById } from './model';

const OPEN_DOOR = (100 * Math.PI) / 180;
const OPEN_FLIP = (95 * Math.PI) / 180;

function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose();
    if (o.material && !o.material.userData?.shared) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
}

// ---------- procedural textures ----------
function woodCanvas(base = '#d4b48a', size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i++) {
    const y = rnd() * size;
    const dark = rnd() < 0.5;
    g.strokeStyle = dark ? `rgba(60,35,15,${0.05 + rnd() * 0.12})` : `rgba(255,240,210,${0.04 + rnd() * 0.08})`;
    g.lineWidth = 0.6 + rnd() * 2.4;
    g.beginPath();
    const amp = 2 + rnd() * 6;
    const f = 0.004 + rnd() * 0.01;
    const ph = rnd() * 10;
    for (let x = 0; x <= size; x += 8) g.lineTo(x, y + Math.sin(x * f + ph) * amp);
    g.stroke();
  }
  // knots
  for (let k = 0; k < 2; k++) {
    const kx = rnd() * size;
    const ky = rnd() * size;
    for (let r = 2; r < 18; r += 3) {
      g.strokeStyle = `rgba(70,40,18,${0.12 - r * 0.005})`;
      g.beginPath();
      g.ellipse(kx, ky, r * 2.4, r, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  return c;
}

function floorCanvas() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  const plankH = 128;
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const wood = woodCanvas('#c9a57a', 512);
  for (let row = 0; row < 1024 / plankH; row++) {
    let x = -rnd() * 600;
    while (x < 1024) {
      const len = 500 + rnd() * 500;
      g.save();
      g.beginPath();
      g.rect(x, row * plankH, len, plankH);
      g.clip();
      g.drawImage(wood, x - rnd() * 200, row * plankH - rnd() * 300, 1024, 1024);
      g.fillStyle = `rgba(${rnd() < 0.5 ? '255,245,230' : '90,60,30'},${rnd() * 0.12})`;
      g.fill();
      g.restore();
      g.strokeStyle = 'rgba(60,40,20,.35)';
      g.lineWidth = 2;
      g.strokeRect(x, row * plankH, len, plankH);
      x += len;
    }
  }
  return c;
}

function makeMaterials(renderer) {
  const cache = new Map();
  const woodTex = new THREE.CanvasTexture(woodCanvas('#ffffff'));
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.colorSpace = THREE.SRGBColorSpace;
  woodTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return {
    woodTex,
    get(color, finishId) {
      const f = finishById(finishId);
      const key = `${color}|${f?.kind || 'solid'}`;
      if (cache.has(key)) return cache.get(key);
      let m;
      if (f?.kind === 'mirror') m = new THREE.MeshStandardMaterial({ color: '#e5ecf2', metalness: 1, roughness: 0.04, envMapIntensity: 1.4 });
      else if (f?.kind === 'glass') m = new THREE.MeshPhysicalMaterial({ color: '#e9f1f4', roughness: 0.35, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.55, thickness: 0.5 });
      else if (f?.kind === 'wood') m = new THREE.MeshStandardMaterial({ color, map: woodTex, roughness: 0.62, metalness: 0 });
      else m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02 });
      m.userData.shared = true;
      cache.set(key, m);
      return m;
    },
    dispose() {
      cache.forEach((m) => m.dispose());
      cache.clear();
      woodTex.dispose();
    },
  };
}

// Box with UVs in real centimetres (so wood grain keeps its scale on every panel)
function panelGeometry(sx, sy, sz) {
  const geo = new THREE.BoxGeometry(Math.max(0.05, sx), Math.max(0.05, sy), Math.max(0.05, sz));
  const uv = geo.attributes.uv;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]]; // +x −x +y −y +z −z
  // grain runs along the longer side of each face
  for (let f = 0; f < 6; f++) {
    const [du, dv] = dims[f];
    const rot = dv > du;
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      const u0 = uv.getX(i);
      const v0 = uv.getY(i);
      if (rot) uv.setXY(i, (v0 * dv) / 90, (u0 * du) / 90);
      else uv.setXY(i, (u0 * du) / 90, (v0 * dv) / 90);
    }
  }
  return geo;
}

// Pieces stand side by side, 30 cm apart, in the order of the list
export function layoutPieces(pieces, materials) {
  let x = 0;
  return pieces.map((p) => {
    const b = buildPiece(p, materials);
    const at = { x, y: p.elev || 0 };
    x += b.outer.outerW + 30;
    return { piece: p, built: b, at };
  });
}

const Viewer3D = forwardRef(function Viewer3D(
  { pieces, materials, selectedId, allOpen, onlySelected, showRoom = true, showDecor = true, wallColor = '#e8e4dc', transparentBg = false, onAzimuth, autoRotate = 0, interactive = true },
  ref
) {
  const wrapRef = useRef(null);
  const st = useRef(null);
  const openMap = useRef({});
  const azRef = useRef(onAzimuth);
  azRef.current = onAzimuth;
  const opts = useRef({});
  opts.current = { autoRotate, interactive };

  // ---------- one-time setup ----------
  useEffect(() => {
    const wrap = wrapRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = opts.current.interactive ? 'none' : 'pan-y';

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(36, 1, 1, 20000);
    camera.position.set(250, 200, 420);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 60;
    controls.maxDistance = 2500;
    if (!opts.current.interactive) controls.enabled = false;
    controls.addEventListener('change', () => {
      const off = camera.position.clone().sub(controls.target);
      azRef.current?.(Math.round((Math.atan2(off.x, off.z) * 180) / Math.PI));
    });

    scene.add(new THREE.HemisphereLight('#fffaf2', '#c8bfb0', 0.55));
    const sun = new THREE.DirectionalLight('#fff4e5', 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.6;
    Object.assign(sun.shadow.camera, { left: -600, right: 600, top: 600, bottom: -600, near: 10, far: 3000 });
    scene.add(sun);
    scene.add(sun.target);

    const mats = makeMaterials(renderer);
    const floorTex = new THREE.CanvasTexture(floorCanvas());
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);
    const root = new THREE.Group();
    scene.add(root);

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (st.current) st.current.dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const ray = new THREE.Raycaster();
    let down = null;
    const onDown = (e) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(root.children, true).find((h) => h.object.userData.animId);
      if (hit) {
        const id = hit.object.userData.animId;
        openMap.current[id] = !openMap.current[id];
        st.current.dirty = true;
      }
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const s = st.current;
      let dirty = s.dirty;
      if (opts.current.autoRotate) {
        // slow turntable: swing the camera around the target
        const off = camera.position.clone().sub(controls.target);
        const a = (opts.current.autoRotate * Math.PI) / 180 / 60;
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
        camera.position.copy(controls.target).add(off);
        camera.lookAt(controls.target);
        dirty = true;
      }
      s.movers.forEach((m) => {
        const target = openMap.current[m.id] ? m.openValue : 0;
        if (m.value === target && m.applied) return;
        dirty = true;
        m.applied = true;
        m.value += (target - m.value) * 0.12;
        if (Math.abs(target - m.value) < 1e-3) m.value = target;
        if (m.type === 'drawer') m.group.position.z = m.value;
        else if (m.type === 'slide') m.group.position.x = m.value;
        else if (m.type === 'flip') m.group.rotation.x = m.value;
        else m.group.rotation.y = m.value;
      });
      if (controls.update()) dirty = true;
      if (!dirty) return;
      s.dirty = false;
      renderer.render(scene, camera);
    };
    st.current = { renderer, scene, camera, controls, root, roomGroup, movers: [], fitted: false, sun, mats, floorTex, envTex, pmrem, dirty: true };
    controls.addEventListener('change', () => (st.current.dirty = true));
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      disposeTree(scene);
      mats.dispose();
      floorTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const fit = () => {
    const s = st.current;
    if (!s) return;
    const box = new THREE.Box3().setFromObject(s.root);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x * 0.62, size.y * 0.75, 60);
    const dist = (r / Math.tan((s.camera.fov * Math.PI) / 360)) * (opts.current.interactive ? 1.15 : 0.92);
    s.controls.target.set(c.x, c.y * 0.95, c.z);
    s.camera.position.set(c.x + dist * 0.38, c.y + dist * 0.18, c.z + dist * 0.92);
    s.camera.updateProjectionMatrix();
    s.dirty = true;
  };

  useImperativeHandle(ref, () => ({
    fit,
    snapshot: () => {
      const s = st.current;
      s.renderer.render(s.scene, s.camera);
      return s.renderer.domElement.toDataURL('image/png');
    },
    setAzimuth: (deg) => {
      const s = st.current;
      const off = s.camera.position.clone().sub(s.controls.target);
      const flat = Math.hypot(off.x, off.z);
      const a = (deg * Math.PI) / 180;
      s.camera.position.set(s.controls.target.x + Math.sin(a) * flat, s.camera.position.y, s.controls.target.z + Math.cos(a) * flat);
      s.controls.update();
    },
    zoom: (factor) => {
      const s = st.current;
      const off = s.camera.position.clone().sub(s.controls.target).multiplyScalar(factor);
      const len = Math.min(s.controls.maxDistance, Math.max(s.controls.minDistance, off.length()));
      s.camera.position.copy(s.controls.target).add(off.setLength(len));
      s.controls.update();
    },
    distance: () => {
      const s = st.current;
      return s.camera.position.distanceTo(s.controls.target);
    },
  }));

  // ---------- rebuild when the design changes ----------
  useEffect(() => {
    const s = st.current;
    if (!s) return;
    const prevValues = Object.fromEntries(s.movers.map((m) => [m.id, m.value]));
    [s.root, s.roomGroup].forEach((grp) =>
      grp.children.slice().forEach((c) => {
        grp.remove(c);
        disposeTree(c);
      })
    );
    s.movers = [];

    const list = onlySelected ? pieces.filter((p) => p.id === selectedId) : pieces;
    const laid = layoutPieces(list.length ? list : pieces.slice(0, 1), materials);
    const edgeMat = new THREE.LineBasicMaterial({ color: '#d97706' });
    const multi = !onlySelected && laid.length > 1;

    const addMesh = (parent, box, color, offset, animId, finishId, sel) => {
      const geo = panelGeometry(box.sx, box.sy, box.sz);
      const mesh = new THREE.Mesh(geo, s.mats.get(color, finishId));
      mesh.position.set(box.x + box.sx / 2 - offset[0], box.y + box.sy / 2 - offset[1], box.z + box.sz / 2 - offset[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (animId) mesh.userData.animId = animId;
      if (sel) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
      parent.add(mesh);
      return mesh;
    };

    laid.forEach(({ piece, built, at }) => {
      const g = new THREE.Group();
      g.position.set(at.x, at.y, 0);
      const groups = {};
      const sel = multi && piece.id === selectedId;

      built.parts.forEach((part) => {
        if (!part.anim) {
          addMesh(g, part.box, part.color, [0, 0, 0], null, part.finish, sel);
          return;
        }
        const a = part.anim;
        if (!groups[a.id]) {
          const mover = new THREE.Group();
          let pivot;
          if (a.type === 'drawer' || a.type === 'slide') pivot = [0, 0, 0];
          else if (a.type === 'flip') pivot = [0, a.pivot, part.box.z];
          else pivot = [a.pivot, 0, part.box.z];
          mover.position.set(...pivot);
          g.add(mover);
          const openValue = a.type === 'drawer' ? a.dz : a.type === 'slide' ? a.dx : a.type === 'flip' ? -OPEN_FLIP : a.hinge === 'left' ? -OPEN_DOOR : OPEN_DOOR;
          const m = { id: a.id, type: a.type, group: mover, pivot, value: prevValues[a.id] || 0, openValue };
          if (a.type === 'slide' && !a.dx) m.openValue = 0;
          groups[a.id] = m;
          s.movers.push(m);
        }
        const m = groups[a.id];
        addMesh(m.group, part.box, part.color, m.pivot, a.id, part.finish, sel);
        if (a.type === 'slide') {
          // aluminium profile around each sliding door
          const b = part.box;
          const alu = new THREE.MeshStandardMaterial({ color: '#c7c9cc', metalness: 0.9, roughness: 0.3 });
          [
            { x: b.x, y: b.y, sx: 2, sy: b.sy },
            { x: b.x + b.sx - 2, y: b.y, sx: 2, sy: b.sy },
            { x: b.x, y: b.y, sx: b.sx, sy: 2.5 },
            { x: b.x, y: b.y + b.sy - 2.5, sx: b.sx, sy: 2.5 },
          ].forEach((f) => {
            const fr = new THREE.Mesh(new THREE.BoxGeometry(f.sx, f.sy, b.sz + 0.6), alu);
            fr.position.set(f.x + f.sx / 2, f.y + f.sy / 2, b.z + b.sz / 2);
            fr.userData.animId = a.id;
            fr.castShadow = true;
            m.group.add(fr);
          });
        }
        if (part.handle) {
          const b = part.box;
          const hb =
            part.handle === 'drawer'
              ? { x: b.x + b.sx / 2 - 8, y: b.y + b.sy - 4.5, z: b.z + b.sz, sx: 16, sy: 1, sz: 2.4 }
              : part.handle === 'top'
                ? { x: b.x + b.sx / 2 - 8, y: b.y + 3, z: b.z + b.sz, sx: 16, sy: 1, sz: 2.4 }
                : { x: part.handle === 'left' ? b.x + b.sx - 4 : b.x + 2.8, y: (b.sy > 120 ? b.y + 100 : b.y + b.sy / 2) - 10, z: b.z + b.sz, sx: 1, sy: 20, sz: 2.4 };
          const knob = new THREE.Mesh(new THREE.BoxGeometry(hb.sx, hb.sy, hb.sz), new THREE.MeshStandardMaterial({ color: '#3a3836', metalness: 0.85, roughness: 0.3 }));
          knob.position.set(hb.x + hb.sx / 2 - m.pivot[0], hb.y + hb.sy / 2 - m.pivot[1], hb.z + hb.sz / 2 - m.pivot[2]);
          knob.userData.animId = a.id;
          knob.castShadow = true;
          m.group.add(knob);
        }
      });

      built.extras.forEach((e) => {
        if (e.type === 'rod') {
          const len = e.to[0] - e.from[0];
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, len, 20), new THREE.MeshStandardMaterial({ color: '#d6d3d1', metalness: 1, roughness: 0.2 }));
          rod.rotation.z = Math.PI / 2;
          rod.position.set(e.from[0] + len / 2, e.from[1], e.from[2]);
          rod.castShadow = true;
          g.add(rod);
        } else if (e.type === 'leg') {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(4, e.h, 4), new THREE.MeshStandardMaterial({ color: '#232221', metalness: 0.7, roughness: 0.35 }));
          leg.position.set(e.at[0], e.h / 2, e.at[1]);
          leg.castShadow = true;
          g.add(leg);
        } else if (e.type === 'box') {
          addMesh(g, e.box, e.color, [0, 0, 0]);
        }
      });

      // clothes
      if (showDecor) {
        decorFor(piece, materials).forEach((d) => {
          const mat = s.mats.get(d.color, null);
          const geo = d.type === 'fold' ? new THREE.BoxGeometry(d.box.sx, d.box.sy * 0.92, d.box.sz) : new THREE.BoxGeometry(d.box.sx, d.box.sy, d.box.sz);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(d.box.x + d.box.sx / 2, d.box.y + d.box.sy / 2, d.box.z + d.box.sz / 2);
          if (d.type === 'garment') mesh.rotation.y = (Math.random() - 0.5) * 0.15;
          mesh.castShadow = d.type === 'garment';
          mesh.receiveShadow = true;
          g.add(mesh);
          if (d.type === 'garment') {
            const hook = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.25, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 1, roughness: 0.3 }));
            hook.position.set(d.box.x + d.box.sx / 2, d.box.y + d.box.sy + 1.2, d.box.z + d.box.sz / 2);
            hook.rotation.y = Math.PI / 2;
            g.add(hook);
          }
        });
      }
      s.root.add(g);
    });

    // centre the row on the origin
    s.root.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(s.root);
    if (!box.isEmpty()) s.root.position.x = -(box.min.x + box.max.x) / 2;
    const size = box.isEmpty() ? new THREE.Vector3(200, 200, 60) : box.getSize(new THREE.Vector3());

    // room: plank floor, back wall and a side wall with skirting
    const roomW = Math.max(400, size.x + 260);
    const floorMat = new THREE.MeshStandardMaterial({ map: s.floorTex, roughness: 0.55, metalness: 0 });
    s.floorTex.repeat.set(roomW / 300, 600 / 300);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, 600), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 300 - 10);
    floor.receiveShadow = true;
    if (showRoom) {
      s.roomGroup.add(floor);
      const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.95 });
      const wallH = Math.max(270, size.y + 40);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(roomW, wallH), wallMat);
      back.position.set(0, wallH / 2, -2);
      back.receiveShadow = true;
      const side = new THREE.Mesh(new THREE.PlaneGeometry(600, wallH), wallMat);
      side.rotation.y = Math.PI / 2;
      side.position.set(-roomW / 2, wallH / 2, 300 - 10);
      side.receiveShadow = true;
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(roomW, 8, 1.5), new THREE.MeshStandardMaterial({ color: '#f5f3ee', roughness: 0.6 }));
      skirt.position.set(0, 4, -1.2);
      const skirt2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 600), skirt.material);
      skirt2.position.set(-roomW / 2 + 0.8, 4, 290);
      s.roomGroup.add(back, side, skirt, skirt2);
      // soft rug in front of the furniture
      const rug = new THREE.Mesh(new THREE.BoxGeometry(Math.min(260, size.x * 0.8 + 60), 0.6, 150), new THREE.MeshStandardMaterial({ color: '#ece6dc', roughness: 1 }));
      rug.position.set(0, 0.3, Math.max(size.z, 60) + 110);
      rug.receiveShadow = true;
      s.roomGroup.add(rug);
    } else {
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(roomW, 600), new THREE.ShadowMaterial({ opacity: 0.22 }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, 0, 290);
      shadow.receiveShadow = true;
      s.roomGroup.add(shadow);
    }
    s.renderer.setClearColor('#f3f0ea', transparentBg || !showRoom ? 0 : 1);
    s.sun.position.set(size.x * 0.4 + 220, 520, 480);
    s.sun.target.position.set(0, size.y / 2, 0);

    if (!s.fitted) {
      s.fitted = true;
      fit();
    }
    s.dirty = true;
  }, [pieces, materials, selectedId, onlySelected, showRoom, showDecor, wallColor, transparentBg]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    st.current?.movers.forEach((m) => {
      openMap.current[m.id] = allOpen;
      m.applied = false;
    });
  }, [allOpen]);
  useEffect(() => {
    st.current?.movers.forEach((m) => {
      if (!(m.id in openMap.current)) openMap.current[m.id] = allOpen;
    });
  });

  return <div ref={wrapRef} className="absolute inset-0" />;
});

export default Viewer3D;
