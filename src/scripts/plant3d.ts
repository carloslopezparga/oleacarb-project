/* Maqueta 3D de la planta (three.js, cargado bajo demanda).
 * Volúmenes extruidos desde plant.json; alturas supuestas de la memoria (plano G-06). */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import plant from '../data/plant.json';

const C = {
  bg: '#1D2320', ground: '#2E3530', parcel: '#F6F4EE', road: '#D8DCD0', green: '#DDE3C8',
  proc: ['#8C9A55', '#DDE3C8'], alm: ['#D6A54A', '#F1E2BF'], serv: ['#A9B0A4', '#E9ECE3'], seg: ['#D88A66', '#F1DCD0'], pers: ['#16AEBF', '#D7EFF2'],
  pv: '#333B35', chimney: '#5D655E', tejar: '#EEF0E7', conveyor: '#B9862C', water: '#D7EFF2'
};
const CAT: Record<string, keyof typeof C> = { Proceso: 'proc', Almacenes: 'alm', Servicios: 'serv', Seguridad: 'seg', Personas: 'pers' };
const FLAT = new Set(['PK', 'BP', 'BS', 'RS']);
// Si una zona no tiene altura: 3 m en exteriores (BRIEF §5.6); las zonas planas van a ras de suelo.
const heightOf = (z: typeof plant.zones[number]) => z.height_m ?? (FLAT.has(z.id) ? 0.25 : 3);
const P = (x: number, y: number) => new THREE.Vector3(x - 100, 0, y - 100);   // plano (x este, y sur) → escena

function pvTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = C.proc[1]; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#5B6B2E';
  for (let y = 3; y < 128; y += 8) g.fillRect(2, y, 124, 3);    // rayado fino de las placas fotovoltaicas (0,8 MWp)
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

interface Opts { reduced: boolean; onClose: () => void }

