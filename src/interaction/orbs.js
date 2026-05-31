import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createOrbs(terrainGetHeight) {
  const group = new THREE.Group();
  const orbs = [];
  const collected = new Set();
  let collectCount = 0;

  const orbMat = new THREE.MeshPhysicalMaterial({
    color: CONFIG.orbColor,
    emissive: CONFIG.orbColor,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });

  for (let i = 0; i < CONFIG.orbCount; i++) {
    let x, z, h;
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 50) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 60;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      h = terrainGetHeight(x, z);
      if (h > 1) valid = true;
      attempts++;
    }

    const floatH = h + 2 + Math.random() * 3;
    const size = 0.3 + Math.random() * 0.2;

    const geo = new THREE.SphereGeometry(size, 12, 12);
    const mesh = new THREE.Mesh(geo, orbMat.clone());
    mesh.position.set(x, floatH, z);
    mesh.castShadow = false;
    group.add(mesh);

    // Glow
    const glowMat = new THREE.MeshBasicMaterial({
      color: CONFIG.orbColor,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(size * 2.5, 8, 8), glowMat);
    glow.position.copy(mesh.position);
    group.add(glow);

    // Point light
    const light = new THREE.PointLight(CONFIG.orbColor, 0.5, 8);
    light.position.copy(mesh.position);
    group.add(light);

    orbs.push({
      mesh,
      glow,
      light,
      baseY: floatH,
      index: i,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  function update(time, playerPos) {
    for (const orb of orbs) {
      if (orb.collected) continue;

      // Bobbing
      const bob = Math.sin(time * orb.speed + orb.phase) * 0.3;
      orb.mesh.position.y = orb.baseY + bob;
      orb.glow.position.y = orb.baseY + bob;
      orb.light.position.y = orb.baseY + bob;

      // Rotation
      orb.mesh.rotation.y += 0.02;

      // Pulse glow
      const pulse = 0.8 + Math.sin(time * 2 + orb.phase) * 0.2;
      orb.mesh.material.emissiveIntensity = pulse;
      orb.glow.material.opacity = 0.1 + Math.sin(time * 1.5 + orb.phase) * 0.05;
      orb.light.intensity = 0.3 + Math.sin(time * 1.5 + orb.phase) * 0.2;

      // Collection check
      if (playerPos) {
        const dx = playerPos.x - orb.mesh.position.x;
        const dy = playerPos.y - orb.mesh.position.y;
        const dz = playerPos.z - orb.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.0) {
          orb.collected = true;
          orb.mesh.visible = false;
          orb.glow.visible = false;
          orb.light.visible = false;
          collected.add(orb.index);
          collectCount++;
        }
      }
    }
  }

  function getCount() {
    return collectCount;
  }

  function getTotal() {
    return CONFIG.orbCount;
  }

  return { group, update, getCount, getTotal };
}
