import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createNebula() {
  const group = new THREE.Group();
  const count = CONFIG.nebulaCount;
  const hues = [0.75, 0.05, 0.55, 0.1, 0.65, 0.0];
  const saltSat = [0.3, 0.5, 0.2, 0.4, 0.35, 0.45];
  const saltLight = [0.4, 0.35, 0.45, 0.5, 0.3, 0.4];

  const nebulaData = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dist = 150 + Math.random() * 180;
    const size = 40 + Math.random() * 80;

    const radSegments = 16;
    const ringGeo = new THREE.RingGeometry(0.5, size, radSegments);
    const hue = hues[i % hues.length];
    const sat = saltSat[i % saltSat.length];
    const light = saltLight[i % saltLight.length];
    const color = new THREE.Color().setHSL(hue, sat, light);

    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.04 + Math.random() * 0.04,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    const px = dist * Math.sin(phi) * Math.cos(theta);
    const py = Math.abs(dist * Math.cos(phi)) * 0.6 + 30;
    const pz = dist * Math.sin(phi) * Math.sin(theta);
    ring.position.set(px, py, pz);
    ring.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    ring.scale.set(1, 0.3 + Math.random() * 0.5, 1);
    group.add(ring);

    // Inner brighter core
    const coreMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.02 + Math.random() * 0.03,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(new THREE.RingGeometry(0.3, size * 0.3, radSegments), coreMat);
    core.position.copy(ring.position);
    core.rotation.copy(ring.rotation);
    group.add(core);

    // Galaxy disc (spiral-like)
    const galHue = (hue + 0.1) % 1.0;
    const galCol = new THREE.Color().setHSL(galHue, sat * 0.8, light * 1.1);
    const galMat = new THREE.MeshBasicMaterial({
      color: galCol,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const gal = new THREE.Mesh(new THREE.RingGeometry(size * 0.1, size * 0.5, 24), galMat);
    gal.position.set(
      px + (Math.random() - 0.5) * 60,
      py + (Math.random() - 0.5) * 20,
      pz + (Math.random() - 0.5) * 60
    );
    gal.rotation.set(
      Math.PI / 2 + (Math.random() - 0.5) * 0.3,
      Math.random() * Math.PI * 2,
      0
    );
    group.add(gal);

    nebulaData.push({
      ring, core, gal,
      rotSpeed: { x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.003, z: (Math.random() - 0.5) * 0.003 },
      pulseSpeed: 0.1 + Math.random() * 0.2,
      pulsePhase: Math.random() * Math.PI * 2,
      baseOpacity: ringMat.opacity,
      color,
    });
  }

  function setColors(top, mid, bottom) {
    const skyHue = mid.getHSL({}).h;
    for (const nd of nebulaData) {
      const h = skyHue + (Math.random() - 0.5) * 0.15;
      const c = new THREE.Color().setHSL(h < 0 ? h + 1 : h > 1 ? h - 1 : h, 0.4, 0.4);
      nd.ring.material.color.copy(c);
      nd.core.material.color.copy(c);
      nd.gal.material.color.copy(c);
    }
  }

  function update(time) {
    for (const nd of nebulaData) {
      nd.ring.rotation.x += nd.rotSpeed.x;
      nd.ring.rotation.y += nd.rotSpeed.y;
      nd.ring.rotation.z += nd.rotSpeed.z;
      nd.core.rotation.copy(nd.ring.rotation);
      nd.gal.rotation.y += nd.rotSpeed.y * 0.5;

      const pulse = 0.6 + 0.4 * Math.sin(time * nd.pulseSpeed + nd.pulsePhase);
      nd.ring.material.opacity = nd.baseOpacity * pulse;
      nd.core.material.opacity = nd.baseOpacity * 0.5 * pulse;
      nd.gal.material.opacity = 0.02 * pulse;
    }
  }

  return { group, update, setColors };
}
