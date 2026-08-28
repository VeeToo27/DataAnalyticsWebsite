/**
 * High-Performance 60FPS Scroll-Driven 3D Data Particle Tunnel & Logo Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 * Optimized with glyph batching, direct matrix transforms, and optimal particle capping.
 */

class LogoTunnelEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false }); // Fast opaque canvas drawing
    this.particles = [];
    this.streamParticles = [];
    this.logoPoints = [];
    
    // Scroll progress (0 = tunnel, 1 = logo)
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.elapsedTime = 0;
    this.lastTime = performance.now();

    this.mouse = { x: -9999, y: -9999, radius: 110, isOverCanvas: false };
    this.tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.cameraZ = 650;
    this.fov = 420;
    this.logoCenterOffsetY = -25;

    // Target particle count for 60fps smoothness
    this.MAX_LOGO_PARTICLES = 480;
    this.MAX_STREAMERS = 36;

    // Shockwave state
    this.shockwave = {
      active: false,
      radius: 0,
      maxRadius: 280,
      alpha: 1,
      speed: 400
    };
    this.hasShockwaveTriggered = false;

    // Catalog of data glyphs
    this.NUMBERS = ['0', '1', '42', '3.14', '99', '7', '8', '%', '01'];
    this.MATH_CHARS = ['∑', 'π', 'f(x)', 'λ', 'μ', 'σ', 'β', 'Δ', '∫', '∞', '{ }'];
    this.GLYPH_TYPES = [
      'NUMBER',
      'CHAR',
      'LINE_GRAPH',
      'PIE_CHART',
      'BAR_CHART',
      'PYRAMID_GRAPH',
      'DOT'
    ];

    this.logoImg = new Image();
    this.logoImg.src = 'assets/images/club_logo.jpg';

    this.initEvents();
    this.resize();
    this.loadLogo();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.recalculateTargets();
    }, { passive: true });

    // Throttled scroll listener
    window.addEventListener('scroll', () => {
      this.updateScrollProgress();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      this.mouse.x = rawX - this.canvas.width / 2;
      this.mouse.y = rawY - (this.canvas.height / 2 + this.logoCenterOffsetY);
      this.mouse.isOverCanvas = (rawX >= 0 && rawX <= rect.width && rawY >= 0 && rawY <= rect.height);

      this.tilt.targetX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      this.tilt.targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
      this.mouse.isOverCanvas = false;
      this.tilt.targetX = 0;
      this.tilt.targetY = 0;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left - this.canvas.width / 2;
        this.mouse.y = e.touches[0].clientY - rect.top - (this.canvas.height / 2 + this.logoCenterOffsetY);
        this.mouse.isOverCanvas = true;
      }
    }, { passive: true });

    const replayBtn = document.getElementById('replay-intro-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  updateScrollProgress() {
    const track = document.getElementById('intro-scroll-track');
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const scrollDistance = -trackRect.top;
    const maxScroll = trackRect.height - window.innerHeight;

    if (maxScroll <= 0) {
      this.targetScrollProgress = 0;
      return;
    }

    const progress = Math.max(0, Math.min(1, scrollDistance / maxScroll));
    this.targetScrollProgress = progress;

    const scrollLabel = document.querySelector('#scroll-cue span');
    if (scrollLabel) {
      if (progress < 0.15) {
        scrollLabel.textContent = 'Scroll Down To Form Logo';
      } else if (progress < 0.85) {
        scrollLabel.textContent = 'Keep Scrolling...';
      } else {
        scrollLabel.textContent = 'Scroll Down To Explore';
      }
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = (this.canvas.clientWidth || window.innerWidth) * dpr;
    this.canvas.height = (this.canvas.clientHeight || window.innerHeight) * dpr;
    this.ctx.scale(dpr, dpr);
    this.viewWidth = this.canvas.clientWidth || window.innerWidth;
    this.viewHeight = this.canvas.clientHeight || window.innerHeight;
  }

  loadLogo() {
    this.logoImg.onload = () => {
      this.sampleLogoPixels();
      this.initParticles();
      this.updateScrollProgress();
      this.startLoop();
    };

    this.logoImg.onerror = () => {
      this.generateProceduralLogoPoints();
      this.initParticles();
      this.updateScrollProgress();
      this.startLoop();
    };

    if (this.logoImg.complete && this.logoImg.naturalWidth > 0) {
      this.sampleLogoPixels();
      this.initParticles();
      this.updateScrollProgress();
      this.startLoop();
    }
  }

  sampleLogoPixels() {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    const sampleSize = 260;
    offCanvas.width = sampleSize;
    offCanvas.height = sampleSize;

    offCtx.drawImage(this.logoImg, 0, 0, sampleSize, sampleSize);
    let imgData;
    try {
      imgData = offCtx.getImageData(0, 0, sampleSize, sampleSize);
    } catch (err) {
      this.generateProceduralLogoPoints();
      return;
    }

    const data = imgData.data;
    const rawPoints = [];
    const step = 6; // Optimal sampling step

    for (let y = 0; y < sampleSize; y += step) {
      for (let x = 0; x < sampleSize; x += step) {
        const idx = (y * sampleSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const isWhite = r > 230 && g > 230 && b > 230;
        const isTransparent = a < 50;

        if (!isWhite && !isTransparent) {
          const normX = (x - sampleSize / 2) * (330 / sampleSize);
          const normY = (y - sampleSize / 2) * (330 / sampleSize);

          rawPoints.push({
            normX: normX,
            normY: normY,
            r: r,
            g: g,
            b: b,
            a: a / 255
          });
        }
      }
    }

    // Downsample evenly to MAX_LOGO_PARTICLES if needed
    if (rawPoints.length > this.MAX_LOGO_PARTICLES) {
      this.logoPoints = [];
      const stride = rawPoints.length / this.MAX_LOGO_PARTICLES;
      for (let i = 0; i < this.MAX_LOGO_PARTICLES; i++) {
        this.logoPoints.push(rawPoints[Math.floor(i * stride)]);
      }
    } else if (rawPoints.length >= 250) {
      this.logoPoints = rawPoints;
    } else {
      this.generateProceduralLogoPoints();
    }
  }

  generateProceduralLogoPoints() {
    this.logoPoints = [];
    const radius = 150;
    
    // Outer Circle Ring (Navy)
    for (let theta = 0; theta < Math.PI * 2; theta += 0.045) {
      this.logoPoints.push({
        normX: Math.cos(theta) * radius,
        normY: Math.sin(theta) * radius,
        r: 11, g: 34, b: 101, a: 1
      });
      this.logoPoints.push({
        normX: Math.cos(theta) * (radius - 8),
        normY: Math.sin(theta) * (radius - 8),
        r: 11, g: 34, b: 101, a: 1
      });
    }

    // Inner Ring (Brand Blue)
    for (let theta = 0; theta < Math.PI * 2; theta += 0.055) {
      this.logoPoints.push({
        normX: Math.cos(theta) * (radius - 24),
        normY: Math.sin(theta) * (radius - 24),
        r: 29, g: 112, b: 184, a: 1
      });
    }

    // Stars on flanks
    const starLeft = { x: -radius + 14, y: 5 };
    const starRight = { x: radius - 14, y: 5 };
    [starLeft, starRight].forEach((st) => {
      for (let theta = 0; theta < Math.PI * 2; theta += 0.6) {
        this.logoPoints.push({
          normX: st.x + Math.cos(theta) * 6,
          normY: st.y + Math.sin(theta) * 6,
          r: 245, g: 158, b: 11, a: 1
        });
      }
    });

    // Central Chart Bars
    const barColors = [
      { r: 100, g: 116, b: 139 },
      { r: 245, g: 158, b: 11 },
      { r: 249, g: 115, b: 22 },
      { r: 16, g: 185, b: 129 },
      { r: 30, g: 96, b: 208 }
    ];
    const barWidth = 14;
    const barHeights = [35, 55, 75, 95, 110];
    const startX = -50;

    barHeights.forEach((h, i) => {
      const bx = startX + i * (barWidth + 8);
      const col = barColors[i];
      for (let x = bx; x <= bx + barWidth; x += 6) {
        for (let y = 40; y >= 40 - h; y -= 6) {
          this.logoPoints.push({
            normX: x,
            normY: y,
            r: col.r, g: col.g, b: col.b, a: 1
          });
        }
      }
    });

    // Upward Arrow (Gold)
    for (let t = 0; t <= 1; t += 0.04) {
      const ax = -60 + t * 140;
      const ay = 30 - Math.pow(t, 1.4) * 85;
      this.logoPoints.push({
        normX: ax,
        normY: ay,
        r: 245, g: 158, b: 11, a: 1
      });
    }

    // Magnifying Glass
    const mgRadius = 46;
    const mgCenter = { x: -15, y: -5 };
    for (let theta = 0; theta < Math.PI * 2; theta += 0.08) {
      this.logoPoints.push({
        normX: mgCenter.x + Math.cos(theta) * mgRadius,
        normY: mgCenter.y + Math.sin(theta) * mgRadius,
        r: 10, g: 28, b: 64, a: 1
      });
    }
    for (let d = 0; d < 50; d += 5) {
      this.logoPoints.push({
        normX: mgCenter.x - (mgRadius + d) * 0.707,
        normY: mgCenter.y + (mgRadius + d) * 0.707,
        r: 10, g: 28, b: 64, a: 1
      });
    }
  }

  recalculateTargets() {
    const w = this.viewWidth || window.innerWidth;
    const h = this.viewHeight || window.innerHeight;
    const scale = Math.min(w, h) < 600 ? 0.85 : 1.2;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.logoTarget) {
        p.targetX = p.logoTarget.normX * scale;
        p.targetY = p.logoTarget.normY * scale;
      }
    }
  }

  initParticles() {
    this.particles = [];
    this.streamParticles = [];
    const w = this.viewWidth || window.innerWidth;
    const h = this.viewHeight || window.innerHeight;
    const scale = Math.min(w, h) < 600 ? 0.85 : 1.2;

    const tunnelColors = [
      { r: 0, g: 168, b: 232 },
      { r: 30, g: 96, b: 208 },
      { r: 245, g: 158, b: 11 },
      { r: 16, g: 185, b: 129 },
      { r: 249, g: 115, b: 22 }
    ];

    this.logoPoints.forEach((lp, idx) => {
      const theta = Math.random() * Math.PI * 2;
      const radius = 180 + Math.random() * 480;
      const z = Math.random() * 3000 - 1500;
      const startCol = tunnelColors[idx % tunnelColors.length];

      const glyphType = this.GLYPH_TYPES[idx % this.GLYPH_TYPES.length];
      const glyphText = glyphType === 'NUMBER'
        ? this.NUMBERS[idx % this.NUMBERS.length]
        : glyphType === 'CHAR'
        ? this.MATH_CHARS[idx % this.MATH_CHARS.length]
        : '';

      this.particles.push({
        tunnelRadius: radius,
        tunnelTheta: theta,
        tunnelSpeed: 28 + (idx % 14),
        rotSpeed: ((idx % 7) - 3) * 0.003,
        x3d: Math.cos(theta) * radius,
        y3d: Math.sin(theta) * radius,
        z3d: z,

        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2.2 + (idx % 3) * 0.4,

        logoTarget: lp,
        targetX: lp.normX * scale,
        targetY: lp.normY * scale,

        curR: startCol.r,
        curG: startCol.g,
        curB: startCol.b,
        targetR: lp.r,
        targetG: lp.g,
        targetB: lp.b,
        alpha: 1,

        glyphType: glyphType,
        glyphText: glyphText,

        oscFreq: 1.5 + (idx % 5) * 0.2,
        oscPhase: (idx % 10) * 0.6,
        oscAmp: 1.2 + (idx % 3) * 0.4
      });
    });

    // Capped streamers for 60fps efficiency
    for (let i = 0; i < this.MAX_STREAMERS; i++) {
      const theta = (i / this.MAX_STREAMERS) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 180 + Math.random() * 500;
      const glyph = (i % 2 === 0)
        ? this.NUMBERS[i % this.NUMBERS.length]
        : this.MATH_CHARS[i % this.MATH_CHARS.length];

      this.streamParticles.push({
        radius: radius,
        theta: theta,
        z: Math.random() * 2400 - 1000,
        speed: 45 + (i % 15),
        color: tunnelColors[i % tunnelColors.length],
        glyph: glyph
      });
    }
  }

  startLoop() {
    const render = (now) => {
      // Delta time capped at 33ms (min 30fps baseline, smooth 60fps target)
      const dt = Math.min((now - this.lastTime) * 0.001, 0.033);
      this.lastTime = now;
      this.elapsedTime += dt;

      this.update(dt);
      this.draw();

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  update(dt) {
    // Smooth lerp of scroll progress (damping = 0.1)
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.1;

    // Smooth tilt
    this.tilt.x += (this.tilt.targetX - this.tilt.x) * 0.08;
    this.tilt.y += (this.tilt.targetY - this.tilt.y) * 0.08;

    const convergeProgress = Math.max(0, Math.min(1, (this.scrollProgress - 0.12) / 0.73));
    // Fast cubic easing
    const ease = 1 - (1 - convergeProgress) * (1 - convergeProgress) * (1 - convergeProgress);
    const isFullyAssembled = this.scrollProgress >= 0.85;

    // Shockwave pulse
    if (isFullyAssembled && !this.hasShockwaveTriggered) {
      this.shockwave.active = true;
      this.shockwave.radius = 10;
      this.shockwave.alpha = 1;
      this.hasShockwaveTriggered = true;

      const glowRing = document.querySelector('.logo-glow-ring');
      if (glowRing) glowRing.classList.add('active');

      const heroTitle = document.querySelector('.intro-title-reveal');
      if (heroTitle) heroTitle.classList.add('visible');
    } else if (!isFullyAssembled && this.hasShockwaveTriggered) {
      this.hasShockwaveTriggered = false;
      const glowRing = document.querySelector('.logo-glow-ring');
      if (glowRing) glowRing.classList.remove('active');

      const heroTitle = document.querySelector('.intro-title-reveal');
      if (heroTitle) heroTitle.classList.remove('visible');
    }

    if (this.shockwave.active) {
      this.shockwave.radius += this.shockwave.speed * dt;
      this.shockwave.alpha = Math.max(0, 1 - this.shockwave.radius / this.shockwave.maxRadius);
      if (this.shockwave.alpha <= 0) {
        this.shockwave.active = false;
      }
    }

    // Streamers update (only during tunnel)
    if (convergeProgress < 0.95) {
      for (let i = 0; i < this.streamParticles.length; i++) {
        const s = this.streamParticles[i];
        s.z -= s.speed * 60 * dt;
        if (s.z < -this.cameraZ + 10) {
          s.z = 2200;
        }
      }
    }

    const mouseRadiusSq = this.mouse.radius * this.mouse.radius;
    const hasMouse = this.mouse.isOverCanvas && ease > 0.6;
    const mx = this.mouse.x;
    const my = this.mouse.y;

    // Main Particles Update (Highly optimized loop)
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      // Tunnel simulation
      p.z3d -= p.tunnelSpeed * 60 * dt;
      p.tunnelTheta += p.rotSpeed;
      p.x3d = Math.cos(p.tunnelTheta) * p.tunnelRadius;
      p.y3d = Math.sin(p.tunnelTheta) * p.tunnelRadius;

      if (p.z3d < -this.cameraZ + 10) {
        p.z3d = 2000;
      }

      const k = this.fov / (this.cameraZ + p.z3d);
      const tunnelScreenX = p.x3d * k;
      const tunnelScreenY = p.y3d * k;

      // Assembled logo oscillation & tilt
      const oscY = Math.sin(this.elapsedTime * p.oscFreq + p.oscPhase) * p.oscAmp;
      const parallaxX = this.tilt.x * 28 * ease;
      const parallaxY = this.tilt.y * 28 * ease;

      const targetX = p.targetX + parallaxX;
      const targetY = p.targetY + oscY + parallaxY;

      const idealX = tunnelScreenX + (targetX - tunnelScreenX) * ease;
      const idealY = tunnelScreenY + (targetY - tunnelScreenY) * ease;

      // Mouse repulsion using squared distance (skips Math.hypot for 60fps)
      if (hasMouse) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dSq = dx * dx + dy * dy;

        if (dSq < mouseRadiusSq && dSq > 1) {
          const dist = Math.sqrt(dSq);
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const repelStrength = force * 40 * ease;
          p.vx += (dx / dist) * repelStrength;
          p.vy += (dy / dist) * repelStrength;
        }
      }

      // Spring damping physics
      p.vx += (idealX - p.x) * 0.12;
      p.vy += (idealY - p.y) * 0.12;
      p.vx *= 0.8;
      p.vy *= 0.8;

      p.x += p.vx;
      p.y += p.vy;

      // Fast color lerp
      p.curR += (p.targetR - p.curR) * 0.08;
      p.curG += (p.targetG - p.curG) * 0.08;
      p.curB += (p.targetB - p.curB) * 0.08;

      p.projectedSize = Math.max(1.0, p.size * (1 - ease) * (k * 2.2) + p.size * ease);
      p.alpha = Math.min(1, Math.max(0.2, (2000 - p.z3d) / 1800 * (1 - ease) + 1.0 * ease));
    }
  }

  draw() {
    const w = this.viewWidth;
    const h = this.viewHeight;
    const cx = w * 0.5;
    const cy = h * 0.5 + this.logoCenterOffsetY;

    // Fast clear
    this.ctx.fillStyle = '#FAFBFC';
    this.ctx.fillRect(0, 0, w, h);

    // 1. Draw Streamers during tunnel state
    if (this.scrollProgress < 0.8) {
      const streamAlpha = (1 - this.scrollProgress / 0.8) * 0.5;
      this.ctx.font = 'bold 11px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      for (let i = 0; i < this.streamParticles.length; i++) {
        const s = this.streamParticles[i];
        const k = this.fov / (this.cameraZ + s.z);
        const sx = cx + Math.cos(s.theta) * s.radius * k;
        const sy = cy + Math.sin(s.theta) * s.radius * k;

        this.ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${streamAlpha})`;
        this.ctx.fillText(s.glyph, sx, sy);
      }
    }

    // 2. Draw Data Particles (Direct drawing without repeated ctx.save/restore)
    this.ctx.font = 'bold 9px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];
      const px = cx + p.x;
      const py = cy + p.y;
      const r = Math.round(p.curR);
      const g = Math.round(p.curG);
      const b = Math.round(p.curB);
      const colorStr = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;

      switch (p.glyphType) {
        case 'NUMBER':
        case 'CHAR':
          this.ctx.fillStyle = colorStr;
          this.ctx.fillText(p.glyphText, px, py);
          break;

        case 'LINE_GRAPH': {
          const s = p.projectedSize * 1.8;
          this.ctx.strokeStyle = colorStr;
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.moveTo(px - s, py + s * 0.6);
          this.ctx.lineTo(px - s * 0.1, py - s * 0.5);
          this.ctx.lineTo(px + s, py - s * 0.2);
          this.ctx.stroke();

          this.ctx.fillStyle = colorStr;
          this.ctx.beginPath();
          this.ctx.arc(px - s * 0.1, py - s * 0.5, 1.2, 0, 6.28);
          this.ctx.fill();
          break;
        }

        case 'PIE_CHART': {
          const pr = Math.max(2.5, p.projectedSize * 1.3);
          this.ctx.fillStyle = colorStr;
          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.arc(px, py, pr, 0, 4.1);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha * 0.85})`;
          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.arc(px, py, pr, 4.1, 6.28);
          this.ctx.closePath();
          this.ctx.fill();
          break;
        }

        case 'BAR_CHART': {
          const bw = 1.6;
          this.ctx.fillStyle = colorStr;
          this.ctx.fillRect(px - 3.5, py - 1.5, bw, 3.5);
          this.ctx.fillRect(px - 0.8, py - 3.2, bw, 5.2);
          this.ctx.fillRect(px + 1.8, py - 2.2, bw, 4.2);
          break;
        }

        case 'PYRAMID_GRAPH': {
          const s = Math.max(2.8, p.projectedSize * 1.5);
          this.ctx.fillStyle = colorStr;
          this.ctx.beginPath();
          this.ctx.moveTo(px, py - s);
          this.ctx.lineTo(px + s * 0.86, py + s * 0.6);
          this.ctx.lineTo(px - s * 0.86, py + s * 0.6);
          this.ctx.closePath();
          this.ctx.fill();
          break;
        }

        default:
          this.ctx.fillStyle = colorStr;
          this.ctx.beginPath();
          this.ctx.arc(px, py, p.projectedSize, 0, 6.28);
          this.ctx.fill();
          break;
      }
    }

    // 3. Draw Shockwave
    if (this.shockwave.active) {
      this.ctx.strokeStyle = `rgba(0, 168, 232, ${this.shockwave.alpha * 0.85})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, this.shockwave.radius, 0, 6.28);
      this.ctx.stroke();

      this.ctx.strokeStyle = `rgba(245, 158, 11, ${this.shockwave.alpha * 0.55})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, Math.max(0, this.shockwave.radius - 10), 0, 6.28);
      this.ctx.stroke();
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.logoTunnelEngine = new LogoTunnelEngine('logo-tunnel-canvas');
});
