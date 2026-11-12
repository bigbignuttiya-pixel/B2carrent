// 3D model (three.js). Orbit with mouse / one finger, zoom with wheel / two fingers.
// Tap a door or drawer to open / close it; the toolbar button opens or closes all of them.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildPiece } from './model';

const OPEN_DOOR = (100 * Math.PI) / 180;
const OPEN_FLIP = (95 * Math.PI) / 180;

function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
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

const Viewer3D = forwardRef(function Viewer3D({ pieces, materials, selectedId, allOpen, onlySelected }, ref) {
  const wrapRef = useRef(null);
  const st = useRef(null); // three.js state
  const openMap = useRef({}); // anim id → open?

  // ---------- one-time setup ----------
  useEffect(() => {
    const wrap = wrapRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor('#f5f5f4');
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 20000);
    camera.position.set(250, 220, 420);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.52;

    scene.add(new THREE.HemisphereLight('#ffffff', '#d6d3d1', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.6);
    sun.position.set(300, 600, 500);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -800, right: 800, top: 800, bottom: -800, near: 10, far: 3000 });
    scene.add(sun);
    scene.add(sun.target);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: '#e7e5e4', roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(3000, 60, '#d6d3d1', '#d6d3d1');
    grid.position.y = 0.05;
    scene.add(grid);

    const root = new THREE.Group();
    scene.add(root);

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // tap → toggle a door / drawer
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
      }
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      st.current.movers.forEach((m) => {
        const open = Boolean(openMap.current[m.id]);
        const target = open ? m.openValue : 0;
        m.value += (target - m.value) * 0.14;
        if (Math.abs(target - m.value) < 1e-4) m.value = target;
        if (m.type === 'drawer') m.group.position.z = m.base + m.value;
        else if (m.type === 'flip') m.group.rotation.x = m.value;
        else m.group.rotation.y = m.value;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    st.current = { renderer, scene, camera, controls, root, movers: [], fitted: false, sun };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      disposeTree(scene);
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
    const r = Math.max(size.x, size.y, size.z) * 0.5 + 20;
    const dist = r / Math.sin((s.camera.fov * Math.PI) / 360) * 1.05;
    s.controls.target.copy(c);
    s.camera.position.set(c.x + dist * 0.45, c.y + dist * 0.35, c.z + dist * 0.82);
    s.camera.updateProjectionMatrix();
    s.sun.position.set(c.x + 300, 600, c.z + 500);
    s.sun.target.position.copy(c);
  };

  useImperativeHandle(ref, () => ({
    fit,
    snapshot: () => {
      const s = st.current;
      s.renderer.render(s.scene, s.camera);
      return s.renderer.domElement.toDataURL('image/png');
    },
  }));

  // ---------- rebuild when the design changes ----------
  useEffect(() => {
    const s = st.current;
    if (!s) return;
    const prevValues = Object.fromEntries(s.movers.map((m) => [m.id, m.value]));
    s.root.children.slice().forEach((c) => {
      s.root.remove(c);
      disposeTree(c);
    });
    s.movers = [];

    const list = onlySelected ? pieces.filter((p) => p.id === selectedId) : pieces;
    const laid = layoutPieces(list.length ? list : pieces.slice(0, 1), materials);
    const edgeMat = new THREE.LineBasicMaterial({ color: '#292524', transparent: true, opacity: 0.28 });

    laid.forEach(({ piece, built, at }) => {
      const g = new THREE.Group();
      g.position.set(at.x, at.y, 0);
      const groups = {};
      const sel = piece.id === selectedId && !onlySelected && pieces.length > 1;
      const addMesh = (parent, box, color, offset, animId) => {
        const geo = new THREE.BoxGeometry(Math.max(0.05, box.sx), Math.max(0.05, box.sy), Math.max(0.05, box.sz));
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02 }));
        mesh.position.set(box.x + box.sx / 2 - offset[0], box.y + box.sy / 2 - offset[1], box.z + box.sz / 2 - offset[2]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (animId) mesh.userData.animId = animId;
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), sel ? new THREE.LineBasicMaterial({ color: '#d97706' }) : edgeMat.clone());
        mesh.add(edges);
        parent.add(mesh);
        return mesh;
      };

      built.parts.forEach((part) => {
        if (!part.anim) {
          addMesh(g, part.box, part.color, [0, 0, 0]);
          return;
        }
        const a = part.anim;
        if (!groups[a.id]) {
          const mover = new THREE.Group();
          let pivot;
          if (a.type === 'drawer') pivot = [0, 0, 0];
          else if (a.type === 'flip') pivot = [0, a.pivot, part.box.z];
          else pivot = [a.pivot, 0, part.box.z];
          mover.position.set(...pivot);
          g.add(mover);
          const m = { id: a.id, type: a.type, group: mover, pivot, base: 0, value: prevValues[a.id] || 0, openValue: a.type === 'drawer' ? a.dz : a.type === 'flip' ? -OPEN_FLIP : a.hinge === 'left' ? -OPEN_DOOR : OPEN_DOOR };
          groups[a.id] = m;
          s.movers.push(m);
        }
        const m = groups[a.id];
        addMesh(m.group, part.box, part.color, m.pivot, a.id);
        // handle knob on fronts
        if (part.handle) {
          const b = part.box;
          const hb =
            part.handle === 'drawer'
              ? { x: b.x + b.sx / 2 - 7, y: b.y + b.sy - 4.5, z: b.z + b.sz, sx: 14, sy: 1.2, sz: 2 }
              : part.handle === 'top'
                ? { x: b.x + b.sx / 2 - 7, y: b.y + 3, z: b.z + b.sz, sx: 14, sy: 1.2, sz: 2 }
                : { x: part.handle === 'left' ? b.x + b.sx - 4 : b.x + 2.8, y: (b.sy > 120 ? b.y + 100 : b.y + b.sy / 2) - 8, z: b.z + b.sz, sx: 1.2, sy: 16, sz: 2 };
          const knob = addMesh(m.group, hb, '#57534e', m.pivot, a.id);
          knob.castShadow = false;
        }
      });

      built.extras.forEach((e) => {
        if (e.type === 'rod') {
          const len = e.to[0] - e.from[0];
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, len, 16), new THREE.MeshStandardMaterial({ color: '#a8a29e', metalness: 0.8, roughness: 0.3 }));
          rod.rotation.z = Math.PI / 2;
          rod.position.set(e.from[0] + len / 2, e.from[1], e.from[2]);
          g.add(rod);
        } else if (e.type === 'leg') {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(4, e.h, 4), new THREE.MeshStandardMaterial({ color: '#292524', metalness: 0.6, roughness: 0.4 }));
          leg.position.set(e.at[0], e.h / 2, e.at[1]);
          leg.castShadow = true;
          g.add(leg);
        } else if (e.type === 'box') {
          addMesh(g, e.box, e.color, [0, 0, 0]);
        }
      });
      s.root.add(g);
    });

    // centre the row on the origin
    s.root.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(s.root);
    if (!box.isEmpty()) s.root.position.x = -(box.min.x + box.max.x) / 2;
    if (!s.fitted) {
      s.fitted = true;
      fit();
    }
  }, [pieces, materials, selectedId, onlySelected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = st.current;
    if (!s) return;
    s.movers.forEach((m) => (openMap.current[m.id] = allOpen));
  }, [allOpen]);
  // Movers created later (new doors) follow the global switch
  useEffect(() => {
    const s = st.current;
    s?.movers.forEach((m) => {
      if (!(m.id in openMap.current)) openMap.current[m.id] = allOpen;
    });
  });

  return <div ref={wrapRef} className="absolute inset-0" />;
});

export default Viewer3D;
