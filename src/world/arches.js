import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createArches(terrainGetHeight) {
  const group = new THREE.Group();
  const arches = [];

  const mat = new THREE.MeshStandardMaterial({
    color: 0x8877aa,
    emissive: 0x443366,
    emissiveIntensity: 0.2,
    roughness: 0.4,
    metalness: 0.3,
    flatShading: true,
    transparent: true,
    opacity: 0.7,
  });

  for (let i = 0; i < CONFIG.archCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 50;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const h = terrainGetHeight(x, z);
    const archHeight = 5 + Math.random() * 6;
    const archWidth = 3 + Math.random() * 4;

    // Create arch with CatmullRomCurve3
    const pts = [];
    const segments = 12;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const theta = t * Math.PI;
      const px = Math.cos(theta - Math.PI / 2) * archWidth / 2;
      const py = Math.sin(theta - Math.PI / 2) * archHeight + archHeight;
      pts.push(new THREE.Vector3(px, py, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.3 + Math.random() * 0.3, 6, false);
    const mesh = new THREE.Mesh(tubeGeo, mat);
    mesh.position.set(x, h, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.x = (Math.random() - 0.5) * 0.3;
    mesh.castShadow = true;
    group.add(mesh);
    arches.push({ mesh, phase: Math.random() * Math.PI * 2 });
  }

  function update(time) {
    for (const a of arches) {
      a.mesh.rotation.z = Math.sin(time * 0.1 + a.phase) * 0.02;
    }
  }

  return { group, update };
}
