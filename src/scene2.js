import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createCamera } from './camera.js';
import { createBeds } from './world/beds.js';
import { createPillars } from './world/pillars.js';
import { createDoor } from './world/door.js';
import { createSky } from './effects/sky.js';
import { createStarfield } from './effects/starfield.js';
import { createCosmicDust } from './effects/cosmicdust.js';
import { createTrail } from './effects/trail.js';
import { createMovementParticles } from './effects/movementParticles.js';

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

let currentStage = 3;
let prevStage = 3;
let stageLerp = 1;
let prevOrbCount = 0;

const _lerpedCol = {
  skyT: new THREE.Color(), skyM: new THREE.Color(), skyB: new THREE.Color(),
  fog: new THREE.Color(), amb: new THREE.Color(), moon: new THREE.Color(),
  fill: new THREE.Color(), rim: new THREE.Color(),
};

const CFG = CONFIG.scene2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(STAGES[3].skyT);
scene.fog = new THREE.FogExp2(new THREE.Color(STAGES[3].fog), STAGES[3].fogDensity);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = STAGES[3].exp;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(STAGES[3].amb, STAGES[3].ambIntensity);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(STAGES[3].moon, STAGES[3].moonIntensity);
moonLight.position.set(-30, 60, 20);
scene.add(moonLight);

const fillLight = new THREE.DirectionalLight(STAGES[3].fill, STAGES[3].fillIntensity);
fillLight.position.set(20, 30, -30);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(STAGES[3].rim, STAGES[3].rimIntensity);
rimLight.position.set(0, -10, 50);
scene.add(rimLight);

const beds = createBeds();
scene.add(beds.group);

const pillars = createPillars();
scene.add(pillars.group);

const door = createDoor(60, 68, 4);
scene.add(door.group);

const sky = createSky();
sky.setColors(new THREE.Color(STAGES[3].skyT), new THREE.Color(STAGES[3].skyM), new THREE.Color(STAGES[3].skyB));
scene.add(sky.group);

const starfield = createStarfield();
scene.add(starfield.points);

const cosmicDust = createCosmicDust();
cosmicDust.setColors(new THREE.Color(STAGES[3].skyT), new THREE.Color(STAGES[3].skyM), new THREE.Color(STAGES[3].skyB));
scene.add(cosmicDust.points);

const trail = createTrail();
scene.add(trail.points);

const movementParticles = createMovementParticles();
movementParticles.setColors(new THREE.Color(STAGES[3].skyT), new THREE.Color(STAGES[3].skyM), new THREE.Color(STAGES[3].skyB));
scene.add(movementParticles.points);

const { camera, update: updateCamera, resize: resizeCamera } = createCamera();
const input = createInput(camera);

function getPlatformTop(x, z, y) {
  return beds.getPlatformTop(x, z, y) ?? pillars.getPillarTop(x, z, y) ?? door.getCollision(x, z, y);
}
function getPlatformPush(x, z, y, r) {
  return beds.getPlatformPush(x, z, y, r) ?? pillars.getPillarPush(x, z, y, r);
}

const player = createPlayer(
  () => CFG.waterY - 100,
  getPlatformTop,
  getPlatformPush,
  () => null,
  () => null
);

const spawn = beds.getSpawn();
const pos = player.position;
pos.set(spawn.x, spawn.y, spawn.z);
player.group.position.set(spawn.x, spawn.y, spawn.z);
scene.add(player.group);

const orbHud = document.createElement('div');
orbHud.style.cssText = `
  position: fixed; top: 20px; right: 24px; z-index: 10;
  font-family: monospace; font-size: 20px; color: rgba(255,255,255,0.7);
  text-shadow: 0 0 8px rgba(255,204,51,0.4);
  pointer-events: none; user-select: none;
`;
document.body.appendChild(orbHud);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeCamera();
});

renderer.domElement.addEventListener('dblclick', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.body.requestFullscreen();
});

function lerpStage(t) {
  const from = STAGES[prevStage];
  const to = STAGES[currentStage];
  for (const key of ['skyT', 'skyM', 'skyB', 'fog', 'amb', 'moon', 'fill', 'rim']) {
    _lerpedCol[key].lerpColors(new THREE.Color(from[key]), new THREE.Color(to[key]), t);
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

function applyStage(lc, props) {
  scene.fog.color.copy(lc.fog);
  scene.fog.density = props.fogDensity;
  ambientLight.color.copy(lc.amb);
  ambientLight.intensity = props.ambIntensity;
  moonLight.color.copy(lc.moon);
  moonLight.intensity = props.moonIntensity;
  fillLight.color.copy(lc.fill);
  fillLight.intensity = props.fillIntensity;
  rimLight.color.copy(lc.rim);
  rimLight.intensity = props.rimIntensity;
  renderer.toneMappingExposure = props.exp;
  sky.setColors(lc.skyT, lc.skyM, lc.skyB);
  cosmicDust.setColors(lc.skyT, lc.skyM, lc.skyB);
  movementParticles.setColors(lc.skyT, lc.skyM, lc.skyB);
}

const clock = new THREE.Clock();
let prevGlowLevel = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  input.update(dt);
  player.update(input, camera, dt);
  updateCamera(player.position, input, dt, player.getState());

  beds.update(time, player.position);
  pillars.update(time);
  door.update(dt);
  sky.update(dt);
  starfield.update(time);
  cosmicDust.update(time, dt);
  movementParticles.update(dt, player.position, player.velocity, player.getState(), player.isGrounded);

  const orbCount = beds.getOrbCount();
  orbHud.textContent = `${orbCount} / 3`;

  if (orbCount > prevOrbCount) {
    prevOrbCount = orbCount;
    prevStage = currentStage;
    currentStage = (currentStage + 1) % STAGES.length;
    stageLerp = 0;
    door.setGlowLevel(orbCount);
  }

  if (stageLerp < 1) {
    stageLerp = Math.min(1, stageLerp + dt * 2.5);
    const ease = stageLerp < 0.5 ? 2 * stageLerp * stageLerp : 1 - Math.pow(-2 * stageLerp + 2, 2) / 2;
    const props = lerpStage(ease);
    applyStage(_lerpedCol, props);
  }

  const sp = door.getSingularityProgress();
  if (sp > 0) {
    scene.fog.density = THREE.MathUtils.lerp(STAGES[currentStage].fogDensity, 0.015, sp);
    ambientLight.intensity = THREE.MathUtils.lerp(STAGES[currentStage].ambIntensity, 0.05, sp);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.1, 0.3, sp);
  }

  const isMoving = player.velocity.lengthSq() > 0.1;
  if (isMoving) {
    const pp = player.group.position;
    trail.addPoint(new THREE.Vector3(pp.x, pp.y + 0.3, pp.z), new THREE.Color(CONFIG.playerColor));
  }
  trail.update(dt, isMoving);

  if (player.position.y < CFG.fallThreshold) {
    const s = beds.getSpawn();
    player.reset();
    const p = player.position;
    p.set(s.x, s.y, s.z);
    player.group.position.set(s.x, s.y, s.z);
    input.reset();
  }

  if (input.keys.has('KeyR')) {
    const s = beds.getSpawn();
    player.reset();
    const p = player.position;
    p.set(s.x, s.y, s.z);
    player.group.position.set(s.x, s.y, s.z);
    input.reset();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
