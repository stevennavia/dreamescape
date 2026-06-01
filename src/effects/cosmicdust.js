import * as THREE from 'three';

export function createCosmicDust() {
  const group = new THREE.Group();
  const count = 7000;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const baseSizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const data = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45;
    const r = 40 + Math.random() * 320;

    const i3 = i * 3;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.cos(phi) + 30;
    positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const s = 0.3 + Math.random() * 1.8;
    baseSizes[i] = s;
    sizes[i] = s;

    colors[i3] = 0.5;
    colors[i3 + 1] = 0.3;
    colors[i3 + 2] = 0.6;

    data.push({
      theta,
      phi,
      r,
      orbitSpeed: 0.008 + Math.random() * 0.025,
      orbitTilt: (Math.random() - 0.5) * 0.15,
      floatAmp: 0.5 + Math.random() * 2.5,
      floatSpeed: 0.08 + Math.random() * 0.25,
      floatPhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.2 + Math.random() * 0.6,
      pulsePhase: Math.random() * Math.PI * 2,
      hueOffset: (Math.random() - 0.5) * 0.25,
      sat: 0.3 + Math.random() * 0.5,
      lum: 0.3 + Math.random() * 0.5,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  // --- Shooting Stars ---
  const shootingStars = [];
  const MAX_STARS = 3;
  const TRAIL_LEN = 25;
  let nextSpawn = 4 + Math.random() * 6;

  function spawnShootingStar() {
    let star = shootingStars.find(s => !s.active);
    if (!star) {
      if (shootingStars.length >= MAX_STARS) return;

      const sp = new Float32Array(TRAIL_LEN * 3);
      const sc = new Float32Array(TRAIL_LEN * 3);

      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      sGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));

      const sMat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const sPoints = new THREE.Points(sGeo, sMat);
      group.add(sPoints);

      star = { active: false, points: sPoints, geo: sGeo, mat: sMat, positions: sp, colors: sc, age: 0, lifetime: 0 };
      shootingStars.push(star);
    }

    const theta = Math.random() * Math.PI * 2;
    const phi = 0.1 + Math.random() * 0.3;
    const r = 380;
    const startX = r * Math.sin(phi) * Math.cos(theta);
    const startY = 80 + Math.random() * 180;
    const startZ = r * Math.sin(phi) * Math.sin(theta);

    const dirAngle = (Math.random() - 0.5) * 0.8;
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta + dirAngle),
      -0.2 - Math.random() * 0.3,
      Math.sin(phi) * Math.sin(theta + dirAngle)
    ).normalize();

    star.active = true;
    star.startPos = new THREE.Vector3(startX, startY, startZ);
    star.dir = dir;
    star.speed = 70 + Math.random() * 60;
    star.age = 0;
    star.lifetime = 0.5 + Math.random() * 0.5;
    star.brightness = 0.8 + Math.random() * 0.2;
    star.points.visible = true;
  }

  let stageHue = 0.75;

  function setColors(top, mid, bot) {
    stageHue = new THREE.Color(mid).getHSL({}).h;
  }

  const _tempCol = new THREE.Color();

  function update(time, dt) {
    // --- Dust particles ---
    const pos = geo.attributes.position.array;
    const col = geo.attributes.color.array;
    const sizeArr = geo.attributes.size.array;

    for (let i = 0; i < count; i++) {
      const d = data[i];
      const i3 = i * 3;

      d.theta += d.orbitSpeed * dt;
      d.phi += d.orbitSpeed * d.orbitTilt * Math.sin(time * 0.1 + d.floatPhase) * dt;

      const floatY = Math.sin(time * d.floatSpeed + d.floatPhase) * d.floatAmp;
      const rOff = d.r + Math.sin(time * d.orbitSpeed * 3 + d.floatPhase) * 3;

      pos[i3] = rOff * Math.sin(d.phi) * Math.cos(d.theta);
      pos[i3 + 1] = rOff * Math.cos(d.phi) + 30 + floatY;
      pos[i3 + 2] = rOff * Math.sin(d.phi) * Math.sin(d.theta);

      const pulse = 0.5 + 0.5 * Math.sin(time * d.pulseSpeed + d.pulsePhase);
      sizeArr[i] = baseSizes[i] * (0.5 + 0.5 * pulse);

      const h = (stageHue + d.hueOffset + 1) % 1;
      _tempCol.setHSL(h, d.sat, d.lum * (0.6 + 0.4 * pulse));
      col[i3] = _tempCol.r;
      col[i3 + 1] = _tempCol.g;
      col[i3 + 2] = _tempCol.b;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    // --- Shooting stars ---
    nextSpawn -= dt;
    if (nextSpawn <= 0) {
      spawnShootingStar();
      nextSpawn = 3 + Math.random() * 7;
    }

    for (const star of shootingStars) {
      if (!star.active) continue;

      star.age += dt;
      if (star.age > star.lifetime) {
        star.active = false;
        star.points.visible = false;
        continue;
      }

      const progress = star.age / star.lifetime;
      const headPos = star.startPos.clone().add(star.dir.clone().multiplyScalar(star.speed * star.age));

      for (let i = 0; i < TRAIL_LEN; i++) {
        const t = i / TRAIL_LEN;
        const trailPos = headPos.clone().add(star.dir.clone().multiplyScalar(-star.speed * t * 0.12));
        star.positions[i * 3] = trailPos.x;
        star.positions[i * 3 + 1] = trailPos.y;
        star.positions[i * 3 + 2] = trailPos.z;

        const alpha = (1 - t) * (1 - progress * 0.5) * star.brightness;
        star.colors[i * 3] = alpha;
        star.colors[i * 3 + 1] = alpha * 0.85;
        star.colors[i * 3 + 2] = alpha;
      }

      star.geo.attributes.position.needsUpdate = true;
      star.geo.attributes.color.needsUpdate = true;
    }
  }

  return { points: group, update, setColors };
}
