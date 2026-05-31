export function createUI() {
  const crosshair = document.createElement('div');
  crosshair.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.15);
    pointer-events: none; z-index: 10;
  `;
  document.body.appendChild(crosshair);

  const orbCounter = document.createElement('div');
  orbCounter.style.cssText = `
    position: fixed; top: 20px; right: 24px; z-index: 10;
    font-family: monospace; font-size: 20px; color: rgba(255,255,255,0.7);
    text-shadow: 0 0 8px rgba(255,204,51,0.4);
    pointer-events: none; user-select: none;
  `;
  document.body.appendChild(orbCounter);

  function update(count, total) {
    orbCounter.textContent = `${count} / ${total}`;
  }

  return { update };
}
