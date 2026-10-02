import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Device geometry in "width = 1" units. kind=phone matches the flat iPhone model in src/phoneFrame.ts;
// kind=tablet is a flatter-bezel iPad with no dynamic island, aspect matching the iPad page preset.
const params = new URLSearchParams(location.search);
const KIND = params.get('kind') ?? 'phone';
const IS_TABLET = KIND === 'tablet';

const W = 1;
const H = IS_TABLET ? 2732 / 2048 : 2.168;
const D = IS_TABLET ? 0.045 : 0.07; // body thickness
const BEZEL = IS_TABLET ? 0.022 : 0.034;
const FRAME_BEVEL = IS_TABLET ? 0.008 : 0.014;
const CORNER_R = IS_TABLET ? 0.07 : 0.13;
const SCREEN_CORNER_R = IS_TABLET ? 0.045 : 0.098;
const SCREEN_W = W - BEZEL * 2;
const SCREEN_H = H - BEZEL * 2;

const OUT_W = 900;
const OUT_H = IS_TABLET ? Math.round(OUT_W * H) : 1500;
const ROT = {
  x: Number(params.get('rx') ?? 0),
  y: Number(params.get('ry') ?? -0.4),
  z: Number(params.get('rz') ?? -0.12),
};
const RECEIVER = 'http://localhost:5599/';

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(OUT_W, OUT_H);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(-3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0xe6ebff, 0.7);
rim.position.set(4, -1, -3);
scene.add(rim);

const phone = new THREE.Group();
scene.add(phone);

// Metal frame (dark titanium)
const frameGeo = new THREE.ExtrudeGeometry(roundedRectShape(W, H, CORNER_R), {
  depth: D,
  bevelEnabled: true,
  bevelThickness: FRAME_BEVEL,
  bevelSize: FRAME_BEVEL,
  bevelSegments: 8,
  curveSegments: 48,
});
frameGeo.translate(0, 0, -D / 2);
const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a4b50, metalness: 1, roughness: 0.3 });
phone.add(new THREE.Mesh(frameGeo, frameMat));

const zFront = D / 2 + FRAME_BEVEL;

// Black front glass (the bezel area around the screen)
const glassGeo = new THREE.ShapeGeometry(roundedRectShape(W - 0.006, H - 0.006, CORNER_R - 0.006), 48);
const glass = new THREE.Mesh(glassGeo, new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.3, roughness: 0.12 }));
glass.position.z = zFront + 0.0008;
phone.add(glass);

// Screen: invisible-but-depth-writing plane, so the front glass behind it is rejected and the PNG gets a hole
const screenShape = roundedRectShape(SCREEN_W, SCREEN_H, SCREEN_CORNER_R);
const screen = new THREE.Mesh(new THREE.ShapeGeometry(screenShape, 48), new THREE.MeshBasicMaterial({ colorWrite: false }));
const zScreen = zFront + (IS_TABLET ? 0.0012 : 0.002);
screen.position.z = zScreen;
screen.renderOrder = -1;
phone.add(screen);

// Dynamic island, drawn over the screenshot (phone only — recent iPads have no notch)
if (!IS_TABLET) {
  const island = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRectShape(0.29, 0.085, 0.0425), 24),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  island.position.set(0, SCREEN_H / 2 - 0.1, zScreen + 0.0008);
  phone.add(island);
}

// Side buttons
function button(x, y, h) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.04), frameMat);
  b.position.set(x, y, 0);
  phone.add(b);
}
if (IS_TABLET) {
  button(W / 2 + 0.006, H / 2 - 0.1, 0.045); // power, top edge near corner
  button(-W / 2 - 0.006, H * 0.28, 0.12); // volume rocker
} else {
  button(-W / 2 - 0.01, 0.62, 0.09); // action
  button(-W / 2 - 0.01, 0.42, 0.17); // volume up
  button(-W / 2 - 0.01, 0.18, 0.17); // volume down
  button(W / 2 + 0.01, 0.4, 0.28); // power
}

