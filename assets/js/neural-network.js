/**
 * Interactive Neural Network Mindmap & Deep Learning Physics Studio
 * Data Analytics Club - IMSUCC Ghaziabad
 * Dark Themed Interactive Neural Graph: Drag Nodes, Fire Synaptic Action Potentials, Reorganize Layers, and Watch Real-Time Deep Learning Dynamics!
 */

class NeuralNetworkStudio {
  constructor() {
    this.canvas = document.getElementById('neural-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.hudInfo = document.getElementById('neural-hud-info');
    this.lossDisplay = document.getElementById('neural-loss-val');
    this.accDisplay = document.getElementById('neural-acc-val');

    // Architecture Structure: Array of layer neuron counts
    this.architecture = [4, 6, 5, 3];
    this.nodes = [];
    this.synapses = [];
    this.pulses = [];
    this.particles = [];

    // Interaction State
    this.draggedNode = null;
    this.hoveredNode = null;
    this.hoveredSynapse = null;
    this.mouse = { x: -9999, y: -9999, isInside: false, isDown: false };

    // Deep Learning Training Simulation Metrics
    this.learningRate = 0.01;
    this.epoch = 1240;
    this.loss = 0.0482;
    this.accuracy = 98.4;
    this.currentPreset = 'mlp';

    this.layerLabels = [
      'Input Layer (Features)',
      'Hidden Layer 1 (ReLU)',
      'Hidden Layer 2 (Latent)',
      'Output Layer (Softmax)'
    ];

    this.nodeDescriptions = [
      ['X₁: Data Variance', 'X₂: Normalized Vector', 'X₃: Feature Embedding', 'X₄: Time Frequency'],
      ['h₁₁: ReLU Active', 'h₁₂: Bias Synapse', 'h₁₃: Dense Node', 'h₁₄: Attention Unit', 'h₁₅: Dropout Reg', 'h₁₆: Latent Filter'],
      ['h₂₁: Bottleneck', 'h₂₂: Feature Rep', 'h₂₃: Dense Tensor', 'h₂₄: Context Vector', 'h₂₅: LayerNorm'],
      ['ŷ₁: Class A (94%)', 'ŷ₂: Class B (4%)', 'ŷ₃: Class C (2%)']
    ];

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.buildNetwork();
    }, { passive: true });

    this.buildNetwork();
    this.bindMouseEvents();
    this.bindControlEvents();
    this.startSimulationLoop();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = container.clientWidth || 1000;
    this.height = Math.max(560, container.clientHeight || 560);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  buildNetwork() {
    this.nodes = [];
    this.synapses = [];
    this.pulses = [];

    const numLayers = this.architecture.length;
    const padX = Math.min(120, this.width * 0.12);
    const availW = this.width - padX * 2;
    const layerSpacing = numLayers > 1 ? availW / (numLayers - 1) : availW;

    // 1. Generate Nodes
    this.architecture.forEach((count, layerIdx) => {
      const x = padX + layerSpacing * layerIdx;
      const padY = 70;
      const availH = this.height - padY * 2;
      const nodeSpacing = count > 1 ? availH / (count + 1) : availH * 0.5;

      const layerColor = layerIdx === 0
        ? '#00a8e8' // Cyan for Input
        : (layerIdx === numLayers - 1
          ? '#10b981' // Emerald for Output
          : (layerIdx === 1 ? '#8b5cf6' : '#f59e0b')); // Purple/Amber for Hidden

      for (let i = 0; i < count; i++) {
        const y = padY + nodeSpacing * (i + 1);
        const label = (this.nodeDescriptions[layerIdx] && this.nodeDescriptions[layerIdx][i])
          ? this.nodeDescriptions[layerIdx][i]
          : `N${layerIdx}_${i + 1}`;

        this.nodes.push({
          id: `L${layerIdx}_N${i}`,
          layer: layerIdx,
          index: i,
          x: x,
          y: y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          radius: layerIdx === 0 || layerIdx === numLayers - 1 ? 16 : 14,
          color: layerColor,
          label: label,
          activation: Math.random() * 0.7 + 0.3,
          bias: (Math.random() * 0.4 - 0.2).toFixed(2),
          firingIntensity: 0
        });
      }
    });

    // 2. Generate Fully Connected Synapses between adjacent layers
    for (let l = 0; l < numLayers - 1; l++) {
      const fromNodes = this.nodes.filter(n => n.layer === l);
      const toNodes = this.nodes.filter(n => n.layer === l + 1);

      fromNodes.forEach(fromNode => {
        toNodes.forEach(toNode => {
          const weight = (Math.random() * 1.8 - 0.9).toFixed(2);
          this.synapses.push({
            id: `${fromNode.id}->${toNode.id}`,
            from: fromNode,
            to: toNode,
            weight: parseFloat(weight),
            gradient: (Math.random() * 0.05 - 0.025).toFixed(4),
            activeSignal: 0
          });
        });
      });
    }

    // Trigger initial forward pulse
    this.fireForwardPropCascade();
  }

