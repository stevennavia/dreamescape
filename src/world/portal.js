import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createPortal(terrainGetHeight) {
  const group = new THREE.Group();
  const dist = CONFIG.portalDistance;
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  const h = terrainGetHeight(x, z);
  const portalY = h + 4;

  // Main ring
  const ringGeo = new THREE.TorusGeometry(3, 0.4, 24, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: CONFIG.portalColor,
    emissive: CONFIG.portalGlow,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(x, portalY, z);
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  // Inner glow disc
  const discGeo = new THREE.RingGeometry(0.5, 2.8, 32);
  const discMat = new THREE.MeshBasicMaterial({
    color: CONFIG.portalGlow,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.copy(ring.position);
  disc.rotation.copy(ring.rotation);
  group.add(disc);

  // Second ring (outer, thinner)
  const ring2Geo = new THREE.TorusGeometry(3.8, 0.15, 16, 48);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: CONFIG.portalGlow,
    transparent: true,
    opacity: 0.4,
  });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.position.copy(ring.position);
  ring2.rotation.x = Math.PI / 3;
  group.add(ring2);

  // Point light
  const light = new THREE.PointLight(CONFIG.portalColor, 2, 30);
  light.position.copy(ring.position);
  group.add(light);

  function update(time) {
    ring.rotation.z = time * 0.15;
    ring2.rotation.z = time * 0.15;
    disc.rotation.z = time * 0.15;
    const pulse = 1 + Math.sin(time * 0.8) * 0.1;
    ringMat.emissiveIntensity = pulse * 1.5;
    discMat.opacity = 0.1 + Math.sin(time * 0.5) * 0.05;
    light.intensity = 1.5 + Math.sin(time * 0.7) * 0.5;
  }

  function getPosition() {
    return new THREE.Vector3(x, portalY, z);
  }

  return { group, update, getPosition };
}
