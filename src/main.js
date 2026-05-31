import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createCamera } from './camera.js';
import { createUI } from './ui.js';
import { createTerrain } from './world/terrain.js';
import { createIslands } from './world/islands.js';
import { createCrystals } from './world/crystals.js';
import { createArches } from './world/arches.js';
import { createParticles } from './world/particles.js';
import { createTrail } from './effects/trail.js';
import { createSky } from './effects/sky.js';
import { createTower } from './world/tower.js';
import { createStarfield } from './effects/starfield.js';
import { createNebula } from './effects/nebula.js';

// --- 4 World Stages ---
const STAGES = [
  {
    name: 'Dream',
    skyT: '#0a0a2e', skyM: '#3a1a5e', skyB: '#c4709e',
    fog: '#3a2f5e', fogDensity: 0.004,
    amb: '#444466', ambIntensity: 0.6,
    moon: '#8888ff', moonIntensity: 1.5,
    fill: '#ff88cc', fillIntensity: 0.3,
    rim: '#44aaff', rimIntensity: 0.2,
    exp: 1.2,
  },
  {
    name: 'Ember',
    skyT: '#1a0505', skyM: '#6a1a0a', skyB: '#ff6633',
    fog: '#4a1a0a', fogDensity: 0.005,
    amb: '#553322', ambIntensity: 0.5,
    moon: '#ff7733', moonIntensity: 2.0,
    fill: '#ff4422', fillIntensity: 0.5,
    rim: '#ffaa44', rimIntensity: 0.4,
    exp: 0.9,
  },
  {
    name: 'Frost',
    skyT: '#000a1e', skyM: '#004466', skyB: '#88eeff',
    fog: '#003044', fogDensity: 0.006,
    amb: '#223355', ambIntensity: 0.7,
    moon: '#44ddff', moonIntensity: 2.5,
    fill: '#44ccff', fillIntensity: 0.5,
    rim: '#aaffff', rimIntensity: 0.5,
    exp: 1.5,
  },
  {
    name: 'Aether',
    skyT: '#1a1a2e', skyM: '#5a3a5e', skyB: '#ffddaa',
    fog: '#4a3a4e', fogDensity: 0.003,
    amb: '#554466', ambIntensity: 0.8,
    moon: '#ffddaa', moonIntensity: 3.0,
    fill: '#ffcccc', fillIntensity: 0.6,
    rim: '#ffeecc', rimIntensity: 0.6,
    exp: 1.0,
  },
];

let currentStage = 0;
let stageLerp = 1;
let prevOrbCount = 0;

// --- Flash overlay ---
const flashOverlay = document.createElement('div');
flashOverlay.style.cssText = `
  position: fixed; inset: 0; z-index: 20; pointer-events: none;
  background: white; opacity: 0; transition: opacity 0.08s;
`;
document.body.appendChild(flashOverlay);
let flashTimer = 0;

function triggerFlash() {
  flashOverlay.style.opacity = '0.6';
  flashTimer = 0.15;
}

// --- Stage colors cache ---
const _cur = {
  skyT: new THREE.Color(STAGES[0].skyT),
  skyM: new THREE.Color(STAGES[0].skyM),
  skyB: new THREE.Color(STAGES[0].skyB),
  fog: new THREE.Color(STAGES[0].fog),
  amb: new THREE.Color(STAGES[0].amb),
  moon: new THREE.Color(STAGES[0].moon),
  fill: new THREE.Color(STAGES[0].fill),
  rim: new THREE.Color(STAGES[0].rim),
};

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = _cur.skyT.clone();
scene.fog = new THREE.FogExp2(_cur.fog.clone(), STAGES[0].fogDensity);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = STAGES[0].exp;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(_cur.amb, STAGES[0].ambIntensity);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(_cur.moon, STAGES[0].moonIntensity);
moonLight.position.set(-30, 60, 20);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 150;
moonLight.shadow.camera.left = -80;
moonLight.shadow.camera.right = 80;
moonLight.shadow.camera.top = 80;
moonLight.shadow.camera.bottom = -80;
scene.add(moonLight);

const fillLight = new THREE.DirectionalLight(_cur.fill, STAGES[0].fillIntensity);
fillLight.position.set(20, 30, -30);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(_cur.rim, STAGES[0].rimIntensity);
rimLight.position.set(0, -10, 50);
scene.add(rimLight);

// --- World ---
const terrain = createTerrain();
scene.add(terrain.mesh);

const islands = createIslands(terrain.getHeightAt);
scene.add(islands.group);

const crystals = createCrystals(terrain.getHeightAt);
scene.add(crystals.group);

const arches = createArches(terrain.getHeightAt);
scene.add(arches.group);

const tower = createTower(terrain.getHeightAt);
scene.add(tower.group);

const particles = createParticles();
scene.add(particles.points);

const sky = createSky();
scene.add(sky.group);

const starfield = createStarfield();
scene.add(starfield.points);

