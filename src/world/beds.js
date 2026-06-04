import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createBeds() {
  const group = new THREE.Group();
  const platforms = [];
  const bedCount = 8;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6a5a4a,
    roughness: 0.55,
    metalness: 0.12,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0x9999cc,
    roughness: 0.7,
    metalness: 0,
    emissive: 0x15152a,
    emissiveIntensity: 0.06,
  });
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x4a3a2a,
    roughness: 0.45,
    metalness: 0.2,
  });

  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0xffcc33,
    emissive: 0xffcc33,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });

  const layout = [
    { x: 0, z: 0, y: 8, rot: 0 },
    { x: 12, z: 4, y: 14, rot: 0.5 },
    { x: 4, z: -14, y: 22, rot: -0.3, orb: true },
    { x: -10, z: 8, y: 30, rot: 0.7 },
    { x: 0, z: -18, y: 38, rot: -0.5, orb: true },
    { x: 14, z: -2, y: 46, rot: 0.2, orb: true },
    { x: 30, z: 1, y: 52, rot: 0.1 },
    { x: 45, z: 3, y: 56, rot: -0.15 },
  ];

  const orbData = [];

  for (let i = 0; i < bedCount; i++) {
    const bedGroup = new THREE.Group();
    const cfg = layout[i];

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.35, 3),
      woodMat
    );
    base.position.y = 0.22;
    base.castShadow = true;
    bedGroup.add(base);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.5, 2.5, 4, 2, 4),
      clothMat
    );
    mattress.position.y = 0.65;
    mattress.castShadow = true;
    bedGroup.add(mattress);

    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8);
    const postOffsets = [
      [2.3, 0.62, 1.3],
      [-2.3, 0.62, 1.3],
      [2.3, 0.62, -1.3],
      [-2.3, 0.62, -1.3],
    ];
    for (const [px, py, pz] of postOffsets) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, py, pz);
      post.castShadow = true;
      bedGroup.add(post);
    }

    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1.1, 3.1),
      woodMat
    );
    headboard.position.set(0, 0.6, 1.45);
    headboard.castShadow = true;
    bedGroup.add(headboard);

    bedGroup.position.set(cfg.x, cfg.y, cfg.z);
    bedGroup.rotation.y = cfg.rot;
    group.add(bedGroup);

    const platformData = {
      group: bedGroup,
      cx: cfg.x,
      cz: cfg.z,
      baseY: cfg.y,
      radius: 3.2,
      phase: Math.random() * Math.PI * 2,
      top: cfg.y + 0.9,
      hasOrb: cfg.orb || false,
      orbIdx: -1,
    };

    if (cfg.orb) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), orbMat.clone());
      orb.position.set(0, 1.6, 0);
      bedGroup.add(orb);

      const orbGlow = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.15 })
      );
      orbGlow.position.set(0, 1.6, 0);
      bedGroup.add(orbGlow);

      const orbLight = new THREE.PointLight(0xffcc33, 1.5, 12);
      orbLight.position.set(0, 1.6, 0);
      bedGroup.add(orbLight);

      platformData.orbIdx = orbData.length;
      orbData.push({
        mesh: orb, glow: orbGlow, light: orbLight,
        bedIdx: i,
        collected: false,
        phase: Math.random() * Math.PI * 2,
        localY: 1.6,
      });
    }

    platforms.push(platformData);
  }

  let orbCount = 0;

  function update(time, playerPos) {
    for (const p of platforms) {
      const bob = Math.sin(time * 0.6 + p.phase) * 0.35;
      p.group.position.y = p.baseY + bob;
      p.top = p.baseY + 0.9 + bob;
    }

    for (const o of orbData) {
      if (o.collected) continue;
      const bed = platforms[o.bedIdx];
      const bedBob = bed.group.position.y - bed.baseY;
      const placeBob = Math.sin(time * 0.7 + o.phase) * 0.3;
      const orbLocalY = o.localY + placeBob;

      o.mesh.position.y = orbLocalY;
      o.glow.position.y = orbLocalY;
      o.light.position.y = orbLocalY;
      o.mesh.rotation.y += 0.02;
      o.mesh.material.emissiveIntensity = 0.6 + Math.sin(time * 2) * 0.4;
      o.glow.material.opacity = 0.12 + Math.sin(time * 1.5) * 0.05;
      o.light.intensity = 1 + Math.sin(time * 1.5) * 0.5;

      if (playerPos) {
        const orbWorldY = bed.baseY + bedBob + orbLocalY;
        const dx = playerPos.x - bed.cx;
        const dy = playerPos.y - orbWorldY;
        const dz = playerPos.z - bed.cz;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 3.5) {
          o.collected = true;
          o.mesh.visible = false;
          o.glow.visible = false;
          o.light.visible = false;
          orbCount++;
        }
      }
    }
  }

  function getPlatformTop(x, z, playerY) {
    for (const p of platforms) {
      const dist = Math.sqrt((x - p.cx) ** 2 + (z - p.cz) ** 2);
      if (dist < p.radius && playerY > p.top - 4 && playerY < p.top + 3) return p.top;
    }
    return null;
  }

  function getPlatformPush(x, z, y, r) {
    for (const p of platforms) {
      if (y >= p.top) continue;
      const dx = x - p.cx, dz = z - p.cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const cr = p.radius + r;
      if (dist < cr && dist > 0.01) {
        const nx = dx / dist, nz = dz / dist;
        return { x: p.cx + nx * cr, z: p.cz + nz * cr, nx, nz };
      }
    }
    return null;
  }

  function getSpawn() {
    if (platforms.length > 0) {
      return { x: platforms[0].cx, y: platforms[0].top + 1.5, z: platforms[0].cz };
    }
    return { x: 0, y: 15, z: 0 };
  }

  return { group, platforms, orbData, update, getPlatformTop, getPlatformPush, getSpawn, getOrbCount: () => orbCount };
}
