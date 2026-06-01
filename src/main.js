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
import { createMovementParticles } from './effects/movementParticles.js';
import { createSky } from './effects/sky.js';
import { createTower } from './world/tower.js';
import { createStarfield } from './effects/starfield.js';
import { createNebula } from './effects/nebula.js';
import { createCosmicDust } from './effects/cosmicdust.js';
import { createBlackHole } from './effects/blackhole.js';

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
  {
    name: 'Ascend',
    skyT: '#050a05', skyM: '#228844', skyB: '#88ffbb',
    fog: '#116633', fogDensity: 0.003,
    amb: '#55cc88', ambIntensity: 1.1,
    moon: '#ccffdd', moonIntensity: 4.0,
    fill: '#66ffaa', fillIntensity: 0.9,
    rim: '#aaffcc', rimIntensity: 0.9,
    exp: 1.5,
  },
];

let currentStage = 0;
let stageLerp = 1;
let prevOrbCount = 0;
let prevTowerCollected = false;

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

const tower = createTower(terrain.getHeightAt);
scene.add(tower.group);

const towerPos = tower.getWorldPosition();
const islands = createIslands(terrain.getHeightAt, towerPos);
scene.add(islands.group);

const crystals = createCrystals(terrain.getHeightAt);
scene.add(crystals.group);

const arches = createArches(terrain.getHeightAt);
scene.add(arches.group);

const particles = createParticles();
scene.add(particles.points);

const sky = createSky();
scene.add(sky.group);

const starfield = createStarfield();
scene.add(starfield.points);

const nebula = createNebula();
scene.add(nebula.group);

const cosmicDust = createCosmicDust();
scene.add(cosmicDust.points);

// --- Trail ---
const trail = createTrail();
scene.add(trail.points);

const movementParticles = createMovementParticles();
scene.add(movementParticles.points);

// --- Ground orb (positioned between spawn and tower) ---
const _towPos = tower.getWorldPosition();
const _orbDir = new THREE.Vector3(_towPos.x, 0, _towPos.z).normalize();
const _orbDist = 20;
const _orbGX = _orbDir.x * _orbDist;
const _orbGZ = _orbDir.z * _orbDist;
const groundOrbY = terrain.getHeightAt(_orbGX, _orbGZ) + 3;
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
gOrb.position.set(_orbGX, groundOrbY, _orbGZ);
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

// --- Orb burst particles ---
const BURST_COUNT = 80;
const burstPositions = new Float32Array(BURST_COUNT * 3);
const burstColors = new Float32Array(BURST_COUNT * 3);
const burstData = [];
let burstActive = false;

const burstGeo = new THREE.BufferGeometry();
burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
burstGeo.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));

const burstMat = new THREE.PointsMaterial({
  size: 0.35,
  vertexColors: true,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true,
});

const burstPoints = new THREE.Points(burstGeo, burstMat);
burstPoints.visible = false;
scene.add(burstPoints);

const _burstCol = new THREE.Color();

function triggerBurst(pos) {
  const hue = new THREE.Color(CONFIG.orbColor).getHSL({}).h;
  for (let i = 0; i < BURST_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 3 + Math.random() * 6;
    burstData[i] = {
      px: pos.x, py: pos.y, pz: pos.z,
      vx: Math.sin(phi) * Math.cos(theta) * speed,
      vy: Math.sin(phi) * Math.sin(theta) * speed + Math.random() * 3,
      vz: Math.cos(phi) * speed,
      lifetime: 0.8 + Math.random() * 0.7,
      age: 0,
      hue: hue + (Math.random() - 0.5) * 0.08,
      sat: 0.6 + Math.random() * 0.4,
      lum: 0.5 + Math.random() * 0.4,
    };
  }
  burstActive = true;
  burstPoints.visible = true;
}

// --- Camera ---
const { camera, update: updateCamera, resize: resizeCamera, setOverride: setCamOverride, clearOverride: clearCamOverride, addShake: addCamShake } = createCamera();

