import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createPlayer(terrainGetHeight, islandsGetCollision, islandsGetPush, towerGetCollision, towerGetWallPush) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(CONFIG.playerRadius, 16, 16);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: CONFIG.playerColor,
    emissive: CONFIG.playerColor,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), coreMat);
  core.position.y = 0.5;
  group.add(core);

  const playerLight = new THREE.PointLight(CONFIG.playerColor, 1.5, 15);
  playerLight.position.y = 0.5;
  group.add(playerLight);

  const velocity = new THREE.Vector3();
  const position = new THREE.Vector3(0, 20, 0);
  let isGrounded = false;
  let isGliding = false;
  let isDashing = false;
  let dashTimer = 0;
  let state = 'Walk';
  let wallNormal = null;

  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  const PR = CONFIG.playerRadius;

  function getState() { return state; }

  function reset() {
    position.set(0, 20, 0);
    velocity.set(0, 0, 0);
    isGrounded = false;
    isGliding = false;
    isDashing = false;
    dashTimer = 0;
    wallNormal = null;
    state = 'Walk';
  }

  function update(input, camera, dt) {
    const { keys } = input;
    const yaw = input.mouseX;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? CONFIG.runSpeed : CONFIG.walkSpeed;
    const accel = keys.has('ShiftLeft') || keys.has('ShiftRight') ? CONFIG.acceleration * 1.2 : CONFIG.acceleration;

    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    right.set(forward.z, 0, -forward.x).normalize();

    direction.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) direction.add(forward);
    if (keys.has('KeyS') || keys.has('ArrowDown')) direction.sub(forward);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) direction.add(right);
    if (keys.has('KeyD') || keys.has('ArrowRight')) direction.sub(right);
    if (direction.lengthSq() > 0) {
      direction.normalize();
    }

    // Dash
    if (!isDashing && keys.has('KeyE')) {
      isDashing = true;
      dashTimer = CONFIG.dashDuration;
      const dashDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      velocity.copy(dashDir.multiplyScalar(CONFIG.dashForce));
      velocity.y = Math.max(velocity.y, 2);
      state = 'Dash';
    }

    if (isDashing) {
      dashTimer -= dt;
      if (dashTimer <= 0) {
        isDashing = false;
        state = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 'Run' : 'Walk';
      }
    }

    // Acceleration (horizontal)
    if (!isDashing) {
      const targetVel = direction.clone().multiplyScalar(speed);
      velocity.x += (targetVel.x - velocity.x) * Math.min(1, accel * dt);
      velocity.z += (targetVel.z - velocity.z) * Math.min(1, accel * dt);
    }

    // Friction
    if (direction.lengthSq() === 0 && !isDashing) {
      velocity.x *= Math.pow(CONFIG.friction, dt * 60);
      velocity.z *= Math.pow(CONFIG.friction, dt * 60);
    }

    // Gravity (wall slide reduces fall)
    wallNormal = null;
    if (isDashing) {
      velocity.y += CONFIG.gravity * dt * 0.3;
    } else {
      velocity.y += CONFIG.gravity * dt;
    }

    // Jump (grounded or wall jump)
    if (keys.has('Space')) {
      if (isGrounded) {
        velocity.y = CONFIG.jumpForce;
        isGrounded = false;
        state = 'Jump';
      }
    }

    // Update position
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
    position.z += velocity.z * dt;

    // --- Terrain collision ---
    const terrainH = terrainGetHeight(position.x, position.z);
    const playerBottom = position.y - PR;

    if (playerBottom < terrainH) {
      position.y = terrainH + PR;
      velocity.y = 0;
      isGrounded = true;
      if (!keys.has('Space') && !isDashing) {
        state = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 'Run' : 'Walk';
      }
    }

    // --- Island collision (vertical) ---
    const islandTop = islandsGetCollision(position.x, position.z, position.y);
    if (islandTop !== null) {
      if (playerBottom < islandTop && position.y > islandTop - 2) {
        position.y = islandTop + PR;
        velocity.y = 0;
        isGrounded = true;
        if (!keys.has('Space') && !isDashing) {
          state = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 'Run' : 'Walk';
        }
      }
    }

    // --- Island push (horizontal wall) ---
    if (islandsGetPush && !isDashing) {
      const push = islandsGetPush(position.x, position.z, position.y - PR, PR);
      if (push) {
        position.x = push.x;
        position.z = push.z;
        if (!isGrounded && velocity.y < 0) {
          wallNormal = { nx: push.nx, nz: push.nz };
        }
      }
    }

    // --- Tower collision (vertical) ---
    if (towerGetCollision) {
      const towerTop = towerGetCollision(position.x, position.z, position.y);
      if (towerTop !== null) {
        if (playerBottom < towerTop && position.y > towerTop - 2) {
          position.y = towerTop + PR;
          velocity.y = 0;
          isGrounded = true;
          if (!keys.has('Space') && !isDashing) {
            state = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 'Run' : 'Walk';
          }
        }
      }
    }

    // --- Tower wall push ---
    if (towerGetWallPush && !isDashing) {
      const push = towerGetWallPush(position.x, position.z, position.y - PR, PR);
      if (push) {
        position.x = push.x;
        position.z = push.z;
        if (!isGrounded && velocity.y < 0) {
          wallNormal = { nx: push.nx, nz: push.nz };
        }
      }
    }

    // --- Wall slide ---
    let isWallSliding = false;
    if (!isGrounded && wallNormal && velocity.y < 0) {
      velocity.y = -2; // slow fall
      isWallSliding = true;
      state = 'WallSlide';
    }

    // --- Wall jump ---
    if (!isGrounded && wallNormal && keys.has('Space') && !isDashing) {
      const wj = CONFIG.wallJumpHorizontal;
      velocity.x = -wallNormal.nx * wj;
      velocity.z = -wallNormal.nz * wj;
      velocity.y = CONFIG.jumpForce * 1.1;
      wallNormal = null;
      isWallSliding = false;
      state = 'Jump';
    }

    // --- Glide (only when no wall) ---
    isGliding = false;
    if (!isGrounded && !wallNormal && keys.has('Space') && velocity.y < 0 && !isWallSliding) {
      velocity.y = -2;
      isGliding = true;
      state = 'Glide';
      const lookDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      velocity.x += lookDir.x * dt * 5;
      velocity.z += lookDir.z * dt * 5;
    }

    // Fall reset
    if (position.y < -30) {
      reset();
    }

    // Update group position
    group.position.copy(position);

    // Body bob
    const bob = isGrounded && direction.lengthSq() > 0
      ? Math.sin(Date.now() * 0.01) * 0.03
      : 0;
    body.position.y = 0.5 + bob;
    core.position.y = 0.5 + bob;

    // Pulse
    const pulse = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
    bodyMat.emissiveIntensity = pulse * 0.5;
    playerLight.intensity = 1 + Math.sin(Date.now() * 0.002) * 0.3;

    // State
    if (!isDashing && !isGliding && !isWallSliding) {
      if (!isGrounded) {
        state = 'Jump';
      } else if (keys.has('ShiftLeft') || keys.has('ShiftRight')) {
        state = 'Run';
      } else if (direction.lengthSq() > 0) {
        state = 'Walk';
      } else {
        state = 'Walk';
      }
    }
  }

  return {
    group, body, update, reset,
    get position() { return position; },
    get velocity() { return velocity; },
    get isGrounded() { return isGrounded; },
    get isGliding() { return isGliding; },
    get isDashing() { return isDashing; },
    getState,
  };
}