const nebula = createNebula();
scene.add(nebula.group);

// --- Trail ---
const trail = createTrail();
scene.add(trail.points);

// --- Ground orb (positioned near center, accessible from start) ---
const groundOrbY = terrain.getHeightAt(5, 5) + 3;
const gOrbMat = new THREE.MeshPhysicalMaterial({
  color: CONFIG.orbColor,
  emissive: CONFIG.orbColor,
  emissiveIntensity: 1.0,
  roughness: 0.1,
  metalness: 0,
  transparent: true,
  opacity: 0.9,
});
const gOrb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), gOrbMat);
gOrb.position.set(5, groundOrbY, 5);
scene.add(gOrb);

const gGlow = new THREE.Mesh(
  new THREE.SphereGeometry(2.4, 8, 8),
  new THREE.MeshBasicMaterial({ color: CONFIG.orbColor, transparent: true, opacity: 0.15 })
);
gGlow.position.copy(gOrb.position);
scene.add(gGlow);

const gLight = new THREE.PointLight(CONFIG.orbColor, 1.5, 15);
gLight.position.copy(gOrb.position);
scene.add(gLight);

let groundOrbCollected = false;

// --- Portal at center (initially hidden) ---
const centerPortalGroup = new THREE.Group();
const cPortalY = terrain.getHeightAt(0, 0) + 4;

const cpRingMat = new THREE.MeshStandardMaterial({
  color: CONFIG.portalColor,
  emissive: CONFIG.portalGlow,
  emissiveIntensity: 2.0,
  roughness: 0.2,
  metalness: 0.1,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
});
const cpRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.25, 16, 32), cpRingMat);
cpRing.position.set(0, cPortalY, 0);
cpRing.rotation.x = Math.PI / 3;
centerPortalGroup.add(cpRing);

const cpDiscMat = new THREE.MeshBasicMaterial({
  color: CONFIG.portalGlow,
  transparent: true,
  opacity: 0.12,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const cpDisc = new THREE.Mesh(new THREE.RingGeometry(0.3, 2.7, 24), cpDiscMat);
cpDisc.position.copy(cpRing.position);
cpDisc.rotation.copy(cpRing.rotation);
centerPortalGroup.add(cpDisc);

const cpRing2Mat = new THREE.MeshBasicMaterial({
  color: CONFIG.portalGlow,
  transparent: true,
  opacity: 0.35,
});
const cpRing2 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 8, 32), cpRing2Mat);
cpRing2.position.copy(cpRing.position);
cpRing2.rotation.x = Math.PI / 3;
centerPortalGroup.add(cpRing2);

const cpLight = new THREE.PointLight(CONFIG.portalColor, 3, 25);
cpLight.position.copy(cpRing.position);
centerPortalGroup.add(cpLight);

centerPortalGroup.visible = false;
scene.add(centerPortalGroup);

let portalActive = false;
let portalAdvancing = false;

// --- Camera ---
const { camera, update: updateCamera, resize: resizeCamera } = createCamera();

// --- Input ---
const input = createInput(camera);

// --- Player ---
const player = createPlayer(terrain.getHeightAt, islands.getCollision, islands.getPush, tower.getCollision, tower.getWallPush);
scene.add(player.group);

// --- UI ---
const ui = createUI();

// --- Resize ---
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  resizeCamera();
});

// --- Fullscreen (double click) ---
renderer.domElement.addEventListener('dblclick', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen();
  }
});

// --- Game Loop ---
const clock = new THREE.Clock();
const _lerped = {
  skyT: new THREE.Color(), skyM: new THREE.Color(), skyB: new THREE.Color(),
  fog: new THREE.Color(), amb: new THREE.Color(), moon: new THREE.Color(),
  fill: new THREE.Color(), rim: new THREE.Color(),
};

function lerpStage(t) {
  const from = STAGES[currentStage];
  const to = STAGES[Math.min(currentStage + 1, STAGES.length - 1)];
  for (const key of ['skyT', 'skyM', 'skyB', 'fog', 'amb', 'moon', 'fill', 'rim']) {
    _lerped[key].lerpColors(new THREE.Color(from[key]), new THREE.Color(to[key]), t);
  }
  return {
    fogDensity: from.fogDensity + (to.fogDensity - from.fogDensity) * t,
    ambIntensity: from.ambIntensity + (to.ambIntensity - from.ambIntensity) * t,
    moonIntensity: from.moonIntensity + (to.moonIntensity - from.moonIntensity) * t,
    fillIntensity: from.fillIntensity + (to.fillIntensity - from.fillIntensity) * t,
    rimIntensity: from.rimIntensity + (to.rimIntensity - from.rimIntensity) * t,
    exp: from.exp + (to.exp - from.exp) * t,
  };
}

