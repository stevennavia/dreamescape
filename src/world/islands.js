import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createIslands(terrainGetHeight) {
  const group = new THREE.Group();
  const islands = [];
  const orbData = [];
  let orbCount = 0;
  const ORB_TOTAL = CONFIG.orbsOnIslands;

  const baseColors = [0x6a5a8a, 0x7a6a9a, 0x5a4a7a, 0x8a7aaa];
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: CONFIG.orbColor,
    emissive: CONFIG.orbColor,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });

  for (let i = 0; i < CONFIG.islandCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 60;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const groundH = terrainGetHeight(x, z);
    const floatHeight = groundH + 15 + Math.random() * 25;
    const size = 3 + Math.random() * 5;
    const color = baseColors[Math.floor(Math.random() * baseColors.length)];

    // Top platform
    const topGeo = new THREE.DodecahedronGeometry(size, 0);
    const topMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.2,
      flatShading: true,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(x, floatHeight, z);
    top.scale.y = 0.4;
    top.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.3);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Bottom column
    const botGeo = new THREE.CylinderGeometry(size * 0.3, size * 0.6, size * 2, 6);
    const botMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a5a,
      roughness: 0.8,
      metalness: 0,
      flatShading: true,
      transparent: true,
      opacity: 0.7,
    });
    const bot = new THREE.Mesh(botGeo, botMat);
    bot.position.set(x, floatHeight - size * 0.8, z);
    bot.castShadow = true;
    bot.receiveShadow = true;
    group.add(bot);

    // Small glow under island
    const glowGeo = new THREE.SphereGeometry(size * 0.5, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8866cc,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(x, floatHeight - size * 0.3, z);
    group.add(glow);

    const isl = {
      meshes: [top, bot, glow],
      baseY: floatHeight,
      speed: 0.3 + Math.random() * 0.4,
      amp: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      centerX: x,
      centerZ: z,
      radius: size,
    };
    islands.push(isl);

    // --- Orb on this island (first ORB_TOTAL islands get an orb) ---
    if (i < ORB_TOTAL) {
      const orbY = floatHeight + size * 0.4 + 2.0 + Math.random() * 0.5;
      const oSize = 0.6 + Math.random() * 0.2;
      const oGeo = new THREE.SphereGeometry(oSize, 12, 12);
      const oMat = orbMat.clone();
      const orb = new THREE.Mesh(oGeo, oMat);
      orb.position.set(x, orbY, z);
      group.add(orb);

      // Big glow
      const oGlowMat = new THREE.MeshBasicMaterial({
        color: CONFIG.orbColor,
        transparent: true,
        opacity: 0.2,
      });
      const oGlow = new THREE.Mesh(new THREE.SphereGeometry(oSize * 4, 8, 8), oGlowMat);
      oGlow.position.copy(orb.position);
      group.add(oGlow);

      // Light pillar shaft below orb
      const shaftMat = new THREE.MeshBasicMaterial({
        color: CONFIG.orbColor,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, oSize * 2, 4, 6, 1, true), shaftMat);
      shaft.position.set(x, orbY - 2, z);
      group.add(shaft);

      // Strong light
      const oLight = new THREE.PointLight(CONFIG.orbColor, 1.5, 15);
      oLight.position.copy(orb.position);
      group.add(oLight);

      orbData.push({
        mesh: orb, glow: oGlow, light: oLight, shaft,
        baseY: orbY, islIdx: i,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        collected: false,
      });
    }
  }

  function update(time, playerPos) {
    // Update island positions + bob
    for (const isl of islands) {
      const bob = Math.sin(time * isl.speed + isl.phase) * isl.amp;
      for (const mesh of isl.meshes) {
        mesh.position.y = isl.baseY + bob;
      }
    }

    // Update orbs (follow island bob + pulse)
    for (const orb of orbData) {
      if (orb.collected) continue;
      const isl = islands[orb.islIdx];
      const bob = Math.sin(time * isl.speed + isl.phase) * isl.amp;
      const orbBob = Math.sin(time * orb.speed + orb.phase) * 0.3;
      const y = orb.baseY + bob + orbBob;
      orb.mesh.position.y = y;
      orb.glow.position.y = y;
      orb.light.position.y = y;
      if (orb.shaft) {
        orb.shaft.position.y = y - 2;
        orb.shaft.material.opacity = 0.04 + Math.sin(time * 0.8 + orb.phase) * 0.02;
      }
      orb.mesh.rotation.y += 0.02;
      const pulse = 0.6 + Math.sin(time * 2 + orb.phase) * 0.4;
      orb.mesh.material.emissiveIntensity = pulse;
      orb.glow.material.opacity = 0.12 + Math.sin(time * 1.5 + orb.phase) * 0.08;
      orb.light.intensity = 1.0 + Math.sin(time * 1.5 + orb.phase) * 0.5;

      // Collection
      if (playerPos && !orb.collected) {
        const dx = playerPos.x - orb.mesh.position.x;
        const dy = playerPos.y - y;
        const dz = playerPos.z - orb.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.5) {
          orb.collected = true;
          orb.mesh.visible = false;
          orb.glow.visible = false;
          orb.light.visible = false;
          if (orb.shaft) orb.shaft.visible = false;
          orbCount++;
        }
      }
    }
  }

  function getCollision(x, z, y) {
    for (const isl of islands) {
      const dx = x - isl.centerX;
      const dz = z - isl.centerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < isl.radius * 1.3) {
        const topSurf = isl.baseY + isl.radius * 0.4;
        const botSurf = isl.baseY - isl.radius * 1.8;
        if (y >= botSurf && y <= topSurf + 1.5) {
          return topSurf;
        }
      }
    }
    return null;
  }

  // Horizontal push: prevents walking through island sides
  function getPush(x, z, y, playerRadius) {
    for (const isl of islands) {
      const dx = x - isl.centerX;
      const dz = z - isl.centerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const colRadius = isl.radius * 1.3;
      if (dist >= colRadius + playerRadius || dist < 0.01) continue;
      const topSurf = isl.baseY + isl.radius * 0.4;
      const botSurf = isl.baseY - isl.radius * 1.8;
      // Only push when at the side, not standing on top
      if (y < botSurf - 0.5 || y > topSurf - 0.3) continue;
      const nx = dx / dist, nz = dz / dist;
      return { x: isl.centerX + nx * (colRadius + playerRadius), z: isl.centerZ + nz * (colRadius + playerRadius), nx, nz };
    }
    return null;
  }

  return {
    group, update, getCollision, getPush,
    getOrbCount: () => orbCount,
    getOrbTotal: () => ORB_TOTAL,
  };
}