export async function open3D(sec: HTMLElement, opts: Opts): Promise<void> {
  const wrap = sec.querySelector<HTMLElement>('.p3d')!;
  const host = wrap.querySelector<HTMLElement>('.p3d-canvas')!;
  const card = wrap.querySelector<HTMLElement>('.p3d-card')!;
  const tourBtn = wrap.querySelector<HTMLButtonElement>('.p3d-tour')!;
  const closeBtn = wrap.querySelector<HTMLButtonElement>('.p3d-close')!;
  wrap.hidden = false;
  document.documentElement.classList.add('p3d-open');

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Maqueta 3D de la planta: naves de proceso en oliva, almacenes en ocre, servicios en gris, seguridad en terracota y personas en azul. La extractora de El Tejar, al norte, en volumen transparente.');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 3000);
  const home = { pos: new THREE.Vector3(150, 175, 245), target: new THREE.Vector3(0, 0, 8) };
  camera.position.copy(home.pos);

  // luz: cielo suave y sol cálido rasante del sureste
  scene.add(new THREE.HemisphereLight('#EEF0E7', '#3C4A1C', 1.1));
  const sun = new THREE.DirectionalLight('#F6E6C4', 2.4);
  sun.position.set(190, 80, 170);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 600 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun);

  const disposables: { dispose: () => void }[] = [];
  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, ...extra });
    disposables.push(m); return m;
  };
  const box = (w: number, h: number, d: number) => { const g = new THREE.BoxGeometry(w, h, d); disposables.push(g); return g; };

  // suelo, parcela, viales y zona verde
  const ground = new THREE.Mesh(box(420, 0.4, 420), mat(C.ground));
  ground.position.y = -0.3; ground.receiveShadow = true; scene.add(ground);
  const parcel = new THREE.Mesh(box(200, 0.2, 200), mat(C.parcel));
  parcel.position.set(0, -0.05, 0); parcel.receiveShadow = true; scene.add(parcel);
  plant.roads.forEach(([x, y, w, d]) => { const m = new THREE.Mesh(box(w, 0.12, d), mat(C.road)); m.position.copy(P(x + w / 2, y + d / 2)).setY(0.08); m.receiveShadow = true; scene.add(m); });
  { const [x, y, w, d] = plant.green; const m = new THREE.Mesh(box(w, 0.14, d), mat(C.green)); m.position.copy(P(x + w / 2, y + d / 2)).setY(0.08); m.receiveShadow = true; scene.add(m); }
  { const c = plant.conveyor; const len = c.hasta[1] - c.desde[1]; const m = new THREE.Mesh(box(1.4, 1.2, len), mat(C.conveyor)); m.position.copy(P(c.desde[0], c.desde[1] + len / 2)).setY(3); m.castShadow = true; scene.add(m); }

  // El Tejar: volumen fantasma (alto indicativo)
  {
    const n = plant.neighbour, g = box(n.w, 10, n.h);
    const ghost = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: C.tejar, transparent: true, opacity: 0.1, depthWrite: false }));
    ghost.position.copy(P(n.x + n.w / 2, n.y + n.h / 2)).setY(5); scene.add(ghost);
    const eg = new THREE.EdgesGeometry(g); disposables.push(eg);
    const lm = new THREE.LineBasicMaterial({ color: '#A9B0A4', transparent: true, opacity: 0.7 }); disposables.push(lm);
    const edges = new THREE.LineSegments(eg, lm); edges.position.copy(ghost.position); scene.add(edges);
  }

  // edificios
  const pv = pvTexture(); disposables.push(pv);
  const pickables: THREE.Mesh[] = [];
  const byId = new Map<string, THREE.Object3D[]>();
  for (const z of plant.zones) {
    const k = CAT[z.cat] as 'proc' | 'alm' | 'serv' | 'seg' | 'pers';
    const [wall, roof] = C[k] as string[];
    const h = heightOf(z);
    const objs: THREE.Object3D[] = [];
    if (z.type === 'silo') {
      [[7.5, 7.5], [22.5, 7.5], [7.5, 22.5], [22.5, 22.5]].forEach(([a, b]) => {
        const g = new THREE.CylinderGeometry(5.25, 5.25, 16, 40); disposables.push(g);
        const m = new THREE.Mesh(g, mat(wall)); m.position.copy(P(z.x + a, z.y + b)).setY(8);
        m.castShadow = m.receiveShadow = true; m.userData.id = z.id; scene.add(m); pickables.push(m); objs.push(m);
      });
    } else if (z.id === 'CH') {
      const g = new THREE.CylinderGeometry(1.1, 1.5, 30, 20); disposables.push(g);
      const m = new THREE.Mesh(g, mat(C.chimney)); m.position.copy(P(z.x + z.w / 2, z.y + z.h / 2)).setY(15);
      m.castShadow = true; m.userData.id = z.id; scene.add(m); pickables.push(m); objs.push(m);
    } else if (z.id === 'RS') {
      // reserva para un tercer horno: solo el contorno
      const pts = [P(z.x, z.y), P(z.x + z.w, z.y), P(z.x + z.w, z.y + z.h), P(z.x, z.y + z.h), P(z.x, z.y)].map(v => v.setY(0.4));
      const g = new THREE.BufferGeometry().setFromPoints(pts); disposables.push(g);
      const lm = new THREE.LineDashedMaterial({ color: C.alm[0], dashSize: 2, gapSize: 1.4 }); disposables.push(lm);
      const l = new THREE.Line(g, lm); l.computeLineDistances(); scene.add(l);
      const hit = new THREE.Mesh(box(z.w, 0.2, z.h), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(P(z.x + z.w / 2, z.y + z.h / 2)).setY(0.2); hit.userData.id = z.id; scene.add(hit); pickables.push(hit);
    } else {
      const roofM = z.cat === 'Proceso' && z.type === 'nave' ? mat('#FFFFFF', { map: pv.clone() }) : mat(z.id === 'BP' ? C.water : roof);
      if (roofM.map) { roofM.map.repeat.set(z.w / 10, z.h / 10); roofM.map.needsUpdate = true; disposables.push(roofM.map); }
      const wm = mat(z.id === 'BP' ? C.water : wall);
      const m = new THREE.Mesh(box(z.w, h, z.h), [wm, wm, roofM, wm, wm, wm]);
      m.position.copy(P(z.x + z.w / 2, z.y + z.h / 2)).setY(h / 2);
      m.castShadow = h > 1; m.receiveShadow = true; m.userData.id = z.id;
      scene.add(m); pickables.push(m); objs.push(m);
    }
    byId.set(z.id, objs);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(home.target);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minPolarAngle = 0.32; controls.maxPolarAngle = 1.22;
  controls.minDistance = 70; controls.maxDistance = 520;
  controls.addEventListener('change', () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -110, 110);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -120, 110);
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 20);
  });
  controls.update();

  const resize = () => {
    const r = host.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height); camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  // selección por toque o clic
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit) { highlight(hit.object.userData.id); window.dispatchEvent(new CustomEvent('plant:select', { detail: { id: hit.object.userData.id } })); }
  });

  let lit: string | null = null;
  function highlight(id: string | null) {
    if (lit) byId.get(lit)?.forEach(o => setEmissive(o as THREE.Mesh, '#000000'));
    lit = id;
    if (id) byId.get(id)?.forEach(o => setEmissive(o as THREE.Mesh, '#0E4A52'));
  }
  function setEmissive(m: THREE.Mesh, c: string) {
    const ms = Array.isArray(m.material) ? m.material : [m.material];
    ms.forEach(x => (x as THREE.MeshStandardMaterial).emissive?.set(c));
  }

  // recorrido guiado por las siete paradas de la ruta
  const zoneName = (id: string) => plant.zones.find(z => z.id === id)?.name ?? id;
  let tour: gsap.core.Timeline | null = null;
  function stopTour() {
    tour?.kill(); tour = null; tourBtn.textContent = 'Recorrido'; tourBtn.setAttribute('aria-pressed', 'false');
    card.hidden = true; controls.enabled = true;
  }
  function startTour() {
    controls.enabled = false;
    tourBtn.textContent = 'Detener'; tourBtn.setAttribute('aria-pressed', 'true');
    const d = opts.reduced ? 0 : 1.7, hold = opts.reduced ? 3.6 : 2.3;
    tour = gsap.timeline({ onComplete: () => { stopTour(); highlight(null); } });
    plant.route.forEach((r, i) => {
      const t = P(r.x, r.y).setY(5);
      const a = 0.75 + i * 0.16;
      const pos = new THREE.Vector3(t.x + Math.cos(a) * 92, 70, t.z + Math.sin(a) * 92);
      tour!.add(() => {
        card.hidden = false;
        card.innerHTML = `<span class="mono">${i + 1} / 7 · ${r.zone}</span><b>${r.label}</b><span>${zoneName(r.zone)}</span>`;
        highlight(r.zone);
        window.dispatchEvent(new CustomEvent('plant:select', { detail: { id: r.zone, quiet: true } }));
      });
      tour!.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: d, ease: 'power2.inOut' }, '<');
      tour!.to(controls.target, { x: t.x, y: t.y, z: t.z, duration: d, ease: 'power2.inOut' }, '<');
      tour!.to({}, { duration: hold });
    });
    tour.to(camera.position, { x: home.pos.x, y: home.pos.y, z: home.pos.z, duration: d, ease: 'power2.inOut' });
    tour.to(controls.target, { x: home.target.x, y: home.target.y, z: home.target.z, duration: d, ease: 'power2.inOut' }, '<');
  }
  const onTour = () => (tour ? stopTour() : startTour());
  tourBtn.addEventListener('click', onTour);

  function close() {
    stopTour();
    renderer.setAnimationLoop(null);
    ro.disconnect();
    controls.dispose();
    disposables.forEach(d => d.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    wrap.hidden = true;
    document.documentElement.classList.remove('p3d-open');
    tourBtn.removeEventListener('click', onTour);
    closeBtn.removeEventListener('click', close);
    window.removeEventListener('keydown', onKey);
    window.dispatchEvent(new CustomEvent('plant:close'));
    opts.onClose();
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !wrap.hidden) close(); };
  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', onKey);
  tourBtn.focus();
}
