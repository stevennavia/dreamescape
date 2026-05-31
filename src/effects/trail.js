import * as THREE from 'three';

export function createTrail() {
  const maxPoints = 40;
  const positions = new Float32Array(maxPoints * 3);
  const colors = new Float32Array(maxPoints * 3);
  const opacities = new Float32Array(maxPoints);
  let head = 0;
  let count = 0;

  for (let i = 0; i < maxPoints; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -1000;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = 0.5;
    colors[i * 3 + 1] = 0.8;
    colors[i * 3 + 2] = 1;
    opacities[i] = 0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);

  function addPoint(pos, color) {
    const i = head * 3;
    positions[i] = pos.x;
    positions[i + 1] = pos.y;
    positions[i + 2] = pos.z;
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
    opacities[head] = 1;
    head = (head + 1) % maxPoints;
    if (count < maxPoints) count++;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  function update(dt, active) {
    if (active) {
      mat.size = 0.15;
    } else {
      mat.size = Math.max(0, mat.size - dt * 0.1);
    }
  }

  return { points, addPoint, update };
}
