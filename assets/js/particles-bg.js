/**
 * High-Performance Ambient Background Data Constellation
 * Data Analytics Club - IMSUCC Ghaziabad
 * Optimized for 60fps with distance-squared checks & lightweight node count.
 */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-particles-canvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let width, height;
  const nodes = [];
  const NODE_COUNT = Math.min(Math.floor(window.innerWidth / 45), 24);
  const CONNECTION_DIST = 110;
  const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;
  let mouse = { x: null, y: null, radiusSq: 140 * 140 };

  const PALETTE = [
    'rgba(30, 96, 208, 0.4)',
    'rgba(0, 168, 232, 0.4)',
    'rgba(245, 158, 11, 0.35)',
    'rgba(16, 185, 129, 0.3)'
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 1.8 + 1.2;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < mouse.radiusSq && dSq > 1) {
          const dist = Math.sqrt(dSq);
          const force = (140 - dist) / 140;
          this.x -= (dx / dist) * force * 2;
          this.y -= (dy / dist) * force * 2;
        }
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 6.28);
      ctx.fill();
    }
  }

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(new Node());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Fast batch line stroke
    ctx.lineWidth = 0.75;
    const len = nodes.length;

    for (let i = 0; i < len; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < len; j++) {
        const n2 = nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dSq = dx * dx + dy * dy;

        if (dSq < CONNECTION_DIST_SQ) {
          const alpha = (1 - Math.sqrt(dSq) / CONNECTION_DIST) * 0.18;
          ctx.strokeStyle = `rgba(30, 96, 208, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
      n1.update();
      n1.draw();
    }

    requestAnimationFrame(render);
  }

  render();
})();
