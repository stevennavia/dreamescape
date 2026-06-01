import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createSky() {
  const group = new THREE.Group();

  // --- Gradient sky dome ---
  const topColor = new THREE.Color(CONFIG.skyTop);
  const midColor = new THREE.Color(CONFIG.skyMid);
  const bottomColor = new THREE.Color(CONFIG.skyBottom);

  const domeGeo = new THREE.SphereGeometry(400, 32, 32);
  const colors = new Float32Array(domeGeo.attributes.position.count * 3);
  const pos = domeGeo.attributes.position.array;

  for (let i = 0; i < pos.length; i += 3) {
    const y = pos[i + 1];
    const normalized = (y / 400 + 1) / 2;
    const c = new THREE.Color();
    if (normalized < 0.5) {
      c.lerpColors(bottomColor, midColor, normalized * 2);
    } else {
      c.lerpColors(midColor, topColor, (normalized - 0.5) * 2);
    }
    colors[i] = c.r;
    colors[i + 1] = c.g;
    colors[i + 2] = c.b;
  }

  domeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const domeMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
  });

  const dome = new THREE.Mesh(domeGeo, domeMat);
  group.add(dome);

  // --- Moon ---
  const moonRadius = CONFIG.moonSize;
  const moonGeo = new THREE.SphereGeometry(moonRadius, 24, 24);
  const moonMat = new THREE.MeshPhysicalMaterial({
    color: 0xddddee,
    emissive: 0x8888ff,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.0,
    transparent: true,
    opacity: 0.95,
  });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  const moonAngle = Math.random() * Math.PI * 2;
  const moonDist = 300;
  moon.position.set(
    Math.cos(moonAngle) * moonDist,
    200 + Math.random() * 50,
    Math.sin(moonAngle) * moonDist
  );
  group.add(moon);

  // Moon glow aura
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x8888ff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(moonRadius * 2.5, 16, 16), auraMat);
  aura.position.copy(moon.position);
  group.add(aura);

  // Moon inner glow
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xaaaaff,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const innerGlow = new THREE.Mesh(new THREE.SphereGeometry(moonRadius * 1.5, 16, 16), innerGlowMat);
  innerGlow.position.copy(moon.position);
  group.add(innerGlow);

  // Moon light
  const moonLight = new THREE.PointLight(0x8888ff, 0.5, 500);
  moonLight.position.copy(moon.position);
  group.add(moonLight);

  // --- Horizon clouds (visible rings near ground) ---
  for (let i = 0; i < 12; i++) {
    const cRad = 50 + Math.random() * 130;
    const cY = -8 + Math.random() * 25;
    const cloudMat = new THREE.MeshBasicMaterial({
      color: midColor,
      transparent: true,
      opacity: 0.03 + Math.random() * 0.06,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloud = new THREE.Mesh(new THREE.RingGeometry(cRad * 0.4, cRad, 24), cloudMat);
    cloud.position.set(0, cY, 0);
    cloud.rotation.x = -Math.PI / 2;
    cloud.rotation.z = Math.random() * Math.PI * 2;
    group.add(cloud);
  }

  // Higher mist layer
  for (let i = 0; i < 4; i++) {
    const cRad = 80 + Math.random() * 100;
    const cY = 30 + Math.random() * 30;
    const mistMat = new THREE.MeshBasicMaterial({
      color: topColor,
      transparent: true,
      opacity: 0.015 + Math.random() * 0.025,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mist = new THREE.Mesh(new THREE.RingGeometry(cRad * 0.3, cRad * 0.7, 20), mistMat);
    mist.position.set(0, cY, 0);
    mist.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.2;
    mist.rotation.z = Math.random() * Math.PI * 2;
    group.add(mist);
  }

  let time = 0;

  function update(dt) {
    time += dt * 0.02;

    // Moon slow orbit
    const orbitSpeed = 0.005;
    const a = Math.atan2(moon.position.z, moon.position.x) + orbitSpeed * dt;
    const d = Math.sqrt(moon.position.x * moon.position.x + moon.position.z * moon.position.z);
    moon.position.x = Math.cos(a) * d;
    moon.position.z = Math.sin(a) * d;
    aura.position.copy(moon.position);
    innerGlow.position.copy(moon.position);
    moonLight.position.copy(moon.position);

    // Dome gentle color shift
    const shift = Math.sin(time * 0.1) * 0.05;
    const cTop = new THREE.Color(CONFIG.skyTop);
    const cMid = new THREE.Color(CONFIG.skyMid);
    const cBottom = new THREE.Color(CONFIG.skyBottom);
    cTop.offsetHSL(shift * 0.1, 0, 0);
    cMid.offsetHSL(shift, 0, 0);
    cBottom.offsetHSL(shift * 0.5, 0, 0);

    const colArr = domeGeo.attributes.color.array;
    const posArr = domeGeo.attributes.position.array;
    for (let i = 0; i < posArr.length; i += 3) {
      const y = posArr[i + 1];
      const normalized = (y / 400 + 1) / 2;
      const c = new THREE.Color();
      if (normalized < 0.5) {
        c.lerpColors(cBottom, cMid, normalized * 2);
      } else {
        c.lerpColors(cMid, cTop, (normalized - 0.5) * 2);
      }
      colArr[i] = c.r;
      colArr[i + 1] = c.g;
      colArr[i + 2] = c.b;
    }
    domeGeo.attributes.color.needsUpdate = true;
  }

  function setColors(top, mid, bottom) {
    const colArr = domeGeo.attributes.color.array;
    const posArr = domeGeo.attributes.position.array;
    for (let i = 0; i < posArr.length; i += 3) {
      const y = posArr[i + 1];
      const normalized = (y / 400 + 1) / 2;
      const c = new THREE.Color();
      if (normalized < 0.5) {
        c.lerpColors(bottom, mid, normalized * 2);
      } else {
        c.lerpColors(mid, top, (normalized - 0.5) * 2);
      }
      colArr[i] = c.r;
      colArr[i + 1] = c.g;
      colArr[i + 2] = c.b;
    }
    domeGeo.attributes.color.needsUpdate = true;

    // Update moon color to complement stage
    const moonHue = mid.getHSL({}).h;
    const mCol = new THREE.Color().setHSL((moonHue + 0.5) % 1.0, 0.3, 0.85);
    moonMat.color.copy(mCol);
    moonMat.emissive.copy(mCol);
    const glowCol = new THREE.Color().setHSL((moonHue + 0.5) % 1.0, 0.4, 0.5);
    auraMat.color.copy(glowCol);
    innerGlowMat.color.copy(glowCol);
    moonLight.color.copy(glowCol);
  }

  return { group, update, setColors };
}
