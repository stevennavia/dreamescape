import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { noise2D } from '../noise.js';

export function createTerrain() {
  const { worldSize, terrainResolution, noiseScale, noiseAmplitude } = CONFIG;
  const geo = new THREE.PlaneGeometry(worldSize, worldSize, terrainResolution, terrainResolution);
  geo.rotateX(-Math.PI / 2);

  const positions = geo.attributes.position.array;
  const colors = new Float32Array(positions.length);
  const colorLow = new THREE.Color(CONFIG.terrainLow);
  const colorMid = new THREE.Color(CONFIG.terrainMid);
  const colorHigh = new THREE.Color(CONFIG.terrainHigh);

  let minH = Infinity, maxH = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const nx = x * noiseScale;
    const nz = z * noiseScale;
    const h = (noise2D(nx, nz) * 0.5 + 0.5) * noiseAmplitude
      + Math.sin(x * 0.03) * 2
      + Math.cos(z * 0.025) * 2;
    positions[i + 1] = h;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }

  // Flatten edges slightly
  const halfWorld = worldSize / 2;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const dist = Math.sqrt(x * x + z * z);
    const fade = Math.max(0, 1 - (dist - halfWorld * 0.6) / (halfWorld * 0.4));
    positions[i + 1] *= fade;
  }

  for (let i = 0; i < positions.length; i += 3) {
    const h = positions[i + 1];
    const t = (h - minH) / (maxH - minH);
    const c = new THREE.Color();
    if (t < 0.5) {
      c.lerpColors(colorLow, colorMid, t * 2);
    } else {
      c.lerpColors(colorMid, colorHigh, (t - 0.5) * 2);
    }
    colors[i] = c.r;
    colors[i + 1] = c.g;
    colors[i + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.7,
    metalness: 0.1,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  function getHeightAt(x, z) {
    const nx = x * noiseScale;
    const nz = z * noiseScale;
    const dist = Math.sqrt(x * x + z * z);
    const halfWorld = worldSize / 2;
    const fade = Math.max(0, 1 - (dist - halfWorld * 0.6) / (halfWorld * 0.4));
    const h = (noise2D(nx, nz) * 0.5 + 0.5) * noiseAmplitude
      + Math.sin(x * 0.03) * 2
      + Math.cos(z * 0.025) * 2;
    return h * fade;
  }

  return { mesh, getHeightAt };
}
