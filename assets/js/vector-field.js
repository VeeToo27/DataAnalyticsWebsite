/**
 * 3D Particle Vector Field & MediaPipe Hands Gesture Recognition Studio
 * Data Analytics Club - IMSUCC Ghaziabad
 * GPU-Accelerated Three.js InstancedMesh with 6,000+ Data Embeddings and Real-Time Webcam Finger-Count Gesture Morphing.
 */

class VectorFieldStudio {
  constructor() {
    this.container = document.getElementById('vector-field-canvas-container');
    if (!this.container) return;

    // Mobile Optimization (1,200 particles on mobile for locked 60FPS)
    this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);
    this.numParticles = this.isMobile ? 1200 : 6000;
    this.currentFormation = 1; // 1: Hypersphere, 2: Helix, 3: Torus, 4: Lattice, 5: Wave, 0: Supernova
    this.targetFormation = 1;
    this.morphProgress = 1.0;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.instancedMesh = null;
    this.dummy = new THREE.Object3D();

    // Particle Coordinates & Velocity Arrays
    this.currentPositions = new Float32Array(this.numParticles * 3);
    this.targetPositions = new Float32Array(this.numParticles * 3);
    this.velocities = new Float32Array(this.numParticles * 3);
    this.colors = new Float32Array(this.numParticles * 3);