// --- Input ---
const input = createInput(camera);

// --- Player ---
const player = createPlayer(terrain.getHeightAt, islands.getCollision, islands.getPush, tower.getCollision, tower.getWallPush);
scene.add(player.group);

// --- UI ---
const ui = createUI();

// --- Black Hole Portal ---
const absorbables = [];
crystals.group.traverse(obj => { if (obj.isMesh) absorbables.push(obj); });
arches.group.traverse(obj => { if (obj.isMesh) absorbables.push(obj); });
islands.group.traverse(obj => { if (obj.isMesh) absorbables.push(obj); });
tower.group.traverse(obj => { if (obj.isMesh) absorbables.push(obj); });

const blackHole = createBlackHole({
  player,
  cameraObj: { setOverride: setCamOverride, addShake: addCamShake },
  input, ui,
  terrainY: terrain.getHeightAt(0, 0),
  absorbables,
});
scene.add(blackHole.group);

let portalActive = false;

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
  cosmicDust.setColors(s.skyT, s.skyM, s.skyB);
  movementParticles.setColors(s.skyT, s.skyM, s.skyB);
  particles.setColors(s.skyT, s.skyM, s.skyB);
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  // --- Orb collection (each orb advances one stage) ---
  const islandCount = islands.getOrbCount();
  const totalCollected = islandCount + (groundOrbCollected ? 1 : 0) + (tower.getOrbCollected() ? 1 : 0);

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
      triggerBurst(gOrb.position);
    }
  }

  // Tower orb burst
  if (tower.getOrbCollected() && !prevTowerCollected) {
    prevTowerCollected = true;
    triggerBurst(tower.getOrbPosition());
    ui.showHint("Hold Space To Glide", 2);
  }

  // Advance stage per orb collected
  if (totalCollected > prevOrbCount) {
    prevOrbCount = totalCollected;
    if (totalCollected < 3 && currentStage < 3) {
      currentStage++;
      stageLerp = 0;
      triggerFlash();
    } else if (totalCollected >= 3) {
      triggerFlash();
    }
  }

  // Activate black hole portal when all 3 orbs collected
  if (totalCollected >= 3 && !portalActive) {
    portalActive = true;
    blackHole.start();
    setCamOverride(blackHole.portalPosition, 0.3);
    setTimeout(() => clearCamOverride(), 5000);
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
  movementParticles.update(dt, player.position, player.velocity, player.getState(), player.isGrounded);
  particles.update(time, dt);
  sky.update(dt);
  starfield.update(time);
  nebula.update(time);
  cosmicDust.update(time, dt);

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

  // Update orb burst
  if (burstActive) {
    let alive = false;
    for (let i = 0; i < BURST_COUNT; i++) {
      const d = burstData[i];
      if (!d || d.age >= d.lifetime) continue;
      alive = true;
      d.age += dt;
      const t = d.age / d.lifetime;
      d.px += d.vx * dt;
      d.py += d.vy * dt;
      d.pz += d.vz * dt;
      d.vy -= 5 * dt;
      const i3 = i * 3;
      burstPositions[i3] = d.px;
      burstPositions[i3 + 1] = d.py;
      burstPositions[i3 + 2] = d.pz;
      const fade = 1 - t;
      _burstCol.setHSL(d.hue, d.sat, d.lum * fade);
      burstColors[i3] = _burstCol.r * fade;
      burstColors[i3 + 1] = _burstCol.g * fade;
      burstColors[i3 + 2] = _burstCol.b * fade;
    }
    burstGeo.attributes.position.needsUpdate = true;
    burstGeo.attributes.color.needsUpdate = true;
    if (!alive) {
      burstActive = false;
      burstPoints.visible = false;
    }
  }

  // Update black hole
  if (portalActive) {
    blackHole.update(dt, time);
    blackHole.updatePlayerPull(dt);

    // Ambient effects during black hole sequence
    if (!blackHole.getIsTransitioning()) {
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 0.008, dt * 0.1);
      ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, 0.6, dt * 0.1);
    }
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
