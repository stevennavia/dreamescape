import * as THREE from 'three';

export function createDoor(px = 60, py = 48, pz = 4) {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x889999,
    roughness: 0.5,
    metalness: 0.15,
  });

  const colGeo = new THREE.CylinderGeometry(0.7, 0.8, 16, 10);
  const leftCol = new THREE.Mesh(colGeo, stoneMat);
  leftCol.position.set(-4, 8, 0);
  leftCol.castShadow = true;
  group.add(leftCol);

  const rightCol = new THREE.Mesh(colGeo, stoneMat);
  rightCol.position.set(4, 8, 0);
  rightCol.castShadow = true;
  group.add(rightCol);

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1, 2),
    stoneMat
  );
  lintel.position.set(0, 16.5, 0);
  lintel.castShadow = true;
  group.add(lintel);

  const archGeo = new THREE.TorusGeometry(4, 0.35, 8, 8, Math.PI);
  const arch = new THREE.Mesh(archGeo, stoneMat);
  arch.position.set(0, 16.5, 0);
  arch.rotation.y = Math.PI / 2;
  arch.castShadow = true;
  group.add(arch);

  const portalMat = new THREE.MeshBasicMaterial({
    color: 0xffeedd,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 14),
    portalMat
  );
  portal.position.set(0, 8.5, 0);
  group.add(portal);

  const portalGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.5, 15.5),
    new THREE.MeshBasicMaterial({
      color: 0xffddaa,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  portalGlow.position.set(0, 8.5, 0.05);
  group.add(portalGlow);

  const portalLight = new THREE.PointLight(0xffddaa, 6, 30);
  portalLight.position.set(0, 8, 1);
  group.add(portalLight);

  const portalLightBack = new THREE.PointLight(0xffddaa, 3, 20);
  portalLightBack.position.set(0, 8, -1);
  group.add(portalLightBack);

  const symbolGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  for (let s = 0; s < 12; s++) {
    const symbol = new THREE.Mesh(symbolGeo, new THREE.MeshStandardMaterial({
      color: 0xccbb99,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x332211,
      emissiveIntensity: 0.3,
    }));
    const a = (s / 12) * Math.PI;
    symbol.position.set(
      Math.cos(a) * 5.5,
      16.5 + Math.sin(a) * 3,
      0
    );
    symbol.rotation.y = Math.random() * Math.PI;
    symbol.castShadow = true;
    group.add(symbol);
  }

  const basePlatform = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.6, 5),
    new THREE.MeshStandardMaterial({
      color: 0x778888,
      roughness: 0.4,
      metalness: 0.2,
    })
  );
  basePlatform.position.y = -0.3;
  basePlatform.castShadow = true;
  basePlatform.receiveShadow = true;
  group.add(basePlatform);

  group.position.set(px, py, pz);
  group.rotation.y = -Math.PI / 2;

  let glowLevel = 0;
  let singularityTime = 0;
  const singularityDuration = 10;

  function setGlowLevel(level) {
    glowLevel = Math.max(glowLevel, level);
    if (level >= 1) {
      portalLight.intensity = 10;
      portalGlow.material.opacity = 0.12;
      portalMat.opacity = 0.18;
    }
    if (level >= 2) {
      portalLight.intensity = 15;
      portalGlow.material.opacity = 0.2;
      portalMat.opacity = 0.25;
    }
    if (level >= 3) {
      singularityTime = 0;
    }
  }

  function update(dt) {
    if (glowLevel >= 3 && singularityTime < singularityDuration) {
      singularityTime += dt;
      const t = Math.min(singularityTime / singularityDuration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      portalLight.intensity = 15 + ease * 35;
      portalLightBack.intensity = 8 + ease * 20;
      portalGlow.material.opacity = 0.2 + ease * 0.5;
      portalMat.opacity = 0.25 + ease * 0.5;
      portalMat.color.setHex(0xffeedd).lerp(new THREE.Color(0xffffff), ease);
      portalGlow.material.color.setHex(0xffddaa).lerp(new THREE.Color(0xffffff), ease);
    }
  }

  function getSingularityProgress() {
    if (glowLevel < 3) return 0;
    return Math.min(singularityTime / singularityDuration, 1);
  }

  function getCollision(x, z, y) {
    const local = group.worldToLocal(new THREE.Vector3(x, y, z));
    if (local.y > -0.5 && local.y < 1.0 && Math.abs(local.x) < 5.5 && Math.abs(local.z) < 2.5) {
      return group.localToWorld(new THREE.Vector3(0, 0.3, 0)).y;
    }
    return null;
  }

  function getWorldPosition() {
    const pos = new THREE.Vector3();
    group.getWorldPosition(pos);
    return pos;
  }

  return {
    group,
    getCollision,
    getWorldPosition,
    setGlowLevel,
    update,
    getSingularityProgress,
  };
}
