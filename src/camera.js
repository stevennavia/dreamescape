import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.fovDefault,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );

  const currentPos = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3();

  let currentFov = CONFIG.fovDefault;

  function update(playerPos, input, dt, playerState) {
    const yaw = input.mouseX;
    const pitch = input.mouseY;

    // Camera distance based on state
    let distance = CONFIG.camDistance;
    if (playerState === 'Glide') {
      distance = CONFIG.camDistanceGlide;
    } else if (playerState === 'Run') {
      distance = CONFIG.camDistance - 1;
    }

    // Calculate desired camera position
    const lookDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();

    const camOffset = new THREE.Vector3();
    camOffset.copy(lookDir).multiplyScalar(-distance);
    camOffset.y += CONFIG.camHeight - Math.sin(pitch) * distance * 0.5;

    // Slight look-ahead when moving
    if (playerState === 'Run' || playerState === 'Dash') {
      camOffset.add(lookDir.clone().multiplyScalar(-CONFIG.camLookAhead));
    }

    const desiredPos = playerPos.clone().add(camOffset);
    desiredPos.y = Math.max(desiredPos.y, playerPos.y);

    // Smooth lerp
    if (currentPos.lengthSq() === 0) {
      currentPos.copy(desiredPos);
    } else {
      const lerpSpeed = CONFIG.camLerpSpeed;
      currentPos.lerp(desiredPos, Math.min(1, lerpSpeed * dt));
    }
    currentPos.y = Math.max(currentPos.y, playerPos.y - 0.5);

    // Look at player with slight lead
    const lookTarget = playerPos.clone();
    if (playerState === 'Run' || playerState === 'Dash') {
      lookTarget.add(lookDir.clone().multiplyScalar(2));
    }
    if (currentLookAt.lengthSq() === 0) {
      currentLookAt.copy(lookTarget);
    } else {
      currentLookAt.lerp(lookTarget, Math.min(1, 3 * dt));
    }

    camera.position.copy(currentPos);
    camera.lookAt(currentLookAt);

    // Dynamic FOV
    let targetFov = CONFIG.fovDefault;
    if (playerState === 'Run') targetFov = CONFIG.fovRun;
    if (playerState === 'Dash') targetFov = CONFIG.fovRun + 3;
    if (playerState === 'Glide') targetFov = CONFIG.fovDefault + 2;

    currentFov += (targetFov - currentFov) * Math.min(1, 3 * dt);
    camera.fov = currentFov;
    camera.updateProjectionMatrix();
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  return { camera, update, resize };
}