  // Fire Action Potential Cascade through layers
  fireForwardPropCascade(startLayer = 0) {
    const layerNodes = this.nodes.filter(n => n.layer === startLayer);

    layerNodes.forEach(node => {
      node.firingIntensity = 1.0;
      this.spawnNodeSparkles(node.x, node.y, node.color);

      // Trigger downstream pulses
      const outSynapses = this.synapses.filter(s => s.from === node);
      outSynapses.forEach((syn, sIdx) => {
        setTimeout(() => {
          this.pulses.push({
            synapse: syn,
            progress: 0,
            speed: Math.random() * 0.015 + 0.02,
            color: node.color
          });
        }, sIdx * 35);
      });
    });

    // Animate Loss / Accuracy Convergence
    this.epoch += 10;
    this.loss = Math.max(0.008, this.loss * 0.985 + (Math.random() * 0.002 - 0.001));
    this.accuracy = Math.min(99.8, this.accuracy + (100 - this.accuracy) * 0.012);

    if (this.lossDisplay) this.lossDisplay.textContent = this.loss.toFixed(4);
    if (this.accDisplay) this.accDisplay.textContent = `${this.accuracy.toFixed(1)}%`;
  }

  bindMouseEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleMouseDown = (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.mouse.isDown = true;

      // Find if clicking any node
      const clicked = this.nodes.find(n => Math.hypot(pos.x - n.x, pos.y - n.y) <= n.radius + 8);
      if (clicked) {
        this.draggedNode = clicked;
        clicked.firingIntensity = 1.0;

        // Propagate impulse from clicked node
        this.fireImpulseFromNode(clicked);
      }
    };

    const handleMouseMove = (e) => {
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.isInside = true;

      if (this.draggedNode) {
        this.draggedNode.x = pos.x;
        this.draggedNode.y = pos.y;
        this.draggedNode.vx = 0;
        this.draggedNode.vy = 0;
      }

      // Check hovered node
      this.hoveredNode = this.nodes.find(n => Math.hypot(pos.x - n.x, pos.y - n.y) <= n.radius + 8) || null;

      // Check hovered synapse
      if (!this.hoveredNode) {
        this.hoveredSynapse = this.synapses.find(s => {
          const dist = this.distToSegment(pos, s.from, s.to);
          return dist < 6;
        }) || null;
      } else {
        this.hoveredSynapse = null;
      }

      this.updateHUD();
    };

    const handleMouseUp = () => {
      this.mouse.isDown = false;
      this.draggedNode = null;
    };