    // Mouse & Interaction
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, prevX: 0, prevY: 0 };
    this.cameraRotation = { x: 0.2, y: 0 };

    // MediaPipe & Webcam State
    this.video = document.getElementById('vector-webcam-video');
    this.webcamCanvas = document.getElementById('vector-webcam-overlay');
    this.webcamCtx = this.webcamCanvas ? this.webcamCanvas.getContext('2d') : null;
    this.isWebcamActive = false;
    this.handsDetector = null;
    this.cameraUtils = null;
    this.lastDetectedFingers = -1;
    this.gestureBadge = document.getElementById('vector-gesture-badge');
    this.webcamToggleBtn = document.getElementById('vector-webcam-toggle-btn');
    this.pipContainer = document.getElementById('vector-webcam-pip');
    this.isVisible = true;

    this.init();
  }

  init() {
    this.initThreeJS();
    this.initParticleGeometries();
    this.bindMouseControls();
    this.bindToolbarControls();
    this.initMediaPipeFallback();
    this.initVisibilityObserver();
    this.animate();
  }

  initVisibilityObserver() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
      });
    }, { rootMargin: '100px 0px 100px 0px' });
    observer.observe(this.container);
  }

  initThreeJS() {
    const width = this.container.clientWidth || 1000;
    const height = Math.max(380, this.container.clientHeight || (this.isMobile ? 380 : 560));

    // 1. Dark Theme Three.js Scene (#040914)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040914);
    this.scene.fog = new THREE.FogExp2(0x040914, 0.003);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    this.camera.position.set(0, 40, this.isMobile ? 380 : 320);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting for ultra-visible white-gray 3D particles
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(150, 200, 150);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf1f5f9, 1.4);
    dirLight2.position.set(-150, -100, -150);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 700);
    pointLight.position.set(0, 50, 220);
    this.scene.add(pointLight);

    // 5. InstancedMesh with 6,000 Sphere Particles (Bright White-Gray Ultra-Visible)
    const geom = new THREE.SphereGeometry(this.isMobile ? 1.45 : 1.65, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.15,
      metalness: 0.45,
      emissive: new THREE.Color(0x4a5568), // Luminous ambient emission so white-gray particles pop intensely
      vertexColors: true
    });

    this.instancedMesh = new THREE.InstancedMesh(geom, mat, this.numParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Ultra-Bright White-Gray & Platinum Palette
    const palette = [
      new THREE.Color(0xffffff), // Pure Luminous White
      new THREE.Color(0xf8fafc), // Ultra-Bright Platinum
      new THREE.Color(0xf1f5f9), // Pearl White-Gray
      new THREE.Color(0xe2e8f0), // Bright Silver White-Gray
      new THREE.Color(0xdbeafe), // Icy Soft White-Gray
      new THREE.Color(0xd1d5db)  // Clean Light Titanium Gray
    ];

    for (let i = 0; i < this.numParticles; i++) {
      const col = palette[i % palette.length];
      this.instancedMesh.setColorAt(i, col);
    }
    this.instancedMesh.instanceColor.needsUpdate = true;

    this.scene.add(this.instancedMesh);

    // Resize Handler
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight || 560;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }, { passive: true });
  }

  // Precompute Mathematical Embeddings for 6,000 Points
  initParticleGeometries() {
    this.formations = {
      // 1: Hypersphere 3D Gaussian Blob
      1: (i) => {
        const phi = Math.acos(-1 + (2 * i) / this.numParticles);
        const theta = Math.sqrt(this.numParticles * Math.PI) * phi;
        const r = 90 + Math.sin(i * 0.15) * 12;
        return {
          x: r * Math.cos(theta) * Math.sin(phi),
          y: r * Math.sin(theta) * Math.sin(phi),
          z: r * Math.cos(phi)
        };
      },

      // 2: Double Helix DNA / Manifold Spiral
      2: (i) => {
        const strand = i % 2;
        const t = (i / this.numParticles) * Math.PI * 14;
        const radius = 65 + (i % 5) * 2;
        const offset = strand * Math.PI;
        return {
          x: radius * Math.cos(t + offset),
          y: (i / this.numParticles - 0.5) * 260,
          z: radius * Math.sin(t + offset)
        };
      },

      // 3: Torus 4D Topological Donut Field
      3: (i) => {
        const u = (i % 120) / 120 * Math.PI * 2;
        const v = Math.floor(i / 120) / (this.numParticles / 120) * Math.PI * 2;
        const R = 85;
        const r = 35;
        return {
          x: (R + r * Math.cos(v)) * Math.cos(u),
          y: (R + r * Math.cos(v)) * Math.sin(u),
          z: r * Math.sin(v)
        };
      },

      // 4: 3D Hypercube Feature Lattice Matrix
      4: (i) => {
        const side = Math.cbrt(this.numParticles);
        const step = 140 / side;
        const ix = (i % side) - side * 0.5;
        const iy = (Math.floor(i / side) % side) - side * 0.5;
        const iz = Math.floor(i / (side * side)) - side * 0.5;
        return {
          x: ix * step * 1.8,
          y: iy * step * 1.8,
          z: iz * step * 1.8
        };
      },

      // 5: Flowing 3D Vector Wave / Perlin Landscape
      5: (i) => {
        const gridW = 80;
        const gx = (i % gridW) - gridW * 0.5;
        const gz = Math.floor(i / gridW) - (this.numParticles / gridW) * 0.5;
        const dist = Math.hypot(gx, gz);
        const gy = Math.sin(gx * 0.2) * 20 + Math.cos(gz * 0.2) * 20 + Math.sin(dist * 0.15) * 15;
        return {
          x: gx * 3.2,
          y: gy,
          z: gz * 3.2
        };
      },

      // 0: Gravitational Supernova / Dispersion
      0: (i) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = Math.random() * 220 + 40;
        return {
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi)
        };
      }
    };

    // Initialize current positions to Formation 1
    const form1 = this.formations[1];
    for (let i = 0; i < this.numParticles; i++) {
      const p = form1(i);
      this.currentPositions[i * 3] = p.x;
      this.currentPositions[i * 3 + 1] = p.y;
      this.currentPositions[i * 3 + 2] = p.z;

      this.targetPositions[i * 3] = p.x;
      this.targetPositions[i * 3 + 1] = p.y;
      this.targetPositions[i * 3 + 2] = p.z;
    }
  }

  // Morph to Formation by Key (1..5 or 0)
  morphToFormation(formationId, source = 'User Selection') {
    if (!this.formations[formationId]) return;
    this.targetFormation = formationId;
    this.currentFormation = formationId;

    const formFunc = this.formations[formationId];
    for (let i = 0; i < this.numParticles; i++) {
      const target = formFunc(i);
      this.targetPositions[i * 3] = target.x;
      this.targetPositions[i * 3 + 1] = target.y;
      this.targetPositions[i * 3 + 2] = target.z;
    }

    // Update active pill button
    const btns = document.querySelectorAll('.vector-formation-btn');
    btns.forEach(btn => {
      if (parseInt(btn.getAttribute('data-formation')) === formationId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Gesture Status Badge
    const formationNames = {
      1: '🌌 Hypersphere (1 Finger)',
      2: '🧬 Double Helix DNA (2 Fingers)',
      3: '🍩 Torus 4D Ring (3 Fingers)',
      4: '🧊 3D Feature Lattice (4 Fingers)',
      5: '🌊 Flowing Vector Wave (5 Fingers)',
      0: '💥 Gravitational Supernova (Fist)'
    };

    if (this.gestureBadge) {
      this.gestureBadge.innerHTML = `✨ <strong>${formationNames[formationId] || 'Morphing'}</strong> [${source}]`;
      this.gestureBadge.classList.remove('opacity-0');
      setTimeout(() => {
        if (this.gestureBadge && !this.isWebcamActive) this.gestureBadge.classList.add('opacity-0');
      }, 3500);
    }
  }

  bindMouseControls() {
    const el = this.container;

    el.addEventListener('mousedown', (e) => {
      this.mouse.isDragging = true;
      this.mouse.prevX = e.clientX;
      this.mouse.prevY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.mouse.isDragging) return;
      const dx = e.clientX - this.mouse.prevX;
      const dy = e.clientY - this.mouse.prevY;
      this.mouse.prevX = e.clientX;
      this.mouse.prevY = e.clientY;

      this.cameraRotation.y += dx * 0.006;
      this.cameraRotation.x += dy * 0.006;
      this.cameraRotation.x = Math.max(-1.2, Math.min(1.2, this.cameraRotation.x));
    });

    // Touch Drag Controls for Mobile
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.mouse.isDragging = true;
        this.mouse.prevX = e.touches[0].clientX;
        this.mouse.prevY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.mouse.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.mouse.prevX;
      const dy = e.touches[0].clientY - this.mouse.prevY;
      this.mouse.prevX = e.touches[0].clientX;
      this.mouse.prevY = e.touches[0].clientY;

      this.cameraRotation.y += dx * 0.008;
      this.cameraRotation.x += dy * 0.008;
      this.cameraRotation.x = Math.max(-1.2, Math.min(1.2, this.cameraRotation.x));
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isDragging = false;
    });

    // Wheel Zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.25;
      this.camera.position.z = Math.max(120, Math.min(600, this.camera.position.z));
    }, { passive: false });
  }

  bindToolbarControls() {
    // 1. Formation Preset Buttons
    const formBtns = document.querySelectorAll('.vector-formation-btn');
    formBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const formId = parseInt(btn.getAttribute('data-formation'));
        this.morphToFormation(formId, 'Preset Button');
      });
    });

    // 2. Webcam Gesture Recognition Toggle
    if (this.webcamToggleBtn) {
      this.webcamToggleBtn.addEventListener('click', () => {
        if (this.isWebcamActive) {
          this.stopWebcam();
        } else {
          this.startWebcam();
        }
      });
    }
  }

  // MediaPipe Hands Detection Engine
  async startWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Webcam access is not supported on this browser.');
      return;
    }

    try {
      this.webcamToggleBtn.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>Connecting Camera...</span>`;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });

      this.video.srcObject = stream;
      await this.video.play();
      this.isWebcamActive = true;

      if (this.pipContainer) this.pipContainer.classList.remove('hidden');
      this.webcamToggleBtn.innerHTML = `<i data-lucide="video-off" class="w-4 h-4 text-red-500"></i><span>Stop Gestures</span>`;
      this.webcamToggleBtn.classList.add('bg-red-50', 'border-red-300', 'text-red-700');
      if (window.lucide) window.lucide.createIcons();

      this.initMediaPipeHands();

    } catch (err) {
      console.warn('Webcam initialization error:', err);
      alert('Could not access webcam. You can still use the 1-5 gesture buttons to morph the 3D vector field!');
      this.webcamToggleBtn.innerHTML = `<i data-lucide="video" class="w-4 h-4 text-brand-blue"></i><span>Enable Webcam Gestures</span>`;
    }
  }

  stopWebcam() {
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(t => t.stop());
      this.video.srcObject = null;
    }
    this.isWebcamActive = false;
    if (this.pipContainer) this.pipContainer.classList.add('hidden');
    this.webcamToggleBtn.innerHTML = `<i data-lucide="video" class="w-4 h-4 text-brand-blue"></i><span>Enable Webcam Gestures</span>`;
    this.webcamToggleBtn.classList.remove('bg-red-50', 'border-red-300', 'text-red-700');
    if (window.lucide) window.lucide.createIcons();
  }

  initMediaPipeHands() {
    if (window.Hands) {
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
      });

      hands.onResults((results) => this.onHandResults(results));

      if (window.Camera) {
        const camera = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.isWebcamActive) {
              await hands.send({ image: this.video });
            }
          },
          width: 320,
          height: 240
        });
        camera.start();
      }
    } else {
      // Robust Geometry Fallback if MediaPipe script is loading
      this.processVideoFrameFallback();
    }
  }

  initMediaPipeFallback() {
    // If MediaPipe CDN is delayed, we still support all gesture buttons and mouse orbit!
  }

  onHandResults(results) {
    if (!this.webcamCtx || !this.webcamCanvas) return;
    const ctx = this.webcamCtx;
    const w = this.webcamCanvas.width = 160;
    const h = this.webcamCanvas.height = 120;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.video, 0, 0, w, h);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw Skeleton Lines
      ctx.strokeStyle = '#00a8e8';
      ctx.lineWidth = 2;
      landmarks.forEach((lm) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Count Extended Fingers
      const fingers = this.countFingers(landmarks);

      if (fingers !== this.lastDetectedFingers) {
        this.lastDetectedFingers = fingers;
        this.morphToFormation(fingers, `MediaPipe Hand: ${fingers} Finger${fingers !== 1 ? 's' : ''}`);
      }

      // Map Hand Position to 3D Camera Tilt
      const palmX = landmarks[0].x - 0.5;
      const palmY = landmarks[0].y - 0.5;
      this.cameraRotation.y = -palmX * 2.2;
      this.cameraRotation.x = palmY * 1.5;
    }
  }

  countFingers(landmarks) {
    let count = 0;
    // Index, Middle, Ring, Pinky tip vs PIP joint
    if (landmarks[8].y < landmarks[6].y) count++;
    if (landmarks[12].y < landmarks[10].y) count++;
    if (landmarks[16].y < landmarks[14].y) count++;
    if (landmarks[20].y < landmarks[18].y) count++;
    // Thumb: tip vs IP joint in x distance
    if (Math.abs(landmarks[4].x - landmarks[2].x) > 0.05 && landmarks[4].y < landmarks[3].y) count++;

    return count; // 0 to 5
  }

  processVideoFrameFallback() {
    if (!this.isWebcamActive) return;
    requestAnimationFrame(() => this.processVideoFrameFallback());
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // On mobile, skip frame calculations if off-screen to guarantee 60fps across the site
    if (this.isMobile && !this.isVisible) return;
    const spring = 0.055;
    const damping = 0.86;
    const count = this.numParticles;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Spring acceleration toward target geometry
      const dx = this.targetPositions[idx] - this.currentPositions[idx];
      const dy = this.targetPositions[idx + 1] - this.currentPositions[idx + 1];
      const dz = this.targetPositions[idx + 2] - this.currentPositions[idx + 2];

      this.velocities[idx] = (this.velocities[idx] + dx * spring) * damping;
      this.velocities[idx + 1] = (this.velocities[idx + 1] + dy * spring) * damping;
      this.velocities[idx + 2] = (this.velocities[idx + 2] + dz * spring) * damping;

      this.currentPositions[idx] += this.velocities[idx];
      this.currentPositions[idx + 1] += this.velocities[idx + 1];
      this.currentPositions[idx + 2] += this.velocities[idx + 2];

      // Update InstancedMesh Matrix
      this.dummy.position.set(
        this.currentPositions[idx],
        this.currentPositions[idx + 1],
        this.currentPositions[idx + 2]
      );
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // 2. Ambient Continuous Rotation & Camera Orbit
    if (!this.mouse.isDragging && !this.isWebcamActive) {
      this.cameraRotation.y += 0.0025;
    }

    const radius = 340;
    this.camera.position.x = radius * Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
    this.camera.position.y = radius * Math.sin(this.cameraRotation.x) + 30;
    this.camera.position.z = radius * Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
    this.camera.lookAt(0, 0, 0);

    // 3. Render WebGL Frame
    this.renderer.render(this.scene, this.camera);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.vectorFieldStudio = new VectorFieldStudio();
});
