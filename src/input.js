export function createInput(camera) {
  const keys = new Set();
  let mouseX = 0, mouseY = 0;
  let isLocked = false;
  const sensitivity = 0.003;
  const autoRotateSpeed = 2.0;

  document.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  });
  document.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    mouseX += e.movementX * sensitivity;
    mouseY += e.movementY * sensitivity;
    mouseY = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, mouseY));
  });

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement !== null;
  });

  document.addEventListener('click', () => {
    if (!isLocked) {
      document.body.requestPointerLock();
    }
  });

  function update(dt) {
    // Camera follows WASD: compute relative offset from current yaw
    const w = keys.has('KeyW');
    const s = keys.has('KeyS');
    const a = keys.has('KeyA');
    const d = keys.has('KeyD');

    let offset = null;
    if (a && d) { /* strafe neutral */ }
    else if (w && d && !s) offset = -Math.PI / 4;
    else if (w && a && !s) offset = Math.PI / 4;
    else if (s && d && !w) offset = -3 * Math.PI / 4;
    else if (s && a && !w) offset = 3 * Math.PI / 4;
    else if (d && !w && !s) offset = -Math.PI / 2;
    else if (a && !w && !s) offset = Math.PI / 2;
    else if (s && !a && !d) offset = Math.PI;
    // else if (w && !a && !d) offset = 0 — no rotation needed for W

    if (offset !== null) {
      const target = mouseX + offset;
      let diff = target - mouseX;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      mouseX += diff * Math.min(1, autoRotateSpeed * (dt || 0.016));
    }
  }

  function reset() {
    mouseX = 0;
    mouseY = 0;
  }

  return {
    get keys() { return keys; },
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get isLocked() { return isLocked; },
    update,
    reset,
  };
}