    this.canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.isInside = false;
      this.hoveredNode = null;
      this.hoveredSynapse = null;
      this.updateHUD();
    });

    // Touch Events
    this.canvas.addEventListener('touchstart', handleMouseDown, { passive: false });
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
  }

  fireImpulseFromNode(node) {
    node.firingIntensity = 1.0;
    this.spawnNodeSparkles(node.x, node.y, node.color);

    const outSynapses = this.synapses.filter(s => s.from === node);
    outSynapses.forEach((syn, sIdx) => {
      setTimeout(() => {
        this.pulses.push({
          synapse: syn,
          progress: 0,
          speed: 0.03,
          color: node.color
        });
      }, sIdx * 30);
    });
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  updateHUD() {
    if (!this.hudInfo) return;

    if (this.hoveredNode) {
      const n = this.hoveredNode;
      const layerName = this.layerLabels[n.layer] || `Layer ${n.layer + 1}`;
      this.hudInfo.innerHTML = `
        <span class="text-cyan-400 font-bold">🧠 Neuron [${n.id}]</span> &nbsp;•&nbsp; 
        <span class="text-slate-300 font-medium">${n.label}</span> &nbsp;|&nbsp; 
        <span class="text-amber-400 font-mono">Activation: ${n.activation.toFixed(3)}</span> &nbsp;|&nbsp; 
        <span class="text-emerald-400 font-mono">Bias: ${n.bias}</span> &nbsp;•&nbsp; 
        <span class="text-purple-400 font-mono">${layerName}</span>
      `;
    } else if (this.hoveredSynapse) {
      const s = this.hoveredSynapse;
      this.hudInfo.innerHTML = `
        <span class="text-cyan-400 font-bold">⚡ Synaptic Pathway</span> &nbsp;•&nbsp; 
        <span class="text-slate-300 font-mono">${s.from.id} ➔ ${s.to.id}</span> &nbsp;|&nbsp; 
        <span class="text-amber-400 font-mono font-bold">Weight W: ${s.weight > 0 ? '+' : ''}${s.weight}</span> &nbsp;|&nbsp; 
        <span class="text-emerald-400 font-mono">Gradient ∂L/∂W: ${s.gradient}</span>
      `;
    } else {
      this.hudInfo.innerHTML = `
        <span class="text-slate-400">💡 Drag neurons to stretch topology • Click any neuron to fire synaptic action potentials</span>
      `;
    }
  }

  bindControlEvents() {
    // 1. Fire Synaptic Impulse Button
    const fireBtn = document.getElementById('neural-fire-btn');
    if (fireBtn) {
      fireBtn.addEventListener('click', () => {
        this.fireForwardPropCascade(0);
      });
    }

    // 2. Preset Architecture Switcher
    const presetBtns = document.querySelectorAll('.neural-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.getAttribute('data-preset');
        this.currentPreset = preset;

        if (preset === 'mlp') {
          this.architecture = [4, 6, 5, 3];
          this.layerLabels = ['Input Layer (4)', 'Hidden Layer 1 (6)', 'Hidden Layer 2 (5)', 'Output Layer (3)'];
        } else if (preset === 'autoencoder') {
          this.architecture = [6, 4, 2, 4, 6];
          this.layerLabels = ['Encoder Input (6)', 'Dense Latent (4)', 'Bottleneck Z (2)', 'Decoder Latent (4)', 'Reconstruction (6)'];
        } else if (preset === 'transformer') {
          this.architecture = [4, 8, 8, 4];
          this.layerLabels = ['Query Embeddings (4)', 'Multi-Head Attention (8)', 'FeedForward Tensor (8)', 'Output Logits (4)'];
        } else if (preset === 'cnn') {
          this.architecture = [5, 7, 4, 2];
          this.layerLabels = ['Feature Maps (5)', 'Convolution Filters (7)', 'Fully Connected (4)', 'Softmax Class (2)'];
        }

        this.buildNetwork();
      });
    });

    // 3. Add Neuron to Hidden Layer Button
    const addNeuronBtn = document.getElementById('neural-add-neuron-btn');
    if (addNeuronBtn) {
      addNeuronBtn.addEventListener('click', () => {
        if (this.architecture.length >= 2) {
          const hiddenIdx = Math.floor(this.architecture.length / 2);
          if (this.architecture[hiddenIdx] < 9) {
            this.architecture[hiddenIdx]++;
            this.buildNetwork();
          }
        }
      });
    }

    // 4. Remove Neuron Button
    const removeNeuronBtn = document.getElementById('neural-remove-neuron-btn');
    if (removeNeuronBtn) {
      removeNeuronBtn.addEventListener('click', () => {
        if (this.architecture.length >= 2) {
          const hiddenIdx = Math.floor(this.architecture.length / 2);
          if (this.architecture[hiddenIdx] > 2) {
            this.architecture[hiddenIdx]--;
            this.buildNetwork();
          }
        }
      });
    }

    // 5. Add Hidden Layer Button
    const addLayerBtn = document.getElementById('neural-add-layer-btn');
    if (addLayerBtn) {
      addLayerBtn.addEventListener('click', () => {
        if (this.architecture.length < 6) {
          const insertIdx = this.architecture.length - 1;
          this.architecture.splice(insertIdx, 0, 5);
          this.layerLabels.splice(insertIdx, 0, `Hidden Layer ${insertIdx} (Dense)`);
          this.buildNetwork();
        }
      });
    }

    // 6. Reset Network Layout Button
    const resetBtn = document.getElementById('neural-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.architecture = [4, 6, 5, 3];
        this.buildNetwork();
      });
    }
  }

  spawnNodeSparkles(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1,
        color: color,
        alpha: 1.0
      });
    }
  }

  startSimulationLoop() {
    const loop = (now) => {
      this.updatePhysics();
      this.updatePulses();
      this.updateParticles();
      this.render(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updatePhysics() {
    // Spring physics returning nodes toward their base equilibrium positions
    this.nodes.forEach(node => {
      if (node === this.draggedNode) return;

      const dx = node.baseX - node.x;
      const dy = node.baseY - node.y;
      const spring = 0.04;
      const damping = 0.82;

      node.vx = (node.vx + dx * spring) * damping;
      node.vy = (node.vy + dy * spring) * damping;

      node.x += node.vx;
      node.y += node.vy;

      // Decay firing intensity
      if (node.firingIntensity > 0) {
        node.firingIntensity = Math.max(0, node.firingIntensity - 0.025);
      }
    });
  }

  updatePulses() {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed;

      if (p.progress >= 1.0) {
        // Pulse reached destination node
        const targetNode = p.synapse.to;
        targetNode.firingIntensity = 1.0;

        // Chain forward to next layer
        const nextSynapses = this.synapses.filter(s => s.from === targetNode);
        nextSynapses.forEach(nextSyn => {
          if (Math.random() > 0.4) {
            this.pulses.push({
              synapse: nextSyn,
              progress: 0,
              speed: 0.025,
              color: targetNode.color
            });
          }
        });

        this.pulses.splice(i, 1);
      }
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      pt.alpha -= 0.03;
      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(now = performance.now()) {
    const w = this.width;
    const h = this.height;
    this.ctx.clearRect(0, 0, w, h);

    // 1. Cyber Dark Background with Subtle Coordinate Grid
    this.ctx.fillStyle = '#040812';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(0, 168, 232, 0.04)';
    this.ctx.lineWidth = 1;
    const gridStep = 32;
    for (let x = 0; x < w; x += gridStep) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // 2. Draw Layer Titles and Columns
    const numLayers = this.architecture.length;
    const padX = Math.min(120, this.width * 0.12);
    const availW = this.width - padX * 2;
    const layerSpacing = numLayers > 1 ? availW / (numLayers - 1) : availW;

    this.ctx.font = 'bold 11px Outfit, monospace';
    this.ctx.textAlign = 'center';

    for (let l = 0; l < numLayers; l++) {
      const lx = padX + layerSpacing * l;
      const label = this.layerLabels[l] || `Layer ${l + 1}`;

      // Column Glow Guide
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.beginPath();
      this.ctx.moveTo(lx, 40);
      this.ctx.lineTo(lx, h - 40);
      this.ctx.stroke();

      // Layer Title
      this.ctx.fillStyle = l === 0 ? '#00a8e8' : (l === numLayers - 1 ? '#10b981' : '#94a3b8');
      this.ctx.fillText(label.toUpperCase(), lx, 32);
    }

    // 3. Draw Synapses (Axons & Dendrites)
    this.synapses.forEach(syn => {
      const isHovered = (syn === this.hoveredSynapse);
      const absWeight = Math.abs(syn.weight);
      const isPositive = syn.weight >= 0;

      this.ctx.save();
      if (isHovered) {
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 3.5;
        this.ctx.shadowColor = '#00a8e8';
        this.ctx.shadowBlur = 12;
      } else {
        this.ctx.strokeStyle = isPositive
          ? `rgba(0, 168, 232, ${Math.min(0.7, 0.15 + absWeight * 0.3)})`
          : `rgba(244, 63, 94, ${Math.min(0.6, 0.15 + absWeight * 0.25)})`;
        this.ctx.lineWidth = Math.max(1, absWeight * 2);
      }

      this.ctx.beginPath();
      this.ctx.moveTo(syn.from.x, syn.from.y);
      this.ctx.lineTo(syn.to.x, syn.to.y);
      this.ctx.stroke();
      this.ctx.restore();

      // Ambient Flowing Synaptic Packets
      const ambientT = ((now * 0.0006 + (syn.from.index * 0.2 + syn.to.index * 0.1)) % 1.0);
      const ax = syn.from.x + (syn.to.x - syn.from.x) * ambientT;
      const ay = syn.from.y + (syn.to.y - syn.from.y) * ambientT;

      this.ctx.fillStyle = isPositive ? 'rgba(0, 168, 232, 0.5)' : 'rgba(245, 158, 11, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(ax, ay, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 4. Draw Active Energy Action Potential Pulses
    this.pulses.forEach(p => {
      const s = p.synapse;
      const px = s.from.x + (s.to.x - s.from.x) * p.progress;
      const py = s.from.y + (s.to.y - s.from.y) * p.progress;

      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = p.color || '#00a8e8';
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 5. Draw Neurons (Soma & Nucleus)
    this.nodes.forEach(node => {
      const isHovered = (node === this.hoveredNode);
      const isDragged = (node === this.draggedNode);
      const firing = node.firingIntensity || 0;

      // Outer Halo & Glow
      this.ctx.save();
      if (firing > 0 || isHovered || isDragged) {
        this.ctx.shadowColor = node.color;
        this.ctx.shadowBlur = 24;
        this.ctx.fillStyle = node.color;
        this.ctx.globalAlpha = 0.25 + firing * 0.5;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + 8 + firing * 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      }

      // Main Node Body (Glass Cyber Sphere)
      const grad = this.ctx.createRadialGradient(
        node.x - node.radius * 0.3,
        node.y - node.radius * 0.3,
        node.radius * 0.1,
        node.x,
        node.y,
        node.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, node.color);
      grad.addColorStop(1, '#020617');

      this.ctx.fillStyle = grad;
      this.ctx.strokeStyle = isHovered ? '#ffffff' : node.color;
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Inner Core
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();

      // Node Label
      this.ctx.fillStyle = isHovered ? '#38bdf8' : '#cbd5e1';
      this.ctx.font = '10px Outfit, sans-serif';
      this.ctx.textAlign = node.layer === 0 ? 'right' : (node.layer === this.architecture.length - 1 ? 'left' : 'center');
      const labelOffset = node.layer === 0 ? -node.radius - 8 : (node.layer === this.architecture.length - 1 ? node.radius + 8 : 0);
      const labelY = (node.layer === 0 || node.layer === this.architecture.length - 1) ? node.y + 3 : node.y + node.radius + 14;

      this.ctx.fillText(node.label, node.x + labelOffset, labelY);

      this.ctx.restore();
    });

    // 6. Draw Sparkle Celebration Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.fillStyle = pt.color;
      this.ctx.globalAlpha = pt.alpha;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.neuralStudio = new NeuralNetworkStudio();
});