function applyStage(s, props) {
  scene.fog.color.copy(s.fog);
  scene.fog.density = props.fogDensity;
  ambientLight.color.copy(s.amb);
  ambientLight.intensity = props.ambIntensity;
  moonLight.color.copy(s.moon);
  moonLight.intensity = props.moonIntensity;
  fillLight.color.copy(s.fill);
  fillLight.intensity = props.fillIntensity;
  rimLight.color.copy(s.rim);
  rimLight.intensity = props.rimIntensity;
  renderer.toneMappingExposure = props.exp;
  sky.setColors(s.skyT, s.skyM, s.skyB);
  starfield.setColors(s.skyT, s.skyM, s.skyB);
  nebula.setColors(s.skyT, s.skyM, s.skyB);
  particles.setColors(s.skyT, s.skyM, s.skyB);
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  // --- Orb collection (each orb advances one stage) ---
  const islandCount = islands.getOrbCount();
  const totalCollected = islandCount + (groundOrbCollected ? 1 : 0);

  // Check ground orb collection
  if (!groundOrbCollected && player.position) {
    const dx = player.position.x - gOrb.position.x;
    const dy = player.position.y - gOrb.position.y;
    const dz = player.position.z - gOrb.position.z;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 2.5) {
      groundOrbCollected = true;
      gOrb.visible = false;
      gGlow.visible = false;
      gLight.visible = false;
    }
  }

  // Advance stage per orb collected
  if (totalCollected > prevOrbCount) {
    prevOrbCount = totalCollected;
    if (currentStage < STAGES.length - 1) {
      currentStage++;
      stageLerp = 0;
      triggerFlash();
    }
  }

  // Activate portal when all 3 orbs collected
  if (totalCollected >= 3 && !portalActive) {
    portalActive = true;
    centerPortalGroup.visible = true;
  }

  // Portal enter → bonus visual (no stage change, already happened per orb)
  if (portalActive && !portalAdvancing && player.position) {
    const dx = player.position.x;
    const dy = player.position.y - cPortalY;
    const dz = player.position.z;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 4) {
      portalAdvancing = true;
      centerPortalGroup.visible = false;
      triggerFlash();
    }
  }

  // Stage transition lerp
  if (stageLerp < 1) {
    stageLerp = Math.min(1, stageLerp + dt * 2.5);
    const ease = stageLerp < 0.5 ? 2 * stageLerp * stageLerp : 1 - Math.pow(-2 * stageLerp + 2, 2) / 2;
    const props = lerpStage(ease);
    applyStage(_lerped, props);
  }

  // Flash fade
  if (flashTimer > 0) {
    flashTimer -= dt;
    flashOverlay.style.opacity = String(Math.max(0, flashTimer / 0.15) * 0.6);
  }

  // Update input
  input.update(dt);

  // Update player
  player.update(input, camera, dt);

  // Update camera
  updateCamera(player.position, input, dt, player.getState());

  // Update world
  islands.update(time, player.position);
  crystals.update(time);
  arches.update(time);
  particles.update(time, dt);
  sky.update(dt);
  starfield.update(time);
  nebula.update(time);

  // Update tower
  tower.update(time, player.position);

  // Animate ground orb
  if (!groundOrbCollected) {
    const bob = Math.sin(time * 0.5) * 0.3;
    gOrb.position.y = groundOrbY + bob;
    gGlow.position.y = groundOrbY + bob;
    gLight.position.y = groundOrbY + bob;
    gOrb.rotation.y += 0.02;
    const pulse = 0.6 + Math.sin(time * 2) * 0.4;
    gOrb.material.emissiveIntensity = pulse;
    gGlow.material.opacity = 0.12 + Math.sin(time * 1.5) * 0.08;
    gLight.intensity = 1.0 + Math.sin(time * 1.5) * 0.5;
  }

  // Animate center portal
  if (portalActive) {
    const pRot = time * 0.12;
    cpRing.rotation.z = pRot;
    cpRing2.rotation.z = pRot;
    cpDisc.rotation.z = pRot;
    const pulse = 1 + Math.sin(time * 0.8) * 0.15;
    cpRingMat.emissiveIntensity = pulse * 2;
    cpDiscMat.opacity = 0.08 + Math.sin(time * 0.5) * 0.04;
    cpLight.intensity = 2 + Math.sin(time * 0.7) * 0.8;
  }

  // Update trail
  const isMoving = player.velocity.lengthSq() > 0.1;
  const trailActive = (player.getState() === 'Run' || player.getState() === 'Dash' || player.getState() === 'Glide') && isMoving;
  if (trailActive) {
    const pp = player.group.position;
    const trailPos = new THREE.Vector3(pp.x, pp.y + 0.3, pp.z);
    trail.addPoint(trailPos, new THREE.Color(CONFIG.playerColor));
  }
  trail.update(dt, trailActive);

  // Update UI
  ui.update(totalCollected, CONFIG.totalOrbs);

  // R key reset
  if (input.keys.has('KeyR')) {
    player.reset();
    input.reset();
  }

  // Render
  renderer.render(scene, camera);
}

animate();