phone.rotation.order = 'YXZ';
phone.rotation.set(ROT.x, ROT.y, ROT.z);

// ortho=1 renders with no perspective at all, so a device's opposite edges stay exactly parallel.
// The tablet defaults to it (a wide, flat iPad shows perspective convergence far more than a phone does).
const ORTHO = (params.get('ortho') ?? (IS_TABLET ? '1' : '0')) === '1';
const ORTHO_HALF_H = 3; // world units from centre to top of the view, before the fit zoom
const camera = ORTHO
  ? new THREE.OrthographicCamera(-ORTHO_HALF_H * (OUT_W / OUT_H), ORTHO_HALF_H * (OUT_W / OUT_H), ORTHO_HALF_H, -ORTHO_HALF_H, 1, 40)
  : new THREE.PerspectiveCamera(Number(params.get('fov') ?? 14), OUT_W / OUT_H, 0.1, 100);
camera.position.set(0, 0, 12);
camera.lookAt(0, 0, 0);

// Fit the phone in the frame with a margin, keeping it centred on its projected bounding box.
function project(v) {
  const p = v.clone().applyMatrix4(phone.matrixWorld).project(camera);
  return { x: (p.x * 0.5 + 0.5) * OUT_W, y: (1 - (p.y * 0.5 + 0.5)) * OUT_H };
}
function bounds() {
  phone.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const p = project(new THREE.Vector3((sx * W) / 2, (sy * H) / 2, (sz * D) / 2));
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}
for (let i = 0; i < 4; i++) {
  const b = bounds();
  const fit = Math.min((OUT_W * 0.9) / (b.maxX - b.minX), (OUT_H * 0.94) / (b.maxY - b.minY));
  if (ORTHO) {
    camera.zoom *= fit;
    camera.updateProjectionMatrix();
  } else {
    camera.position.z /= fit;
  }
  camera.lookAt(0, 0, 0);
}
{
  const b = bounds();
  // Re-centre by shifting the phone (keeps perspective consistent)
  const cx = (b.minX + b.maxX) / 2 - OUT_W / 2;
  const cy = (b.minY + b.maxY) / 2 - OUT_H / 2;
  const worldPerPx = ORTHO
    ? (2 * ORTHO_HALF_H) / camera.zoom / OUT_H
    : (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / OUT_H;
  phone.position.x -= cx * worldPerPx;
  phone.position.y += cy * worldPerPx;
}

if (!ORTHO) {
  camera.near = Math.max(0.1, camera.position.z - 4);
  camera.far = camera.position.z + 4;
  camera.updateProjectionMatrix();
}
renderer.render(scene, camera);

// Where the screen's four corners ended up (TL, TR, BR, BL), as 0..1 fractions of the image.
const corners = [
  [-SCREEN_W / 2, SCREEN_H / 2],
  [SCREEN_W / 2, SCREEN_H / 2],
  [SCREEN_W / 2, -SCREEN_H / 2],
  [-SCREEN_W / 2, -SCREEN_H / 2],
].map(([x, y]) => {
  phone.updateMatrixWorld(true);
  const p = project(new THREE.Vector3(x, y, zScreen));
  return [Number((p.x / OUT_W).toFixed(5)), Number((p.y / OUT_H).toFixed(5))];
});
const meta = { width: OUT_W, height: OUT_H, screenAspect: Number((SCREEN_H / SCREEN_W).toFixed(4)), quad: corners };
window.__meta = meta;
const label = document.createElement('div');
label.textContent = JSON.stringify(meta);
document.body.appendChild(label);

if (params.get('save') === '1') {
  renderer.domElement.toBlob(async (blob) => {
    const name = params.get('name') ?? 'frame';
    await fetch(RECEIVER + name + '.png', { method: 'POST', body: blob });
    await fetch(RECEIVER + name + '.json', { method: 'POST', body: JSON.stringify(meta, null, 2) });
    label.textContent += '  — saved';
  }, 'image/png');
}
