import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createTower(terrainGetHeight) {
  const group = new THREE.Group();
  const TOWER_DIST = CONFIG.tower.distance;

  const towerAngle = Math.random() * Math.PI * 2;
  const worldX = Math.cos(towerAngle) * TOWER_DIST;
  const worldZ = Math.sin(towerAngle) * TOWER_DIST;
  const groundY = terrainGetHeight(worldX, worldZ);
  group.position.set(worldX, 0, worldZ);

  const SPIRE_RADIUS = 5.0;
  const RAMP_WIDTH = 3.5;
  const TOTAL_HEIGHT = 55;
  const SPIRAL_TURNS = 6;
  const SEGMENTS = 200;

  // --- Spire ---
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a2a6a,
    emissive: 0x2a1a4a,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.4,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(SPIRE_RADIUS, SPIRE_RADIUS * 1.2, TOTAL_HEIGHT, 24, 1), bodyMat);
  body.position.y = groundY + TOTAL_HEIGHT / 2;
  group.add(body);

  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x6644aa,
    transparent: true,
    opacity: 0.06,
  });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(SPIRE_RADIUS * 0.6, SPIRE_RADIUS * 0.8, TOTAL_HEIGHT * 0.9, 12), coreMat);
  core.position.y = groundY + TOTAL_HEIGHT / 2;
  group.add(core);

  // --- Spiral ramp ---
  const rampMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a5a9a,
    emissive: 0x5a3a7a,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.65,
    roughness: 0.4,
    metalness: 0.1,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  const rampPositions = [];
  const rampUVs = [];
  const rampIndices = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const angle = t * SPIRAL_TURNS * Math.PI * 2;
    const y = groundY + t * TOTAL_HEIGHT;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    rampPositions.push(SPIRE_RADIUS * cosA, y, SPIRE_RADIUS * sinA);
    rampPositions.push((SPIRE_RADIUS + RAMP_WIDTH) * cosA, y, (SPIRE_RADIUS + RAMP_WIDTH) * sinA);
    rampUVs.push(0, t);
    rampUVs.push(1, t);

    if (i > 0) {
      const a = (i - 1) * 2;
      const b = (i - 1) * 2 + 1;
      const c = i * 2;
      const d = i * 2 + 1;
      rampIndices.push(a, c, b);
      rampIndices.push(b, c, d);
    }
  }

  const rampGeo = new THREE.BufferGeometry();
  rampGeo.setAttribute('position', new THREE.Float32BufferAttribute(rampPositions, 3));
  rampGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rampUVs, 2));
  rampGeo.setIndex(rampIndices);
  rampGeo.computeVertexNormals();

  const ramp = new THREE.Mesh(rampGeo, rampMat);
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  group.add(ramp);

  // --- Ramp railing ---
  const railMat = new THREE.MeshBasicMaterial({
    color: 0x8866cc,
    transparent: true,
    opacity: 0.15,
  });
  for (let side = -1; side <= 1; side += 2) {
    const railPts = [];
    for (let i = 0; i <= SEGMENTS; i += 4) {
      const t = i / SEGMENTS;
      const angle = t * SPIRAL_TURNS * Math.PI * 2;
      const y = groundY + t * TOTAL_HEIGHT;
      const r = side < 0 ? SPIRE_RADIUS : SPIRE_RADIUS + RAMP_WIDTH;
      railPts.push(new THREE.Vector3(r * Math.cos(angle), y + 0.3, r * Math.sin(angle)));
    }
    const curve = new THREE.CatmullRomCurve3(railPts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, railPts.length * 2, 0.05, 4, false), railMat);
    group.add(tube);
  }

  // --- Light rings ---
  for (let i = 0; i < 5; i++) {
    const y = groundY + 8 + i * 11;
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8866cc,
      transparent: true,
      opacity: 0.15 + Math.sin(i) * 0.05,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(SPIRE_RADIUS + 0.1, SPIRE_RADIUS + 0.3, 32), ringMat);
    ring.position.set(0, y, 0);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
  }

  // --- Summit platform ---
  const summitY = groundY + TOTAL_HEIGHT;
  const summitMat = new THREE.MeshPhysicalMaterial({
    color: 0x9a7aba,
    emissive: 0x7a5a9a,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 1.0,
    roughness: 0.3,
    metalness: 0.1,
    flatShading: true,
  });
  const summitPlat = new THREE.Mesh(new THREE.CircleGeometry(SPIRE_RADIUS, 32), summitMat);
  summitPlat.position.set(0, summitY + 0.05, 0);
  summitPlat.rotation.x = -Math.PI / 2;
  group.add(summitPlat);

  // --- Orb at summit ---
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: CONFIG.orbColor,
    emissive: CONFIG.orbColor,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });
  const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), orbMat);
  const orbY = summitY + 1.5;
  orbMesh.position.set(0, orbY, 0);
  group.add(orbMesh);

  const orbGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 8, 8),
    new THREE.MeshBasicMaterial({ color: CONFIG.orbColor, transparent: true, opacity: 0.15 })
  );
  orbGlow.position.copy(orbMesh.position);
  group.add(orbGlow);

  const orbLight = new THREE.PointLight(CONFIG.orbColor, 1.5, 15);
  orbLight.position.copy(orbMesh.position);
  group.add(orbLight);

  const shaftMat = new THREE.MeshBasicMaterial({
    color: CONFIG.orbColor,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.0, 3.5, 6, 1, true), shaftMat);
  shaft.position.set(0, orbY - 1.75, 0);
  group.add(shaft);

  let orbCollected = false;

  // --- Collision detection ---
  function getCollision(x, z, y) {
    const lx = x - worldX;
    const lz = z - worldZ;
    const distSq = lx * lx + lz * lz;

    // Summit platform (takes priority)
    if (y >= summitY - 0.3 && y <= summitY + 2 && distSq < SPIRE_RADIUS * SPIRE_RADIUS) {
      return summitY;
    }

    // Ramp collision (below summit)
    if (y < summitY) {
      const dist = Math.sqrt(distSq);
      const innerR = SPIRE_RADIUS - 0.3;
      const outerR = SPIRE_RADIUS + RAMP_WIDTH + 0.3;

      if (dist >= innerR && dist <= outerR) {
        let angle = Math.atan2(lz, lx);
        if (angle < 0) angle += Math.PI * 2;

        let bestY = null;
        let bestDist = 10;
        for (let k = 0; k < SPIRAL_TURNS; k++) {
          const rampY = (angle / (Math.PI * 2) + k) / SPIRAL_TURNS * TOTAL_HEIGHT + groundY;
          if (rampY >= summitY) continue;
          const dy = Math.abs(rampY - y);
          if (dy < bestDist) {
            bestDist = dy;
            bestY = rampY;
          }
        }

        if (bestY !== null && y >= bestY - 0.5 && y <= bestY + 2.5) {
          return bestY;
        }
      }
    }

    return null;
  }

  // --- Update ---
  function update(time, playerPos) {
    body.rotation.y += 0.001;
    core.rotation.y += 0.0005;

    // Orb animation
    if (!orbCollected) {
      const bob = Math.sin(time * 0.5) * 0.3;
      orbMesh.position.y = orbY + bob;
      orbGlow.position.y = orbY + bob;
      orbLight.position.y = orbY + bob;
      shaft.position.y = orbY - 1.75 + bob;
      orbMesh.rotation.y += 0.02;
      const pulse = 0.6 + Math.sin(time * 2) * 0.4;
      orbMat.emissiveIntensity = pulse;
      orbGlow.material.opacity = 0.12 + Math.sin(time * 1.5) * 0.08;
      orbLight.intensity = 1.0 + Math.sin(time * 1.5) * 0.5;
      shaft.material.opacity = 0.04 + Math.sin(time * 0.8) * 0.02;

      // Collection check
      if (playerPos) {
        const dx = playerPos.x - (worldX + orbMesh.position.x);
        const dy = playerPos.y - orbMesh.position.y;
        const dz = playerPos.z - (worldZ + orbMesh.position.z);
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 2.5) {
          orbCollected = true;
          orbMesh.visible = false;
          orbGlow.visible = false;
          orbLight.visible = false;
          shaft.visible = false;
        }
      }
    }

    // Rail glow pulse
    for (const child of group.children) {
      if (child.isMesh && child.material === railMat) {
        child.material.opacity = 0.1 + Math.sin(time * 0.3) * 0.05;
      }
    }
  }

  function getWallPush(x, z, y, playerRadius) {
    const lx = x - worldX;
    const lz = z - worldZ;
    const dist = Math.sqrt(lx * lx + lz * lz);
    const minDist = SPIRE_RADIUS + 0.3;
    if (dist >= minDist + playerRadius || dist < 0.01) return null;
    if (y > summitY - 0.5) return null;
    const nx = lx / dist, nz = lz / dist;
    return { x: worldX + nx * (minDist + playerRadius), z: worldZ + nz * (minDist + playerRadius), nx, nz, isSpire: true };
  }

  return {
    group,
    update,
    getCollision,
    getWallPush,
    getWorldPosition: () => new THREE.Vector3(worldX, groundY, worldZ),
    getOrbCollected: () => orbCollected,
    getOrbPosition: () => new THREE.Vector3(worldX, orbY, worldZ),
  };
}
