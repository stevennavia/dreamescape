import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createBlackHole({ player, cameraObj, input, ui, terrainY, absorbables }) {
  const group = new THREE.Group();
  const CFG = CONFIG.blackHole;
  const portalPos = new THREE.Vector3(0, terrainY + CFG.posY, 0);

  group.position.copy(portalPos);

  // --- Core (dark sphere) ---
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(CFG.coreRadius, 32, 32), coreMat);
  group.add(core);

  // --- Event horizon ---
  const ehMat = new THREE.MeshBasicMaterial({ color: 0x050010, transparent: true, opacity: 0.8 });
  const eh = new THREE.Mesh(new THREE.SphereGeometry(CFG.coreRadius * 1.8, 32, 32), ehMat);
  group.add(eh);

  // --- Inner glow ring ---
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: 0x8844ff, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const innerGlow = new THREE.Mesh(new THREE.TorusGeometry(CFG.coreRadius * 2.2, 0.08, 16, 64), innerGlowMat);
  innerGlow.rotation.x = Math.PI / 2;
  group.add(innerGlow);

  // --- Accretion disc (3 rings) ---
  const discColors = [0xcc88ff, 0x4488ff, 0xff44cc];
  const discMats = [];
  const discMeshes = [];
  for (let i = 0; i < 3; i++) {
    const innerR = CFG.coreRadius * 2.5 + i * 2.5;
    const outerR = innerR + 2.0;
    const mat = new THREE.MeshBasicMaterial({
      color: discColors[i], transparent: true, opacity: 0.25 - i * 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(innerR, outerR, 64), mat);
    mesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
    group.add(mesh);
    discMats.push(mat);
    discMeshes.push(mesh);
  }

  // --- Outer glow ---
  const outerGlowMat = new THREE.MeshBasicMaterial({
    color: 0x4422aa, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const outerGlow = new THREE.Mesh(new THREE.SphereGeometry(CFG.discRadius * 0.6, 16, 16), outerGlowMat);
  group.add(outerGlow);

  // --- Orbital particles ---
  const pCount = CFG.particleCount;
  const pPos = new Float32Array(pCount * 3);
  const pCol = new Float32Array(pCount * 3);
  const pData = [];
  for (let i = 0; i < pCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = CFG.coreRadius * 2.5 + Math.random() * CFG.discRadius;
    const y = (Math.random() - 0.5) * 3;
    const i3 = i * 3;
    pPos[i3] = Math.cos(angle) * r;
    pPos[i3 + 1] = y;
    pPos[i3 + 2] = Math.sin(angle) * r;
    const hue = 0.7 + Math.random() * 0.2;
    const col = new THREE.Color().setHSL(hue, 0.8, 0.6);
    pCol[i3] = col.r;
    pCol[i3 + 1] = col.g;
    pCol[i3 + 2] = col.b;
    pData.push({ angle, r, y, speed: 0.3 + Math.random() * 0.8, ySpeed: (Math.random() - 0.5) * 0.5 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.4, vertexColors: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  // --- Disintegration particles ---
  const DISCount = 400;
  const disPos = new Float32Array(DISCount * 3);
  const disCol = new Float32Array(DISCount * 3);
  const disData = new Array(DISCount).fill(null);
  let disHead = 0;

  for (let i = 0; i < DISCount; i++) {
    disPos[i * 3] = 0;
    disPos[i * 3 + 1] = -1000;
    disPos[i * 3 + 2] = 0;
    disCol[i * 3] = 1;
    disCol[i * 3 + 1] = 1;
    disCol[i * 3 + 2] = 1;
  }

  const disGeo = new THREE.BufferGeometry();
  disGeo.setAttribute('position', new THREE.BufferAttribute(disPos, 3));
  disGeo.setAttribute('color', new THREE.BufferAttribute(disCol, 3));
  const disMat = new THREE.PointsMaterial({
    size: 0.5, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const disParticles = new THREE.Points(disGeo, disMat);
  group.add(disParticles);

  function spawnDisintegration(worldPos, count) {
    for (let n = 0; n < count; n++) {
      const i3 = disHead * 3;
      disPos[i3] = worldPos.x - portalPos.x + (Math.random() - 0.5) * 3;
      disPos[i3 + 1] = worldPos.y - portalPos.y + (Math.random() - 0.5) * 3;
      disPos[i3 + 2] = worldPos.z - portalPos.z + (Math.random() - 0.5) * 3;

      const hue = 0.65 + Math.random() * 0.25;
      const col = new THREE.Color().setHSL(hue, 0.7 + Math.random() * 0.3, 0.5 + Math.random() * 0.4);
      disCol[i3] = col.r;
      disCol[i3 + 1] = col.g;
      disCol[i3 + 2] = col.b;

      disData[disHead] = {
        age: 0,
        lifetime: 1.0 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
      };
      disHead = (disHead + 1) % DISCount;
    }
  }

  function updateDisintegration(dt) {
    const posArr = disGeo.attributes.position.array;
    const colArr = disGeo.attributes.color.array;
    for (let i = 0; i < DISCount; i++) {
      const d = disData[i];
      if (!d) continue;
      d.age += dt;
      if (d.age >= d.lifetime) {
        posArr[i * 3 + 1] = -1000;
        disData[i] = null;
        continue;
      }
      const t = d.age / d.lifetime;
      const i3 = i * 3;

      // Move toward portal center
      const cx = posArr[i3], cy = posArr[i3 + 1], cz = posArr[i3 + 2];
      const dx = -cx, dy = -cy, dz = -cz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0.1) {
        const pull = 6 * t;
        posArr[i3] += (dx / dist) * pull * dt + d.vx * dt;
        posArr[i3 + 1] += (dy / dist) * pull * dt + d.vy * dt;
        posArr[i3 + 2] += (dz / dist) * pull * dt + d.vz * dt;
      }

      // Fade out
      const fade = 1 - t * t;
      colArr[i3] *= fade;
      colArr[i3 + 1] *= fade;
      colArr[i3 + 2] *= fade;
    }
    disGeo.attributes.position.needsUpdate = true;
    disGeo.attributes.color.needsUpdate = true;
  }

  // --- Portal light ---
  const portalLight = new THREE.PointLight(0x8844ff, 0, 60);
  group.add(portalLight);

  // --- Initially hidden ---
  group.visible = false;

  // --- State ---
  let active = false;
  let phase = 0;
  let phaseTimer = 0;
  let _isTransitioning = false;
  const absorbableObjects = [];
  const absorbedSet = new Set();

  function start() {
    active = true;
    phase = 1;
    phaseTimer = 0;
    group.visible = true;
    group.scale.setScalar(0.01);
    absorbedSet.clear();

    absorbableObjects.length = 0;
    if (absorbables) absorbableObjects.push(...absorbables);
  }

  function update(dt, time) {
    if (!active) return;

    phaseTimer += dt;
    const t = phaseTimer;

    // Dynamic absorption radius grows with portal
    const growScale = group.scale.x;
    const currentAbsorptionRadius = CFG.absorptionRadius * Math.max(0.3, growScale);

    // Force increases over time
    const timeForce = Math.min(t * 0.12, 2.5);

    // --- Phase 1: Awaken ---
    if (phase === 1) {
      const growT = Math.min(t / CFG.growDuration, 1);
      const ease = 1 - Math.pow(1 - growT, 3);
      group.scale.setScalar(ease);

      innerGlowMat.opacity = 0.3 + Math.sin(time * 2) * 0.2;

      discMeshes.forEach((d, i) => {
        d.rotation.z = time * (0.1 + i * 0.05);
      });

      updateParticles(dt, time);
      updateDisintegration(dt);

      portalLight.intensity = ease * 3;

      const absorbMult = (0.8 + timeForce * 1.5) * (0.5 + ease * 0.5);
      updateAbsorption(dt, absorbMult, currentAbsorptionRadius, time);

      if (t >= CFG.growDuration) {
        phase = 2;
        phaseTimer = 0;
      }
    }

    // --- Phase 2: Collapse ---
    if (phase === 2) {
      discMeshes.forEach((d, i) => {
        d.rotation.z = time * (0.2 + i * 0.1);
        discMats[i].opacity = 0.3 + Math.sin(time * 1.5 + i) * 0.1;
      });

      innerGlowMat.opacity = 0.5 + Math.sin(time * 3) * 0.3;

      const outerPulse = 1 + Math.sin(time * 0.8) * 0.2;
      outerGlow.scale.setScalar(outerPulse);
      outerGlowMat.opacity = 0.1 + Math.sin(time * 1.2) * 0.05;

      portalLight.intensity = 5 + Math.sin(time * 2) * 2;

      updateParticles(dt, time);
      updateDisintegration(dt);

      const absorbMult = 1.0 + timeForce;
      updateAbsorption(dt, absorbMult, currentAbsorptionRadius, time);

      if (cameraObj && cameraObj.addShake) {
        cameraObj.addShake(0.02 + Math.sin(time * 0.5) * 0.01);
      }
    }

    // --- Phase 3: Consumption ---
    if (phase === 3) {
      discMeshes.forEach((d, i) => {
        d.rotation.z = time * (0.5 + i * 0.2);
      });
      innerGlowMat.opacity = 0.8 + Math.sin(time * 5) * 0.2;
      portalLight.intensity = 8 + Math.sin(time * 3) * 3;
      outerGlowMat.opacity = 0.3;

      updateParticles(dt, time);
      updateDisintegration(dt);

      const absorbMult = 2.0 + timeForce;
      updateAbsorption(dt, absorbMult, currentAbsorptionRadius * 1.5, time);
    }
  }

  function updateParticles(dt, time) {
    const posArr = pGeo.attributes.position.array;
    const speedMult = phase === 3 ? 3 : phase === 2 ? 1.5 : 1;
    for (let i = 0; i < pCount; i++) {
      const d = pData[i];
      d.angle += d.speed * speedMult * dt;
      const currentR = d.r * (phase === 3 ? Math.max(0.1, 1 - phaseTimer * 0.02) : 1);
      const i3 = i * 3;
      posArr[i3] = Math.cos(d.angle) * currentR;
      posArr[i3 + 1] = d.y + Math.sin(time * d.ySpeed) * 1.5;
      posArr[i3 + 2] = Math.sin(d.angle) * currentR;
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  function updateAbsorption(dt, mult, absRadius, time) {
    for (const obj of absorbableObjects) {
      if (!obj.visible) continue;
      if (absorbedSet.has(obj)) continue;

      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      const dist = worldPos.distanceTo(portalPos);

      if (dist < absRadius && dist > 0.1) {
        const dir = portalPos.clone().sub(worldPos).normalize();
        const proximity = 1 - dist / absRadius;

        // Gravitational force: grows exponentially as objects approach
        const gravityForce = Math.pow(proximity, 1.5) * 8 * mult;
        const speed = gravityForce;

        // Move toward portal
        obj.position.add(dir.multiplyScalar(speed * dt));

        // Spiral rotation (stronger near center)
        const rotMult = proximity * mult;
        obj.rotation.x += dt * 3 * rotMult;
        obj.rotation.y += dt * 4 * rotMult;
        obj.rotation.z += dt * 2 * rotMult;

        // Scale down proportionally
        const scale = Math.max(0.01, 1 - proximity * 0.8);
        obj.scale.setScalar(scale);

        // Fade opacity for transparent objects
        if (obj.material && obj.material.transparent) {
          obj.material.opacity = Math.max(0.05, obj.material.opacity - dt * 0.5 * mult);
        }

        // Disintegration particles (denser near center)
        if (proximity > 0.05) {
          const spawnCount = Math.ceil(proximity * proximity * 15 * mult);
          spawnDisintegration(worldPos, spawnCount);
        }

        // Consume when close enough
        if (dist < 2) {
          spawnDisintegration(worldPos, 60);
          obj.visible = false;
          absorbedSet.add(obj);
        }
      }
    }
  }

  function updatePlayerPull(dt) {
    if (!active || _isTransitioning) return;
    if (phase < 1) return;

    const dist = player.position.distanceTo(portalPos);
    if (dist < CFG.playerPullRadius) {
      const dir = portalPos.clone().sub(player.position).normalize();
      const normalized = 1 - dist / CFG.playerPullRadius;
      const pullMult = phase === 1 ? 8 : phase === 2 ? 20 : 40;
      const strength = normalized * normalized * pullMult;
      player.velocity.add(dir.multiplyScalar(strength * dt));
    }
    if (dist < CFG.sceneChangeRadius) {
      triggerWhiteLightTransition();
    }
  }

  function triggerWhiteLightTransition() {
    if (_isTransitioning) return;
    _isTransitioning = true;
    phase = 3;
    phaseTimer = 0;

    player.disable();
    input.disabled = true;

    if (cameraObj && cameraObj.setOverride) {
      cameraObj.setOverride(portalPos, 0.4);
    }

    if (ui && ui.showWhiteFade) {
      ui.showWhiteFade();
    }

    setTimeout(() => {
      loadNextScene();
    }, 2000);
  }

  function loadNextScene() {
    console.log('Nueva escena aún por definir');
  }

  function getIsTransitioning() { return _isTransitioning; }

  return {
    group,
    start,
    update,
    updatePlayerPull,
    getIsTransitioning,
    get portalPosition() { return portalPos; },
  };
}
