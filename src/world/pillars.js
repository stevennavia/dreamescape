import * as THREE from 'three';

export function createPillars() {
  const group = new THREE.Group();
  const pillars = [];
  const collidable = [];
  const count = 7;

  const stoneLight = new THREE.MeshStandardMaterial({
    color: 0xaaaacc,
    roughness: 0.5,
    metalness: 0.12,
  });
  const stoneDark = new THREE.MeshStandardMaterial({
    color: 0x888899,
    roughness: 0.5,
    metalness: 0.12,
  });

  const pillarDefs = [
    { x: 6, z: 3, y: 10, rotX: 0, rotZ: 0, h: 12, r: 2.0, collision: true, style: 0 },
    { x: -6, z: -6, y: 18, rotX: 0.4, rotZ: -0.15, h: 10, r: 1.8, collision: true, style: 0 },
    { x: 8, z: -10, y: 24, rotX: 0, rotZ: 0, h: 16, r: 2.2, collision: true, style: 0 },
    { x: -10, z: 6, y: 32, rotX: 0.1, rotZ: 1.25, h: 8, r: 2.0, collision: false, style: 2 },
    { x: 4, z: -16, y: 40, rotX: 0.12, rotZ: -0.08, h: 14, r: 1.8, collision: true, style: 3 },
    { x: 12, z: 4, y: 48, rotX: 0, rotZ: 0, h: 20, r: 2.8, collision: true, style: 0 },
    { x: 52, z: 3, y: 54, rotX: 0, rotZ: 0, h: 12, r: 2.5, collision: true, style: 0 },
  ];

  for (let i = 0; i < count; i++) {
    const pillarGroup = new THREE.Group();
    const def = pillarDefs[i];
    const mat = i % 2 === 0 ? stoneLight : stoneDark;
    const shaftH = def.h;
    const shaftR = def.r;

    if (def.style === 3) {
      const segCount = 3;
      const segH = shaftH / segCount;
      for (let s = 0; s < segCount; s++) {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(shaftR * (1 - s * 0.06), shaftR * (1 - s * 0.04), segH, 20),
          s % 2 === 0 ? stoneLight : stoneDark
        );
        seg.position.y = s * segH + segH / 2 + (s > 0 ? s * 0.5 : 0);
        seg.position.x = (s - 1) * 0.5;
        seg.castShadow = true;
        pillarGroup.add(seg);
      }
      const topCap = new THREE.Mesh(
        new THREE.CylinderGeometry(shaftR * 1.3, shaftR * 0.7, 0.7, 20),
        mat
      );
      topCap.position.y = shaftH + 0.7;
      topCap.castShadow = true;
      pillarGroup.add(topCap);
    } else {
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(shaftR * 0.85, shaftR, shaftH, 20),
        mat
      );
      shaft.position.y = shaftH / 2;
      shaft.castShadow = true;
      pillarGroup.add(shaft);

      const capitalR = shaftR * 1.5;
      const capital = new THREE.Mesh(
        new THREE.CylinderGeometry(capitalR, shaftR, 0.6, 20),
        mat
      );
      capital.position.y = shaftH + 0.3;
      capital.castShadow = true;
      pillarGroup.add(capital);

      const capitalTop = new THREE.Mesh(
        new THREE.BoxGeometry(capitalR * 2.2, 0.3, capitalR * 2.2),
        i % 2 === 0 ? stoneDark : stoneLight
      );
      capitalTop.position.y = shaftH + 0.8;
      capitalTop.castShadow = true;
      pillarGroup.add(capitalTop);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(shaftR, shaftR * 0.82, 0.5, 20),
        mat
      );
      base.position.y = 0.25;
      base.castShadow = true;
      pillarGroup.add(base);
    }

    if (def.style === 2) {
      for (let f = 0; f < 2; f++) {
        const frag = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.35, 0.6),
          stoneDark
        );
        frag.position.set(1.5, shaftH * 0.35 + f * 1.2, 0.5 * (f === 0 ? -1 : 1));
        frag.userData.orbit = { r: shaftR + 1.2, a: f * Math.PI, speed: 0.25, yBase: frag.position.y };
        pillarGroup.add(frag);
      }
    }

    pillarGroup.position.set(def.x, def.y, def.z);
    pillarGroup.rotation.x = def.rotX;
    pillarGroup.rotation.z = def.rotZ;
    group.add(pillarGroup);

    const pillarData = {
      group: pillarGroup,
      rotSpeed: 0.05 + Math.random() * 0.12,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: 0.1 + Math.random() * 0.35,
      baseY: def.y,
      localTop: shaftH + 1.0,
      topY: def.y + shaftH + 1.0,
      cx: def.x,
      cz: def.z,
      radius: shaftR + 2.0,
      hasCollision: def.collision,
    };
    pillars.push(pillarData);
    if (def.collision) collidable.push(pillarData);
  }

  function update(time) {
    for (const p of pillars) {
      p.group.rotation.y += p.rotSpeed * 0.016;
      const bob = Math.sin(time * 0.4 + p.bobPhase) * p.bobAmp;
      p.group.position.y = p.baseY + bob;
      p.topY = p.baseY + bob + p.localTop;
      for (const child of p.group.children) {
        if (child.userData.orbit) {
          const o = child.userData.orbit;
          o.a += o.speed * 0.016;
          child.position.x = Math.cos(o.a) * o.r;
          child.position.z = Math.sin(o.a) * o.r;
        }
      }
    }
  }

  function getPillarTop(x, z, playerY) {
    for (const p of collidable) {
      const dist = Math.sqrt((x - p.cx) ** 2 + (z - p.cz) ** 2);
      if (dist < p.radius && playerY > p.topY - 5 && playerY < p.topY + 3) return p.topY;
    }
    return null;
  }

  function getPillarPush(x, z, y, r) {
    for (const p of collidable) {
      if (y >= p.topY) continue;
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

  return { group, update, getPillarTop, getPillarPush };
}
