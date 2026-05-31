import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createTower(terrainGetHeight) {
  const group = new THREE.Group();
  const TOWER_DIST = CONFIG.tower.distance;

  // Tower world position
  const towerAngle = Math.random() * Math.PI * 2;
  const worldX = Math.cos(towerAngle) * TOWER_DIST;
  const worldZ = Math.sin(towerAngle) * TOWER_DIST;
  const groundY = terrainGetHeight(worldX, worldZ);
  group.position.set(worldX, 0, worldZ);

  // Parameters
  const SPIRE_RADIUS = 3.0;
  const RAMP_WIDTH = 3.0;
  const TOTAL_HEIGHT = 80;
  const SPIRAL_TURNS = 7;
  const SEGMENTS = 250;

  // --- Spire (narrow central tower) ---
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

  // Inner glow core
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x6644aa,
    transparent: true,
    opacity: 0.06,
  });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(SPIRE_RADIUS * 0.6, SPIRE_RADIUS * 0.8, TOTAL_HEIGHT * 0.9, 12), coreMat);
  core.position.y = groundY + TOTAL_HEIGHT / 2;
  group.add(core);

  // --- Spiral ramp (wraps outside the spire) ---
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

    // Inner edge (at spire surface)
    rampPositions.push(
      SPIRE_RADIUS * cosA,
      y,
      SPIRE_RADIUS * sinA
    );
    // Outer edge (extends outward)
    rampPositions.push(
      (SPIRE_RADIUS + RAMP_WIDTH) * cosA,
      y,
      (SPIRE_RADIUS + RAMP_WIDTH) * sinA
    );

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

  // Ramp railing (inner and outer edge wires)
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

  // --- Horizontal light rings on tower ---
  for (let i = 0; i < 10; i++) {
    const y = groundY + 8 + i * 11;
    const ringGeo = new THREE.TorusGeometry(SPIRE_RADIUS + 0.2, 0.08, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8866cc,
      transparent: true,
      opacity: 0.15 + Math.sin(i) * 0.05,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, y, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  // --- Crown ring at top ---
  const crownMat = new THREE.MeshPhysicalMaterial({
    color: 0xaa88ee,
    emissive: 0x8866cc,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.5,
    roughness: 0.3,
    metalness: 0.2,
  });
  const crown = new THREE.Mesh(new THREE.TorusGeometry(SPIRE_RADIUS * 0.7, 0.15, 12, 32), crownMat);
  crown.position.y = groundY + TOTAL_HEIGHT + 1;
  crown.rotation.x = Math.PI / 2;
  group.add(crown);

  // --- Summit platform ---
  const summitY = groundY + TOTAL_HEIGHT;
  const summitMat = new THREE.MeshPhysicalMaterial({
    color: 0x9a7aba,
    emissive: 0x7a5a9a,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
    roughness: 0.3,
    metalness: 0.1,
    flatShading: true,
  });
  const summitPlat = new THREE.Mesh(new THREE.CircleGeometry(SPIRE_RADIUS * 0.8, 20), summitMat);
  summitPlat.position.set(0, summitY, 0);
  summitPlat.rotation.x = -Math.PI / 2;
  group.add(summitPlat);

  // Glow ring under summit
  const summitGlow = new THREE.Mesh(
    new THREE.TorusGeometry(SPIRE_RADIUS * 0.8, 0.1, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x8866cc, transparent: true, opacity: 0.2 })
  );
  summitGlow.position.set(0, summitY - 0.1, 0);
  summitGlow.rotation.x = Math.PI / 2;
  group.add(summitGlow);

  // --- Summit portal ---
  const portalRingMat = new THREE.MeshStandardMaterial({
    color: CONFIG.portalColor,
    emissive: CONFIG.portalGlow,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const portalRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.25, 16, 32), portalRingMat);
  portalRing.position.set(0, summitY + 3.5, 0);
  portalRing.rotation.x = Math.PI / 3;
  group.add(portalRing);

  const portalDiscMat = new THREE.MeshBasicMaterial({
    color: CONFIG.portalGlow,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const portalDisc = new THREE.Mesh(new THREE.RingGeometry(0.3, 2.7, 24), portalDiscMat);
  portalDisc.position.copy(portalRing.position);
  portalDisc.rotation.copy(portalRing.rotation);
  group.add(portalDisc);

  const portalRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.6, 0.1, 8, 32),
    new THREE.MeshBasicMaterial({ color: CONFIG.portalGlow, transparent: true, opacity: 0.35 })
  );
  portalRing2.position.copy(portalRing.position);
  portalRing2.rotation.x = Math.PI / 3;
  group.add(portalRing2);

  const portalLight = new THREE.PointLight(CONFIG.portalColor, 3, 25);
  portalLight.position.copy(portalRing.position);
  group.add(portalLight);

  // --- Floating crystals around tower ---
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = SPIRE_RADIUS + 2 + Math.random() * 5;
    const y = groundY + 5 + Math.random() * TOTAL_HEIGHT;
    const size = 0.4 + Math.random() * 0.6;
    const cryMat = new THREE.MeshPhysicalMaterial({
      color: 0x8866cc,
      emissive: 0x6644aa,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.3,
    });
    const cry = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), cryMat);
    cry.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    cry.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(cry);
  }

  // --- Collision detection ---
  function getCollision(x, z, y) {
    const lx = x - worldX;
    const lz = z - worldZ;
    const dist = Math.sqrt(lx * lx + lz * lz);
    const innerR = SPIRE_RADIUS - 0.3;
    const outerR = SPIRE_RADIUS + RAMP_WIDTH + 0.3;

    if (dist < innerR || dist > outerR) {
      // Check summit platform
      const sx = lx, sz = lz;
      if (sx * sx + sz * sz < SPIRE_RADIUS * 0.8 * SPIRE_RADIUS * 0.8) {
        if (y >= summitY - 0.3 && y <= summitY + 2) {
          return summitY;
        }
      }
      return null;
    }

    let angle = Math.atan2(lz, lx);
    if (angle < 0) angle += Math.PI * 2;

    let bestY = null;
    let bestDist = 10;
    for (let k = 0; k < SPIRAL_TURNS; k++) {
      const rampY = (angle / (Math.PI * 2) + k) / SPIRAL_TURNS * TOTAL_HEIGHT + groundY;
      if (rampY > summitY - 1) continue;
      const dy = Math.abs(rampY - y);
      if (dy < bestDist) {
        bestDist = dy;
        bestY = rampY;
      }
    }

    if (bestY !== null && y >= bestY - 0.5 && y <= bestY + 2.5) {
      return bestY;
    }
    return null;
  }

  // --- Update ---
  function update(time, playerPos) {
    const t = time;

    // Rotate tower body slowly
    body.rotation.y += 0.001;
    core.rotation.y += 0.0005;

    // Crown rotation
    crown.rotation.z = t * 0.05;

    // Animate summit portal
    const pRot = time * 0.12;
    portalRing.rotation.z = pRot;
    portalRing2.rotation.z = pRot;
    portalDisc.rotation.z = pRot;
    const pulse = 1 + Math.sin(time * 0.8) * 0.15;
    portalRingMat.emissiveIntensity = pulse * 2;
    portalDiscMat.opacity = 0.08 + Math.sin(time * 0.5) * 0.04;
    portalLight.intensity = 2 + Math.sin(time * 0.7) * 0.8;

    // Rail glow pulse
    for (const child of group.children) {
      if (child.isMesh && child.material === railMat) {
        child.material.opacity = 0.1 + Math.sin(t * 0.3) * 0.05;
      }
    }
  }

  // --- Wall collision (prevents walking through the spire) ---
  function getWallPush(x, z, y, playerRadius) {
    const lx = x - worldX;
    const lz = z - worldZ;
    const dist = Math.sqrt(lx * lx + lz * lz);
    const minDist = SPIRE_RADIUS + 0.3;
    if (dist >= minDist + playerRadius || dist < 0.01) return null;
    if (y > summitY + 1) return null; // above summit, no wall
    const nx = lx / dist, nz = lz / dist;
    return { x: worldX + nx * (minDist + playerRadius), z: worldZ + nz * (minDist + playerRadius), nx, nz, isSpire: true };
  }

  return {
    group,
    update,
    getCollision,
    getWallPush,
    getWorldPosition: () => new THREE.Vector3(worldX, groundY, worldZ),
  };
}
