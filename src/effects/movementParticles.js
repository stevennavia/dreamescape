import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createMovementParticles() {
  const MAX = 200;
  const positions = new Float32Array(MAX * 3);
  const colors = new Float32Array(MAX * 3);

  for (let i = 0; i < MAX; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -1000;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = 1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const particles = [];
  let head = 0;
  let emitTimer = 0;

  for (let i = 0; i < MAX; i++) {
    particles.push({ alive: false, vx: 0, vy: 0, vz: 0, age: 0, lifetime: 0, hue: 0, sat: 0, lum: 0 });
  }

  const _playerColor = new THREE.Color(CONFIG.playerColor);
  const playerHue = _playerColor.getHSL({}).h;
  let stageHue = new THREE.Color(CONFIG.skyMid).getHSL({}).h;

  function setColors(top, mid, bot) {
    stageHue = new THREE.Color(mid).getHSL({}).h;
  }

  const _tc = new THREE.Color();

  function emit(pos, vel, hue, sat, lum, lifetime) {
    const i3 = head * 3;
    const p = particles[head];

    positions[i3] = pos.x;
    positions[i3 + 1] = pos.y;
    positions[i3 + 2] = pos.z;
    _tc.setHSL(hue, sat, lum);
    colors[i3] = _tc.r;
    colors[i3 + 1] = _tc.g;
    colors[i3 + 2] = _tc.b;

    p.alive = true;
    p.vx = vel.x;
    p.vy = vel.y;
    p.vz = vel.z;
    p.age = 0;
    p.lifetime = lifetime;
    p.hue = hue;
    p.sat = sat;
    p.lum = lum;

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    head = (head + 1) % MAX;
  }

  function update(dt, playerPos, playerVel, state, isGrounded) {
    const moving = playerVel.lengthSq() > 0.1;

    let rate = 0;

    if (isGrounded && moving) {
      rate = state === 'Run' ? 50 : 25;
      mat.size = state === 'Run' ? 0.5 : 0.35;
    } else if (state === 'Glide') {
      rate = 35;
      mat.size = 0.4;
    } else if (state === 'Dash') {
      rate = 80;
      mat.size = 0.6;
    } else {
      mat.size = 0.3;
    }

    if (rate > 0) {
      emitTimer += dt;
      const interval = 1 / rate;
      while (emitTimer >= interval) {
        emitTimer -= interval;

        const spread = 0.6;
        const px = playerPos.x + (Math.random() - 0.5) * spread;
        const py = playerPos.y - 0.5 + (Math.random() - 0.5) * 0.3;
        const pz = playerPos.z + (Math.random() - 0.5) * spread;

        let vx, vy, vz, hue, sat, lum, lifetime;

        if (state === 'Dash') {
          const dir = playerVel.clone().normalize();
          vx = -dir.x * (0.5 + Math.random() * 1) + (Math.random() - 0.5) * 0.5;
          vy = 0.2 + Math.random() * 0.8;
          vz = -dir.z * (0.5 + Math.random() * 1) + (Math.random() - 0.5) * 0.5;
          hue = 0.58;
          sat = 0.6;
          lum = 0.9;
          lifetime = 0.15 + Math.random() * 0.2;
        } else if (!isGrounded) {
          vx = (Math.random() - 0.5) * 0.3;
          vy = -(0.1 + Math.random() * 0.3);
          vz = (Math.random() - 0.5) * 0.3;
          hue = 0.58;
          sat = 0.4;
          lum = 0.8;
          lifetime = 0.6 + Math.random() * 0.8;
        } else {
          vx = (Math.random() - 0.5) * 0.4;
          vy = 0.2 + Math.random() * 0.6;
          vz = (Math.random() - 0.5) * 0.4;
          hue = (stageHue + 0.1 + 1) % 1;
          sat = 0.3;
          lum = 0.85 + Math.random() * 0.15;
          lifetime = 0.3 + Math.random() * 0.5;
        }

        emit(
          new THREE.Vector3(px, py, pz),
          new THREE.Vector3(vx, vy, vz),
          hue, sat, lum,
          lifetime
        );
      }
    }

    const posArr = geo.attributes.position.array;
    const colArr = geo.attributes.color.array;

    for (let i = 0; i < MAX; i++) {
      const p = particles[i];
      if (!p.alive) continue;

      p.age += dt;
      if (p.age >= p.lifetime) {
        p.alive = false;
        posArr[i * 3 + 1] = -1000;
        continue;
      }

      const t = p.age / p.lifetime;
      const i3 = i * 3;

      posArr[i3] += p.vx * dt;
      posArr[i3 + 1] += p.vy * dt;
      posArr[i3 + 2] += p.vz * dt;
      p.vy += 0.5 * dt;

      const fade = 1 - t;
      _tc.setHSL(p.hue, p.sat, p.lum * fade);
      colArr[i3] = _tc.r * fade;
      colArr[i3 + 1] = _tc.g * fade;
      colArr[i3 + 2] = _tc.b * fade;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  return { points, update, setColors };
}
