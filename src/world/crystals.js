import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createCrystals(terrainGetHeight) {
  const group = new THREE.Group();
  const crystals = [];

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: CONFIG.crystalColor,
    emissive: CONFIG.crystalColor,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });

  const crystalMat2 = new THREE.MeshPhysicalMaterial({
    color: '#ff88cc',
    emissive: '#ff88cc',
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });

  const mats = [crystalMat, crystalMat2];

  for (let i = 0; i < CONFIG.crystalCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + Math.random() * 50;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const h = terrainGetHeight(x, z);
    const height = 3 + Math.random() * 7;
    const geo = new THREE.OctahedronGeometry(1, 0);

    const mat = mats[i % mats.length];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h + height * 0.4, z);
    mesh.scale.set(0.8 + Math.random() * 1.5, height, 0.8 + Math.random() * 1.5);
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI
    );
    mesh.castShadow = true;
    group.add(mesh);

    // Inner glow core
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), coreMat);
    core.position.copy(mesh.position);
    core.scale.set(0.3, 0.3, 0.3);
    group.add(core);

    crystals.push({
      mesh,
      core,
      rotSpeed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      baseScale: height,
    });
  }

  function update(time) {
    for (const c of crystals) {
      c.mesh.rotation.y += 0.003 * c.rotSpeed;
      c.mesh.rotation.x = Math.sin(time * 0.2 + c.phase) * 0.05;
      const pulse = 1 + Math.sin(time * 0.5 + c.phase) * 0.03;
      c.core.scale.setScalar(pulse * 0.3);
    }
  }

  return { group, update };
}
