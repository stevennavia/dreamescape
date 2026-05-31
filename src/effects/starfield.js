import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createStarfield() {
  const count = CONFIG.starCount;
  const radius = CONFIG.starFieldRadius;

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const baseSizes = new Float32Array(count);
  const twinkleSpeed = new Float32Array(count);
  const twinklePhase = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const colorTints = [];

  const starColor = new THREE.Color(0xffffff);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius + (Math.random() - 0.5) * 20;
    const i3 = i * 3;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.cos(phi);
    positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const s = 0.15 + Math.random() * 1.2;
    baseSizes[i] = s;
    sizes[i] = s;

    twinkleSpeed[i] = 0.3 + Math.random() * 0.8;
    twinklePhase[i] = Math.random() * Math.PI * 2;

    const warm = 0.06 + Math.random() * 0.08;
    const sat = 0.05 + Math.random() * 0.1;
    const lum = 0.85 + Math.random() * 0.15;
    colorTints.push({ warm, sat, lum });
    starColor.setHSL(warm, sat, lum);
    colors[i3] = starColor.r;
    colors[i3 + 1] = starColor.g;
    colors[i3 + 2] = starColor.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);

  let stageHue = 0.75;

  function setColors(top, mid, bottom) {
    stageHue = mid.getHSL({}).h;
  }

  const _tempCol = new THREE.Color();

  function update(time) {
    // Twinkle
    const sizeAttr = geo.attributes.size;
    const sa = sizeAttr.array;
    for (let i = 0; i < count; i++) {
      const tw = 0.5 + 0.5 * Math.sin(time * twinkleSpeed[i] + twinklePhase[i]);
      sa[i] = baseSizes[i] * (0.6 + 0.4 * tw);
    }
    sizeAttr.needsUpdate = true;

    // Color drift toward stage hue (only update every 10 frames for perf)
    if (Math.floor(time * 10) % 10 === 0) {
      const colAttr = geo.attributes.color;
      const cols = colAttr.array;
      for (let i = 0; i < count; i++) {
        const t = colorTints[i];
        const h = stageHue + (Math.sin(i * 0.7) * 0.04);
        _tempCol.setHSL(h < 0 ? h + 1 : h > 1 ? h - 1 : h, t.sat * 0.5, t.lum);
        const i3 = i * 3;
        cols[i3] = _tempCol.r;
        cols[i3 + 1] = _tempCol.g;
        cols[i3 + 2] = _tempCol.b;
      }
      colAttr.needsUpdate = true;
    }

    points.rotation.y += 0.0001;
    points.rotation.x += 0.00002;
  }

  return { points, update, setColors };
}
