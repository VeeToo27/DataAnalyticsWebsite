/**
 * High-Performance Scroll-Driven 3D Data Particle Tunnel & Logo Assembly Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 * Dark Theme Edition: Deep void canvas (#030712) with luminous neon data particles.
 * Extended Time & Scrolling Effort: Takes significant scrolling with smooth cinematic physics (damping 0.032).
 */

class LogoTunnelEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.particles = [];
    this.streamParticles = [];
    this.logoPoints = [];

    // Mobile Check
    this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);

    // Assembly State (0.0 = tunnel flight, 1.0 = fully assembled logo)
    this.assemblyProgress = 0;
    this.targetAssemblyProgress = 0;
    this.logoAssembled = false;

    this.elapsedTime = 0;
    this.lastTime = performance.now();

    this.mouse = { x: -9999, y: -9999, radius: this.isMobile ? 70 : 120, isOverCanvas: false };
    this.tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.cameraZ = 650;
    this.fov = 420;
    this.logoCenterOffsetY = this.isMobile ? -15 : -25;

    // Particle Density for Pure-Particle Logo Formation
    this.MAX_LOGO_PARTICLES = this.isMobile ? 280 : 700;
    this.MAX_STREAMERS = this.isMobile ? 12 : 36;

    // Shockwave State
    this.shockwave = {
      active: false,
      radius: 0,
      maxRadius: this.isMobile ? 220 : 340,
      alpha: 1,
      speed: 420
    };
    this.hasShockwaveTriggered = false;

    // Glyphs
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

    // Logo Image
    this.logoImg = new Image();
    this.logoLoaded = false;
    this.logoImg.src = 'assets/images/club_logo.jpg';

    this.initEvents();
    this.resize();
    this.loadLogo();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);
      this.resize();
      this.recalculateTargets();
    }, { passive: true });

    // 1. WHEEL SCROLL-LOCK INTERCEPTOR (Extended Time & Effort)
    window.addEventListener('wheel', (e) => {
      const atTop = window.scrollY <= 15;

      if (atTop && !this.logoAssembled) {
        if (e.deltaY > 0) {
          // User scrolling down: lock page scroll and advance logo assembly very gradually
          e.preventDefault();
          this.targetAssemblyProgress = Math.min(1.0, this.targetAssemblyProgress + Math.min(0.022, Math.max(0.003, Math.abs(e.deltaY) * 0.00016)));

          if (this.targetAssemblyProgress >= 1.0) {
            this.targetAssemblyProgress = 1.0;
            this.logoAssembled = true;
          }
        } else if (e.deltaY < 0) {
          e.preventDefault();
          this.targetAssemblyProgress = Math.max(0, this.targetAssemblyProgress - 0.02);
        }
      } else if (atTop && this.logoAssembled) {
        // When assembled and at top, scrolling up un-assembles back into tunnel
        if (e.deltaY < -20) {
          this.targetAssemblyProgress = Math.max(0, this.targetAssemblyProgress - 0.02);
          if (this.targetAssemblyProgress < 0.92) {
            this.logoAssembled = false;
          }
        }
      }
    }, { passive: false });

    // 2. TOUCH SCROLL-LOCK INTERCEPTOR (MOBILE)
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const atTop = window.scrollY <= 15;

      if (atTop && !this.logoAssembled && e.touches.length > 0) {
        const dy = touchStartY - e.touches[0].clientY; // Positive = swiping up (scrolling down)
        
        if (dy > 2) {
          e.preventDefault();
          this.targetAssemblyProgress = Math.min(1.0, this.targetAssemblyProgress + dy * 0.00048);
          touchStartY = e.touches[0].clientY;

          if (this.targetAssemblyProgress >= 1.0) {
            this.targetAssemblyProgress = 1.0;
            this.logoAssembled = true;
          }
        } else if (dy < -2) {
          e.preventDefault();
          this.targetAssemblyProgress = Math.max(0, this.targetAssemblyProgress + dy * 0.00048);
          touchStartY = e.touches[0].clientY;
        }
      }
    }, { passive: false });

    // 3. KEYBOARD SCROLL-LOCK (ArrowDown, PageDown, Space)
    window.addEventListener('keydown', (e) => {
      const atTop = window.scrollY <= 15;
      if (atTop && !this.logoAssembled && ['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        this.targetAssemblyProgress = Math.min(1.0, this.targetAssemblyProgress + 0.025);
        if (this.targetAssemblyProgress >= 1.0) {
          this.targetAssemblyProgress = 1.0;
          this.logoAssembled = true;
        }
      }
    });

    // 4. MOUSE MOVE TILT
    window.addEventListener('mousemove', (e) => {
      if (this.isMobile) return;
      const rect = this.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      this.mouse.x = rawX - this.canvas.width / (2 * (this.dpr || 1));
      this.mouse.y = rawY - (this.canvas.height / (2 * (this.dpr || 1)) + this.logoCenterOffsetY);
      this.mouse.isOverCanvas = (rawX >= 0 && rawX <= rect.width && rawY >= 0 && rawY <= rect.height);

      this.tilt.targetX = (e.clientX / window.innerWidth - 0.5) * 0.25;
      this.tilt.targetY = (e.clientY / window.innerHeight - 0.5) * 0.25;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
      this.mouse.isOverCanvas = false;
      this.tilt.targetX = 0;
      this.tilt.targetY = 0;
    });

    // 5. RESET / REPLAY BUTTON
    const replayBtn = document.getElementById('replay-intro-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.targetAssemblyProgress = 0;
        this.assemblyProgress = 0;
        this.logoAssembled = false;
        this.hasShockwaveTriggered = false;

        const glowRing = document.querySelector('.logo-glow-ring');
        if (glowRing) glowRing.classList.remove('active');

        const heroTitle = document.querySelector('.intro-title-reveal');
        if (heroTitle) heroTitle.classList.remove('visible');

        const scrollLabel = document.querySelector('#scroll-cue span');
        if (scrollLabel) scrollLabel.textContent = 'Scroll Down To Assemble Logo';
      });
    }
  }

  resize() {
    this.dpr = this.isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 2);
    this.viewWidth = this.canvas.clientWidth || window.innerWidth;
    this.viewHeight = this.canvas.clientHeight || window.innerHeight;

    this.canvas.width = this.viewWidth * this.dpr;
    this.canvas.height = this.viewHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  loadLogo() {
    this.logoImg.onload = () => {
      this.logoLoaded = true;
      this.sampleLogoPixels();
      this.initParticles();
      this.startLoop();
    };

    this.logoImg.onerror = () => {
      this.generateProceduralLogoPoints();
      this.initParticles();
      this.startLoop();
    };

    if (this.logoImg.complete && this.logoImg.naturalWidth > 0) {
      this.logoLoaded = true;
      this.sampleLogoPixels();
      this.initParticles();
      this.startLoop();
    }
  }

  sampleLogoPixels() {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    const sampleSize = 240;
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
    const step = this.isMobile ? 7 : 4;

    for (let y = 0; y < sampleSize; y += step) {
      for (let x = 0; x < sampleSize; x += step) {
        const idx = (y * sampleSize + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];
        const a = data[idx + 3];

        const isWhite = r > 230 && g > 230 && b > 230;
        const isTransparent = a < 50;

        if (!isWhite && !isTransparent) {
          const normX = (x - sampleSize / 2) * (300 / sampleSize);
          const normY = (y - sampleSize / 2) * (300 / sampleSize);

          // Boost brightness for Dark Theme luminescence
          if (r < 60 && g < 60 && b < 60) {
            // Dark navy turned into electric cyan / blue glow
            r = 0; g = 180; b = 255;
          } else {
            r = Math.min(255, Math.round(r * 1.35 + 20));
            g = Math.min(255, Math.round(g * 1.35 + 20));
            b = Math.min(255, Math.round(b * 1.35 + 20));
          }

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

    if (rawPoints.length > this.MAX_LOGO_PARTICLES) {
      this.logoPoints = [];
      const stride = rawPoints.length / this.MAX_LOGO_PARTICLES;
      for (let i = 0; i < this.MAX_LOGO_PARTICLES; i++) {
        this.logoPoints.push(rawPoints[Math.floor(i * stride)]);
      }
    } else if (rawPoints.length >= 120) {
      this.logoPoints = rawPoints;
    } else {
      this.generateProceduralLogoPoints();
    }
  }

  generateProceduralLogoPoints() {
    this.logoPoints = [];
    const radius = this.isMobile ? 120 : 150;

    // Outer Circle Ring (Neon Cyan)
    for (let theta = 0; theta < Math.PI * 2; theta += (this.isMobile ? 0.09 : 0.05)) {
      this.logoPoints.push({
        normX: Math.cos(theta) * radius,
        normY: Math.sin(theta) * radius,
        r: 0, g: 240, b: 255, a: 1
      });
      this.logoPoints.push({
        normX: Math.cos(theta) * (radius - 8),
        normY: Math.sin(theta) * (radius - 8),
        r: 0, g: 200, b: 255, a: 1
      });
    }

    // Inner Ring (Electric Blue)
    for (let theta = 0; theta < Math.PI * 2; theta += (this.isMobile ? 0.1 : 0.06)) {
      this.logoPoints.push({
        normX: Math.cos(theta) * (radius - 22),
        normY: Math.sin(theta) * (radius - 22),
        r: 59, g: 130, b: 246, a: 1
      });
    }

    // Central Chart Bars (Neon Amber, Orange, Emerald, Blue)
    const barColors = [
      { r: 148, g: 163, b: 184 },
      { r: 251, g: 191, b: 36 },
      { r: 249, g: 115, b: 22 },
      { r: 52, g: 211, b: 153 },
      { r: 0, g: 240, b: 255 }
    ];
    const barWidth = this.isMobile ? 10 : 14;
    const barHeights = [30, 50, 70, 90, 105];
    const startX = this.isMobile ? -40 : -50;

    barHeights.forEach((h, i) => {
      const bx = startX + i * (barWidth + 6);
      const col = barColors[i];
      for (let x = bx; x <= bx + barWidth; x += (this.isMobile ? 7 : 4)) {
        for (let y = 35; y >= 35 - h; y -= (this.isMobile ? 7 : 4)) {
          this.logoPoints.push({
            normX: x,
            normY: y,
            r: col.r, g: col.g, b: col.b, a: 1
          });
        }
      }
    });

    // Upward Arrow (Neon Gold)
    for (let t = 0; t <= 1; t += 0.04) {
      const ax = -50 + t * 120;
      const ay = 25 - Math.pow(t, 1.4) * 75;
      this.logoPoints.push({
        normX: ax,
        normY: ay,
        r: 251, g: 191, b: 36, a: 1
      });
    }
  }

  recalculateTargets() {
    const w = this.viewWidth || window.innerWidth;
    const h = this.viewHeight || window.innerHeight;
    const scale = Math.min(w, h) < 600 ? 0.75 : 1.15;

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
    const scale = Math.min(w, h) < 600 ? 0.75 : 1.15;

    // Dark Theme Neon Glow Palette
    const tunnelColors = [
      { r: 0, g: 240, b: 255 },
      { r: 59, g: 130, b: 246 },
      { r: 251, g: 191, b: 36 },
      { r: 52, g: 211, b: 153 },
      { r: 236, g: 72, b: 153 }
    ];

    this.logoPoints.forEach((lp, idx) => {
      const theta = Math.random() * Math.PI * 2;
      const radius = 160 + Math.random() * 420;
      const z = Math.random() * 2600 - 1300;
      const startCol = tunnelColors[idx % tunnelColors.length];

      const glyphType = this.isMobile ? 'DOT' : this.GLYPH_TYPES[idx % this.GLYPH_TYPES.length];
      const glyphText = glyphType === 'NUMBER'
        ? this.NUMBERS[idx % this.NUMBERS.length]
        : glyphType === 'CHAR'
        ? this.MATH_CHARS[idx % this.MATH_CHARS.length]
        : '';

      this.particles.push({
        tunnelRadius: radius,
        tunnelTheta: theta,
        tunnelSpeed: 20 + (idx % 10),
        rotSpeed: ((idx % 7) - 3) * 0.0018,
        x3d: Math.cos(theta) * radius,
        y3d: Math.sin(theta) * radius,
        z3d: z,

        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: this.isMobile ? 2.0 : (2.2 + (idx % 3) * 0.4),

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

        oscFreq: 1.0 + (idx % 5) * 0.15,
        oscPhase: (idx % 10) * 0.6,
        oscAmp: this.isMobile ? 0.6 : 1.2
      });
    });

    for (let i = 0; i < this.MAX_STREAMERS; i++) {
      const theta = (i / this.MAX_STREAMERS) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 160 + Math.random() * 450;
      const glyph = (i % 2 === 0)
        ? this.NUMBERS[i % this.NUMBERS.length]
        : this.MATH_CHARS[i % this.MATH_CHARS.length];

      this.streamParticles.push({
        radius: radius,
        theta: theta,
        z: Math.random() * 2200 - 900,
        speed: 36 + (i % 10),
        color: tunnelColors[i % tunnelColors.length],
        glyph: glyph
      });
    }
  }

  startLoop() {
    const render = (now) => {
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
    // Ultra-smooth, majestic damping (0.032) for longer, luxurious assembly motion
    this.assemblyProgress += (this.targetAssemblyProgress - this.assemblyProgress) * 0.032;

    this.tilt.x += (this.tilt.targetX - this.tilt.x) * 0.06;
    this.tilt.y += (this.tilt.targetY - this.tilt.y) * 0.06;

    const ease = 1 - Math.pow(1 - this.assemblyProgress, 3);
    const isFullyAssembled = this.assemblyProgress >= 0.92;

    // Update Prompt Cue Text with Multi-Stage Feedback
    const scrollLabel = document.querySelector('#scroll-cue span');
    if (scrollLabel) {
      if (this.assemblyProgress < 0.25) {
        scrollLabel.textContent = 'Scroll Down To Assemble Logo';
      } else if (this.assemblyProgress < 0.65) {
        scrollLabel.textContent = 'Keep Scrolling... Swirling Particles';
      } else if (this.assemblyProgress < 0.90) {
        scrollLabel.textContent = 'Almost Formed... Locking Coordinates';
      } else {
        scrollLabel.textContent = 'Logo Assembled • Scroll Down To Explore ↓';
      }
    }

    // Trigger shockwave pulse on completion
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

    // Streamers update
    if (this.assemblyProgress < 0.9) {
      for (let i = 0; i < this.streamParticles.length; i++) {
        const s = this.streamParticles[i];
        s.z -= s.speed * 60 * dt;
        if (s.z < -this.cameraZ + 10) {
          s.z = 2000;
        }
      }
    }

    const mouseRadiusSq = this.mouse.radius * this.mouse.radius;
    const hasMouse = this.mouse.isOverCanvas && ease > 0.5;
    const mx = this.mouse.x;
    const my = this.mouse.y;

    // Main Particles Update
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      p.z3d -= p.tunnelSpeed * 60 * dt;
      p.tunnelTheta += p.rotSpeed;
      p.x3d = Math.cos(p.tunnelTheta) * p.tunnelRadius;
      p.y3d = Math.sin(p.tunnelTheta) * p.tunnelRadius;

      if (p.z3d < -this.cameraZ + 10) {
        p.z3d = 1800;
      }

      const k = this.fov / (this.cameraZ + p.z3d);
      const tunnelScreenX = p.x3d * k;
      const tunnelScreenY = p.y3d * k;

      const oscY = Math.sin(this.elapsedTime * p.oscFreq + p.oscPhase) * p.oscAmp;
      const parallaxX = this.tilt.x * 20 * ease;
      const parallaxY = this.tilt.y * 20 * ease;

      const targetX = p.targetX + parallaxX;
      const targetY = p.targetY + oscY + parallaxY;

      // Solid locking on assembly completion
      const idealX = (ease >= 0.98) ? targetX : (tunnelScreenX + (targetX - tunnelScreenX) * ease);
      const idealY = (ease >= 0.98) ? targetY : (tunnelScreenY + (targetY - tunnelScreenY) * ease);

      if (hasMouse) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dSq = dx * dx + dy * dy;

        if (dSq < mouseRadiusSq && dSq > 1) {
          const dist = Math.sqrt(dSq);
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const repelStrength = force * 35 * ease;
          p.vx += (dx / dist) * repelStrength;
          p.vy += (dy / dist) * repelStrength;
        }
      }

      p.vx += (idealX - p.x) * 0.12;
      p.vy += (idealY - p.y) * 0.12;
      p.vx *= 0.8;
      p.vy *= 0.8;

      p.x += p.vx;
      p.y += p.vy;

      p.curR += (p.targetR - p.curR) * 0.08;
      p.curG += (p.targetG - p.curG) * 0.08;
      p.curB += (p.targetB - p.curB) * 0.08;

      p.projectedSize = Math.max(1.0, p.size * (1 - ease) * (k * 2.0) + p.size * ease);
      p.alpha = Math.min(1, Math.max(0.3, (1800 - p.z3d) / 1600 * (1 - ease) + 1.0 * ease));
    }
  }

  draw() {
    const w = this.viewWidth;
    const h = this.viewHeight;
    const cx = w * 0.5;
    const cy = h * 0.5 + this.logoCenterOffsetY;

    // Dark Theme Void Background (#030712)
    this.ctx.fillStyle = '#030712';
    this.ctx.fillRect(0, 0, w, h);

    // 1. Draw Streamers during tunnel flight
    if (this.assemblyProgress < 0.7) {
      const streamAlpha = (1 - this.assemblyProgress / 0.7) * 0.6;
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

    // 2. Draw Pure Data Particles Assembled Logo (No Raster Photo)
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

      if (this.isMobile || p.glyphType === 'DOT') {
        this.ctx.fillStyle = colorStr;
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.projectedSize, 0, 6.28);
        this.ctx.fill();
        continue;
      }

      switch (p.glyphType) {
        case 'NUMBER':
        case 'CHAR':
          this.ctx.fillStyle = colorStr;
          this.ctx.fillText(p.glyphText, px, py);
          break;

        case 'LINE_GRAPH': {
          const s = p.projectedSize * 1.6;
          this.ctx.strokeStyle = colorStr;
          this.ctx.lineWidth = 1.3;
          this.ctx.beginPath();
          this.ctx.moveTo(px - s, py + s * 0.5);
          this.ctx.lineTo(px, py - s * 0.4);
          this.ctx.lineTo(px + s, py - s * 0.1);
          this.ctx.stroke();
          break;
        }

        case 'BAR_CHART': {
          this.ctx.fillStyle = colorStr;
          this.ctx.fillRect(px - 3, py - 1.5, 1.6, 3.8);
          this.ctx.fillRect(px - 0.5, py - 3, 1.6, 5.3);
          this.ctx.fillRect(px + 2, py - 2, 1.6, 4.3);
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
      this.ctx.strokeStyle = `rgba(0, 240, 255, ${this.shockwave.alpha * 0.9})`;
      this.ctx.lineWidth = 3.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, this.shockwave.radius, 0, 6.28);
      this.ctx.stroke();

      this.ctx.strokeStyle = `rgba(251, 191, 36, ${this.shockwave.alpha * 0.6})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, Math.max(0, this.shockwave.radius - 12), 0, 6.28);
      this.ctx.stroke();
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.logoTunnelEngine = new LogoTunnelEngine('logo-tunnel-canvas');
});
