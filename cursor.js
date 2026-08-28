/**
 * High-Performance 60FPS Futuristic Cursor Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);

  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  document.body.appendChild(cursorRing);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let prevMouseX = mouseX;
  let prevMouseY = mouseY;

  const particles = [];
  const MAX_PARTICLES = 32;
  const PALETTE = ['#1e60d0', '#00a8e8', '#f59e0b', '#10b981'];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;

    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;
    const distSq = dx * dx + dy * dy;

    if (distSq > 9 && particles.length < MAX_PARTICLES) {
      createParticle(mouseX, mouseY, dx, dy);
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }, { passive: true });

  function createParticle(x, y, vx, vy) {
    const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.0 + Math.PI;
    const speed = Math.random() * 1.8 + 0.6;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.8 + 1.4,
      maxLife: 20,
      life: 0,
      color: color,
      alpha: 1
    });
  }

  function bindHoverElements() {
    const hoverElements = document.querySelectorAll('a, button, input, .canva-card, .ctrl-btn');
    hoverElements.forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'), { passive: true });
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'), { passive: true });
    });
  }
  bindHoverElements();
  window.addEventListener('DOMContentLoaded', bindHoverElements);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Smooth ring follow
    ringX += (mouseX - ringX) * 0.25;
    ringY += (mouseY - ringY) * 0.25;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

    const len = particles.length;
    for (let i = len - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.size *= 0.95;

      p.alpha = 1 - (p.life / p.maxLife);

      if (p.alpha <= 0 || p.size <= 0.3) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
  }

  animate();
})();
