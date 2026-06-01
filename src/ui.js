export function createUI() {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; top: 20px; right: 24px; z-index: 10;
    display: flex; align-items: center; gap: 8px;
    pointer-events: none; user-select: none;
  `;
  document.body.appendChild(container);

  const orbIcon = document.createElement('div');
  orbIcon.style.cssText = `
    width: 10px; height: 10px; border-radius: 50%;
    background: #ffcc33; box-shadow: 0 0 8px rgba(255,204,51,0.6);
  `;
  container.appendChild(orbIcon);

  const orbCounter = document.createElement('div');
  orbCounter.style.cssText = `
    font-family: monospace; font-size: 20px; color: rgba(255,255,255,0.7);
    text-shadow: 0 0 8px rgba(255,204,51,0.4);
  `;
  container.appendChild(orbCounter);

  // --- Intro text ---
  const intro = document.createElement('div');
  intro.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 30; pointer-events: none; user-select: none;
    font-family: monospace; font-size: 28px; color: rgba(255,255,255,0.6);
    text-shadow: 0 0 20px rgba(136,102,204,0.5), 0 0 40px rgba(136,102,204,0.3);
    text-align: center; letter-spacing: 2px;
    transition: opacity 0.6s;
  `;
  intro.textContent = 'find the 3 orbs';
  document.body.appendChild(intro);

  function hideIntro() {
    if (intro.parentNode) {
      intro.style.opacity = '0';
      setTimeout(() => {
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, 600);
    }
  }

  document.addEventListener('keydown', hideIntro, { once: true });
  document.addEventListener('click', hideIntro, { once: true });

  let hintTimer = null;

  function showHint(text, duration) {
    const existing = document.querySelector('.hint-text');
    if (existing) existing.remove();

    const hint = document.createElement('div');
    hint.className = 'hint-text';
    hint.style.cssText = `
      position: fixed; top: 60%; left: 50%; transform: translate(-50%, -50%);
      z-index: 30; pointer-events: none; user-select: none;
      font-family: monospace; font-size: 22px; color: rgba(255,255,255,0.5);
      text-shadow: 0 0 15px rgba(136,102,204,0.4);
      text-align: center; letter-spacing: 1px;
      transition: opacity 0.4s;
    `;
    hint.textContent = text;
    document.body.appendChild(hint);

    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => {
        if (hint.parentNode) hint.parentNode.removeChild(hint);
      }, 400);
    }, duration * 1000);
  }

  // --- White fade overlay ---
  const whiteFade = document.createElement('div');
  whiteFade.style.cssText = `
    position: fixed; inset: 0; background: white;
    opacity: 0; pointer-events: none; z-index: 9999;
  `;
  document.body.appendChild(whiteFade);

  function showWhiteFade() {
    whiteFade.style.transition = 'opacity 2.2s ease-in-out';
    whiteFade.style.opacity = '1';
  }

  function update(count, total) {
    orbCounter.textContent = `${count} / ${total}`;
  }

  return { update, showHint, showWhiteFade };
}
