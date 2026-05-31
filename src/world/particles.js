import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createParticles() {
  const count = 1000;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const velocities = [];
  const baseColors = [];
  const worldHalf = CONFIG.worldSize / 2;

  const colorPalette = CONFIG.particleColors.map(c => new THREE.Color(c));

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * CONFIG.worldSize * 1.5;
    positions[i3 + 1] = Math.random() * 60 + 2;
    positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.worldSize * 1.5;
    sizes[i] = 0.15 + Math.random() * 0.6;

    const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    baseColors.push(col.clone());
    colors[i3] = col.r;
    colors[i3 + 1] = col.g;
    colors[i3 + 2] = col.b;

    velocities.push({
      x: (Math.random() - 0.5) * 0.15,
      y: 0.05 + Math.random() * 0.2,
      z: (Math.random() - 0.5) * 0.15,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);

  let stageColors = {
    top: new THREE.Color(CONFIG.skyTop),
    mid: new THREE.Color(CONFIG.skyMid),
    bot: new THREE.Color(CONFIG.skyBottom),
  };

  function setColors(top, mid, bot) {
    stageColors.top.copy(top);
    stageColors.mid.copy(mid);
    stageColors.bot.copy(bot);
  }

  const _tc = new THREE.Color();

  function update(time, dt) {
    const pos = geo.attributes.position.array;
    const colArr = geo.attributes.color.array;
    const hueShift = stageColors.mid.getHSL({}).h;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Drift upward with gentle horizontal sway
      pos[i3] += velocities[i].x * dt + Math.sin(time * 0.2 + i) * 0.005;
      pos[i3 + 1] += velocities[i].y * dt;
      pos[i3 + 2] += velocities[i].z * dt + Math.cos(time * 0.2 + i) * 0.005;

      // Wrap
      if (pos[i3] > worldHalf) pos[i3] = -worldHalf;
      if (pos[i3] < -worldHalf) pos[i3] = worldHalf;
      if (pos[i3 + 1] > 62) pos[i3 + 1] = 2;
      if (pos[i3 + 1] < 2) pos[i3 + 1] = 62;
      if (pos[i3 + 2] > worldHalf) pos[i3 + 2] = -worldHalf;
      if (pos[i3 + 2] < -worldHalf) pos[i3 + 2] = worldHalf;

      // Colors drift toward stage palette
      const base = baseColors[i];
      _tc.lerpColors(base, stageColors.mid, 0.01);
      colArr[i3] = _tc.r;
      colArr[i3 + 1] = _tc.g;
      colArr[i3 + 2] = _tc.b;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    mat.opacity = 0.4 + Math.sin(time * 0.08) * 0.1;
  }

  return { points, update, setColors };
}
