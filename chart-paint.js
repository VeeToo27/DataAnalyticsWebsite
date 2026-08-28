/**
 * Interactive MS Paint-Style Chart Drawing Canvas & Accurate Calibration Studio
 * Data Analytics Club - IMSUCC Ghaziabad
 * Features: Calibrated X/Y Axes Drawing, Auto-Snapping Charts, Editable Pie Chart Figures, Live Flowing Pulses, Breathing Nodes, HUD Crosshair, and Particle Bursts.
 */

class ChartPaintStudio {
  constructor() {
    this.canvas = document.getElementById('paint-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.statusBadge = document.getElementById('paint-status-badge');
    this.hudElement = document.getElementById('paint-hud-coords');
    this.pieEditorModal = document.getElementById('paint-pie-editor-modal');

    // Tool State
    this.currentTool = 'axis'; // 'axis', 'bar', 'line', 'pie', 'pen', 'text', 'eraser'
    this.currentColor = '#1e60d0';
    this.brushSize = 3;
    this.isDrawing = false;

    // Mouse & HUD State
    this.mouse = { x: -9999, y: -9999, isInside: false };

    // Axis Calibration Scale
    this.axisYMax = 500;
    this.axisXLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    // Drawing Data & History
    this.currentStroke = [];
    this.freehandStrokes = [];
    this.perfectedObjects = [];
    this.undoStack = [];
    this.redoStack = [];

    // Active Selected Pie for Live Editing
    this.activePieObject = null;

    // Active Morphing Animations & Particle Bursts
    this.morphingObjects = [];
    this.particles = [];

    this.colorPalette = [
      '#1e60d0', '#00a8e8', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#0f172a'
    ];

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.redrawAll();
    }, { passive: true });

    this.bindMouseEvents();
    this.bindToolbarEvents();
    this.bindPieEditorEvents();
    this.loadSampleCoordinatedChart();
    this.startRenderLoop();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = container.clientWidth || 950;
    this.height = Math.max(540, container.clientHeight || 540);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  loadSampleCoordinatedChart() {
    // 1. Calibrated X/Y Axis System
    const originX = 100;
    const originY = 440;
    const axisW = 420;
    const axisH = 340;

    this.perfectedObjects.push({
      type: 'axis',
      x: originX,
      y: originY,
      w: axisW,
      h: axisH,
      yMax: 500,
      yTicks: 5,
      xLabels: ['Q1', 'Q2', 'Q3', 'Q4', 'Target'],
      yTitle: 'Performance Score (Y)',
      xTitle: 'Academic Milestones (X)',
      color: '#334155',
      alpha: 1.0
    });

    // 2. Calibrated Bars inside Axis
    this.perfectedObjects.push({
      type: 'bar',
      x: 140,
      y: originY - (340 / 500) * axisH,
      w: 55,
      h: (340 / 500) * axisH,
      color: '#1e60d0',
      label: 'Q1',
      value: 340,
      alpha: 1.0
    });

    this.perfectedObjects.push({
      type: 'bar',
      x: 220,
      y: originY - (460 / 500) * axisH,
      w: 55,
      h: (460 / 500) * axisH,
      color: '#00a8e8',
      label: 'Q2',
      value: 460,
      alpha: 1.0
    });

    this.perfectedObjects.push({
      type: 'bar',
      x: 300,
      y: originY - (410 / 500) * axisH,
      w: 55,
      h: (410 / 500) * axisH,
      color: '#10b981',
      label: 'Q3',
      value: 410,
      alpha: 1.0
    });

    // 3. Calibrated Spline Line Curve Across Axis
    this.perfectedObjects.push({
      type: 'line',
      points: [
        { x: 167, y: originY - (340 / 500) * axisH, val: 340 },
        { x: 247, y: originY - (460 / 500) * axisH, val: 460 },
        { x: 327, y: originY - (410 / 500) * axisH, val: 410 },
        { x: 407, y: originY - (490 / 500) * axisH, val: 490 }
      ],
      color: '#f59e0b',
      alpha: 1.0
    });

    // 4. Sample Donut Chart with Editable Figures
    const samplePie = {
      type: 'pie',
      cx: 740,
      cy: 260,
      radius: 95,
      slices: [
        { label: 'Machine Learning', value: 45, color: '#1e60d0' },
        { label: 'Big Data & SQL', value: 30, color: '#00a8e8' },
        { label: 'Data Visualization', value: 25, color: '#10b981' }
      ],
      alpha: 1.0
    };
    this.perfectedObjects.push(samplePie);
    this.activePieObject = samplePie;

    // 5. Stat Callout Tag
    this.perfectedObjects.push({
      type: 'stat_badge',
      x: 640,
      y: 415,
      title: 'ACTIVE STUDENTS',
      value: '+142% MoM',
      color: '#10b981',
      alpha: 1.0
    });
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

    const startDraw = (e) => {
      e.preventDefault();
      const pos = getPos(e);

      // Check if clicking on an existing Pie Chart to edit its figures
      const clickedPie = this.perfectedObjects.find(obj =>
        obj.type === 'pie' && Math.hypot(pos.x - obj.cx, pos.y - obj.cy) <= obj.radius + 15
      );

      if (clickedPie && this.currentTool !== 'eraser') {
        this.openPieFigureEditor(clickedPie);
        return;
      }

      this.isDrawing = true;
      this.currentStroke = [{ x: pos.x, y: pos.y }];

      if (this.currentTool === 'text') {
        const text = prompt('Enter annotation or metric label:', 'KPI Target: 500+');
        if (text) {
          this.saveStateForUndo();
          this.perfectedObjects.push({
            type: 'text',
            x: pos.x,
            y: pos.y,
            text: text,
            color: this.currentColor,
            alpha: 1.0
          });
          this.spawnSparkleParticles(pos.x, pos.y, this.currentColor);
          this.showToast('💬 Placed annotation on canvas!');
        }
        this.isDrawing = false;
      }
    };

    const drawMove = (e) => {
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.isInside = true;
      this.updateHUD(pos);

      if (!this.isDrawing) return;
      e.preventDefault();
      this.currentStroke.push({ x: pos.x, y: pos.y });

      this.redrawAll();
      this.drawActiveStroke();
    };

    const endDraw = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      if (this.currentStroke.length > 2) {
        this.saveStateForUndo();
        this.processCompletedStroke();
      }
      this.currentStroke = [];
    };

    this.canvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', drawMove);
    window.addEventListener('mouseup', endDraw);

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.isInside = false;
      if (this.hudElement) this.hudElement.textContent = 'Cursor: Canvas Viewport Ready';
    });

    // Touch Events
    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    window.addEventListener('touchmove', drawMove, { passive: false });
    window.addEventListener('touchend', endDraw);
  }

  updateHUD(pos) {
    if (!this.hudElement) return;

    // Check if hovering over pie chart
    const hoveredPie = this.perfectedObjects.find(obj =>
      obj.type === 'pie' && Math.hypot(pos.x - obj.cx, pos.y - obj.cy) <= obj.radius + 15
    );

    if (hoveredPie) {
      this.hudElement.innerHTML = `🥧 <span class="text-amber-600 font-bold">Pie Chart</span> &nbsp;[<span class="text-brand-blue font-bold">Click to edit figures & percentages</span>]`;
      return;
    }

    const activeAxis = this.perfectedObjects.find(obj =>
      obj.type === 'axis' &&
      pos.x >= obj.x && pos.x <= obj.x + obj.w &&
      pos.y <= obj.y && pos.y >= obj.y - obj.h
    );

    if (activeAxis) {
      const normY = 1 - (pos.y - (activeAxis.y - activeAxis.h)) / activeAxis.h;
      const dataVal = Math.round(normY * activeAxis.yMax);
      this.hudElement.innerHTML = `📍 <span class="text-brand-blue font-bold">X: ${Math.round(pos.x)}px</span> | <span class="text-emerald-600 font-bold">Y: ${Math.round(pos.y)}px</span> &nbsp;[<span class="text-amber-600 font-bold">Calibrated Y: ${dataVal} / ${activeAxis.yMax}</span>]`;
    } else {
      this.hudElement.innerHTML = `📍 <span class="text-slate-700 font-bold">X: ${Math.round(pos.x)}px</span> | <span class="text-slate-700 font-bold">Y: ${Math.round(pos.y)}px</span>`;
    }
  }

  saveStateForUndo() {
    this.undoStack.push({
      freehand: JSON.parse(JSON.stringify(this.freehandStrokes)),
      perfected: JSON.parse(JSON.stringify(this.perfectedObjects))
    });
    this.redoStack = [];
  }

  // AI Smart Auto-Snap & Calibrated Fix Processor
  processCompletedStroke() {
    const stroke = this.currentStroke;
    const tool = this.currentTool;

    if (tool === 'pen') {
      this.freehandStrokes.push({
        points: stroke,
        color: this.currentColor,
        size: this.brushSize
      });
      return;
    }

    if (tool === 'eraser') {
      const lastPt = stroke[stroke.length - 1];
      const r = this.brushSize * 5;

      this.freehandStrokes = this.freehandStrokes.filter(s => {
        return !s.points.some(p => Math.hypot(p.x - lastPt.x, p.y - lastPt.y) < r);
      });

      this.perfectedObjects = this.perfectedObjects.filter(obj => {
        if (obj.type === 'bar') {
          return !(lastPt.x >= obj.x - r && lastPt.x <= obj.x + obj.w + r && lastPt.y >= obj.y - r && lastPt.y <= obj.y + obj.h + r);
        } else if (obj.type === 'pie') {
          return Math.hypot(lastPt.x - obj.cx, lastPt.y - obj.cy) > obj.radius + r;
        } else if (obj.type === 'axis') {
          return !(lastPt.x >= obj.x - r && lastPt.x <= obj.x + obj.w + r && lastPt.y <= obj.y + r && lastPt.y >= obj.y - obj.h - r);
        } else if (obj.type === 'line') {
          return !obj.points.some(p => Math.hypot(p.x - lastPt.x, p.y - lastPt.y) < r);
        }
        return true;
      });

      this.redrawAll();
      return;
    }

    const bbox = this.computeBoundingBox(stroke);
    const width = Math.max(40, bbox.maxX - bbox.minX);
    const height = Math.max(40, bbox.maxY - bbox.minY);

    if (tool === 'axis') {
      const originX = bbox.minX;
      const originY = bbox.maxY;
      this.morphStrokeIntoAxis(stroke, originX, originY, width, height);
      this.showToast('📏 Auto-Calibrated: Pristine X/Y Cartesian Coordinate System Created!');
      return;
    }

    const parentAxis = this.perfectedObjects.find(obj =>
      obj.type === 'axis' &&
      bbox.minX >= obj.x - 20 && bbox.maxX <= obj.x + obj.w + 40 &&
      bbox.maxY <= obj.y + 30 && bbox.minY >= obj.y - obj.h - 30
    );

    if (tool === 'bar') {
      let targetX = bbox.minX;
      let targetY = bbox.minY;
      let targetW = width;
      let targetH = height;
      let value = Math.round(targetH * 2.5);

      if (parentAxis) {
        targetY = Math.max(parentAxis.y - parentAxis.h, bbox.minY);
        targetH = parentAxis.y - targetY;
        const normH = targetH / parentAxis.h;
        value = Math.round(normH * parentAxis.yMax);
      }

      this.morphStrokeIntoBar(stroke, targetX, targetY, targetW, targetH, value);
      this.showToast(`📊 Auto-Snapped Bar to Value: ${value}!`);

    } else if (tool === 'line') {
      this.morphStrokeIntoLine(stroke, bbox, parentAxis);
      this.showToast('📈 Auto-Smoothed Spline Curve with Flowing Energy Pulses!');

    } else if (tool === 'pie') {
      const cx = bbox.minX + width * 0.5;
      const cy = bbox.minY + height * 0.5;
      const radius = Math.max(width, height) * 0.5;
      const newPie = this.morphStrokeIntoPie(stroke, cx, cy, radius);
      this.showToast('🥧 Auto-Calibrated Radial Donut Chart! Click it to edit figures.');
      setTimeout(() => {
        this.openPieFigureEditor(newPie);
      }, 700);
    }
  }

  computeBoundingBox(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY };
  }

  // 1. MORPH STROKE INTO ACCURATE X/Y AXIS
  morphStrokeIntoAxis(stroke, originX, originY, w, h) {
    const axisObj = {
      type: 'axis',
      x: originX,
      y: originY,
      w: w,
      h: h,
      yMax: this.axisYMax,
      yTicks: 5,
      xLabels: this.axisXLabels,
      yTitle: 'Performance Scale (Y)',
      xTitle: 'Categories / Timeline (X)',
      color: '#334155',
      alpha: 0
    };

    this.morphingObjects.push({
      fromStroke: stroke,
      targetObj: axisObj,
      startTime: performance.now(),
      duration: 650
    });

    this.spawnShockwaveRing(originX, originY, '#1e60d0');
    this.spawnSparkleParticles(originX, originY, '#1e60d0');
  }

  // 2. MORPH STROKE INTO CLEAN BAR
  morphStrokeIntoBar(stroke, targetX, targetY, targetW, targetH, value) {
    const barObj = {
      type: 'bar',
      x: targetX,
      y: targetY,
      w: targetW,
      h: targetH,
      color: this.currentColor,
      label: `Metric ${this.perfectedObjects.length + 1}`,
      value: value,
      alpha: 0
    };

    this.morphingObjects.push({
      fromStroke: stroke,
      targetObj: barObj,
      startTime: performance.now(),
      duration: 650
    });

    this.spawnSparkleParticles(targetX + targetW * 0.5, targetY + targetH * 0.5, this.currentColor);
  }

  // 3. MORPH STROKE INTO SMOOTHED LINE
  morphStrokeIntoLine(stroke, bbox, parentAxis) {
    const step = Math.max(1, Math.floor(stroke.length / 5));
    const cleanPoints = [];

    for (let i = 0; i < stroke.length; i += step) {
      let val = Math.round(450 - stroke[i].y);
      if (parentAxis) {
        const normY = 1 - (stroke[i].y - (parentAxis.y - parentAxis.h)) / parentAxis.h;
        val = Math.round(normY * parentAxis.yMax);
      }
      cleanPoints.push({ x: stroke[i].x, y: stroke[i].y, val: val });
    }

    const lastPt = stroke[stroke.length - 1];
    cleanPoints.push({ x: lastPt.x, y: lastPt.y, val: Math.round(450 - lastPt.y) });

    const lineObj = {
      type: 'line',
      points: cleanPoints,
      color: this.currentColor,
      alpha: 0
    };

    this.morphingObjects.push({
      fromStroke: stroke,
      targetObj: lineObj,
      startTime: performance.now(),
      duration: 650
    });

    this.spawnSparkleParticles((bbox.minX + bbox.maxX) * 0.5, (bbox.minY + bbox.maxY) * 0.5, this.currentColor);
  }

  // 4. MORPH STROKE INTO DONUT CHART
  morphStrokeIntoPie(stroke, cx, cy, radius) {
    const pieObj = {
      type: 'pie',
      cx: cx,
      cy: cy,
      radius: radius,
      slices: [
        { label: 'Category A', value: 45, color: this.currentColor },
        { label: 'Category B', value: 30, color: '#00a8e8' },
        { label: 'Category C', value: 25, color: '#f59e0b' }
      ],
      alpha: 0
    };

    this.morphingObjects.push({
      fromStroke: stroke,
      targetObj: pieObj,
      startTime: performance.now(),
      duration: 650
    });

    this.activePieObject = pieObj;
    this.spawnShockwaveRing(cx, cy, this.currentColor);
    this.spawnSparkleParticles(cx, cy, this.currentColor);
    return pieObj;
  }

  // PIE CHART FIGURE EDITOR (Interactive Modal / Inspector)
  openPieFigureEditor(pieObj) {
    if (!pieObj || pieObj.type !== 'pie') return;
    this.activePieObject = pieObj;

    const modal = this.pieEditorModal;
    const slicesContainer = document.getElementById('paint-pie-slices-container');
    if (!modal || !slicesContainer) return;

    this.renderPieEditorSlices();
    modal.classList.remove('hidden');
  }

  renderPieEditorSlices() {
    const pie = this.activePieObject;
    const slicesContainer = document.getElementById('paint-pie-slices-container');
    if (!pie || !slicesContainer) return;

    const totalVal = pie.slices.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0) || 1;

    let html = '';
    pie.slices.forEach((slice, idx) => {
      const pct = Math.round(((parseFloat(slice.value) || 0) / totalVal) * 100);
      html += `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200" data-slice-idx="${idx}">
          <input type="color" class="w-7 h-7 rounded border border-slate-300 cursor-pointer slice-color-input" value="${slice.color}">
          <input type="text" class="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 slice-label-input" value="${slice.label}" placeholder="Label">
          <div class="flex items-center gap-1">
            <input type="number" class="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 slice-val-input" value="${slice.value}" min="1">
            <span class="text-xs font-mono font-bold text-brand-blue w-9 text-right">${pct}%</span>
          </div>
          ${pie.slices.length > 1 ? `
            <button class="text-slate-400 hover:text-red-500 p-1 delete-slice-btn" title="Remove slice" data-slice-idx="${idx}">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>
      `;
    });

    slicesContainer.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    // Update total counter in dialog
    const totalDisplay = document.getElementById('paint-pie-total-display');
    if (totalDisplay) {
      totalDisplay.textContent = `Total Weight: ${Math.round(totalVal)} (100%)`;
    }
  }

  bindPieEditorEvents() {
    const modal = this.pieEditorModal;
    if (!modal) return;

    // Live Figure & Label Editing in Modal
    modal.addEventListener('input', (e) => {
      const target = e.target;
      const row = target.closest('[data-slice-idx]');
      if (!row || !this.activePieObject) return;

      const idx = parseInt(row.getAttribute('data-slice-idx'));
      const slice = this.activePieObject.slices[idx];
      if (!slice) return;

      if (target.classList.contains('slice-label-input')) {
        slice.label = target.value;
      } else if (target.classList.contains('slice-val-input')) {
        slice.value = Math.max(1, parseFloat(target.value) || 1);
      } else if (target.classList.contains('slice-color-input')) {
        slice.color = target.value;
      }

      this.renderPieEditorSlices();
      this.redrawAll();
    });

    // Delete Slice Button
    modal.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.delete-slice-btn');
      if (delBtn && this.activePieObject && this.activePieObject.slices.length > 1) {
        const idx = parseInt(delBtn.getAttribute('data-slice-idx'));
        this.activePieObject.slices.splice(idx, 1);
        this.renderPieEditorSlices();
        this.redrawAll();
      }
    });

    // Add New Slice Button
    const addSliceBtn = document.getElementById('paint-pie-add-slice-btn');
    if (addSliceBtn) {
      addSliceBtn.addEventListener('click', () => {
        if (!this.activePieObject) return;
        const count = this.activePieObject.slices.length + 1;
        const color = this.colorPalette[(count - 1) % this.colorPalette.length];
        this.activePieObject.slices.push({
          label: `Category ${String.fromCharCode(64 + count)}`,
          value: 25,
          color: color
        });
        this.renderPieEditorSlices();
        this.redrawAll();
      });
    }

    // Apply & Close Button
    const applyBtn = document.getElementById('paint-pie-apply-btn');
    const closeBtn = document.getElementById('paint-pie-close-btn');

    const closeModal = () => {
      modal.classList.add('hidden');
      if (this.activePieObject) {
        this.spawnShockwaveRing(this.activePieObject.cx, this.activePieObject.cy, '#10b981');
        this.spawnSparkleParticles(this.activePieObject.cx, this.activePieObject.cy, '#10b981');
        this.showToast('✨ Pie Chart figures updated and calibrated!');
      }
    };

    if (applyBtn) applyBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  spawnShockwaveRing(x, y, color) {
    this.particles.push({
      isShockwave: true,
      x: x,
      y: y,
      radius: 5,
      maxRadius: 120,
      color: color,
      alpha: 1.0
    });
  }

  spawnSparkleParticles(x, y, color) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color: Math.random() > 0.4 ? color : '#f59e0b',
        alpha: 1.0
      });
    }
  }

  bindToolbarEvents() {
    // 1. Tool Selection Buttons
    const toolBtns = document.querySelectorAll('.paint-tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.getAttribute('data-tool');
      });
    });

    // 2. Color Palette Buttons
    const colorChips = document.querySelectorAll('.paint-color-chip');
    colorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        colorChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentColor = chip.getAttribute('data-color');
      });
    });

    // 3. Edit Pie Figures Button in Toolbar
    const editPieBtn = document.getElementById('paint-edit-pie-btn');
    if (editPieBtn) {
      editPieBtn.addEventListener('click', () => {
        let pie = this.activePieObject;
        if (!pie || pie.type !== 'pie') {
          pie = this.perfectedObjects.find(obj => obj.type === 'pie');
        }
        if (pie) {
          this.openPieFigureEditor(pie);
        } else {
          this.showToast('Draw a pie chart first or add one from stencils!');
        }
      });
    }

    // 4. Quick Stencils / Preset Generators
    const addAxisBtn = document.getElementById('paint-stencil-axis-btn');
    if (addAxisBtn) {
      addAxisBtn.addEventListener('click', () => {
        this.saveStateForUndo();
        this.perfectedObjects.push({
          type: 'axis',
          x: 120,
          y: 440,
          w: 440,
          h: 320,
          yMax: 500,
          yTicks: 5,
          xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          yTitle: 'Values (Y)',
          xTitle: 'Timeline (X)',
          color: '#334155',
          alpha: 1.0
        });
        this.spawnShockwaveRing(120, 440, '#1e60d0');
        this.showToast('📏 Added Calibrated X/Y Axis Frame!');
      });
    }

    const addTrendBtn = document.getElementById('paint-stencil-trend-btn');
    if (addTrendBtn) {
      addTrendBtn.addEventListener('click', () => {
        this.saveStateForUndo();
        this.perfectedObjects.push({
          type: 'trendline',
          x1: 140,
          y1: 380,
          x2: 520,
          y2: 160,
          label: 'Linear Trendline (R² = 0.94)',
          color: '#f59e0b',
          alpha: 1.0
        });
        this.showToast('📈 Added Linear Regression Trendline!');
      });
    }

    const addStatBtn = document.getElementById('paint-stencil-stat-btn');
    if (addStatBtn) {
      addStatBtn.addEventListener('click', () => {
        this.saveStateForUndo();
        this.perfectedObjects.push({
          type: 'stat_badge',
          x: Math.random() * (this.width - 240) + 60,
          y: Math.random() * (this.height - 180) + 60,
          title: 'ACTIVE STUDENTS',
          value: '420+ Enrolled',
          color: this.currentColor,
          alpha: 1.0
        });
        this.showToast('🏷️ Added Stat Callout Badge!');
      });
    }

    // 5. Brush Size Slider
    const sizeSlider = document.getElementById('paint-size-slider');
    const sizeLabel = document.getElementById('paint-size-val');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value);
        if (sizeLabel) sizeLabel.textContent = `${this.brushSize}px`;
      });
    }

    // 6. Undo Button
    const undoBtn = document.getElementById('paint-undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (this.undoStack.length > 0) {
          const state = this.undoStack.pop();
          this.redoStack.push({
            freehand: JSON.parse(JSON.stringify(this.freehandStrokes)),
            perfected: JSON.parse(JSON.stringify(this.perfectedObjects))
          });
          this.freehandStrokes = state.freehand;
          this.perfectedObjects = state.perfected;
          this.redrawAll();
        }
      });
    }

    // 7. Redo Button
    const redoBtn = document.getElementById('paint-redo-btn');
    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        if (this.redoStack.length > 0) {
          const state = this.redoStack.pop();
          this.undoStack.push({
            freehand: JSON.parse(JSON.stringify(this.freehandStrokes)),
            perfected: JSON.parse(JSON.stringify(this.perfectedObjects))
          });
          this.freehandStrokes = state.freehand;
          this.perfectedObjects = state.perfected;
          this.redrawAll();
        }
      });
    }

    // 8. Auto-Fix All Freehand Sketches Button
    const autoFixBtn = document.getElementById('paint-autofix-btn');
    if (autoFixBtn) {
      autoFixBtn.addEventListener('click', () => {
        if (this.freehandStrokes.length === 0) {
          this.showToast('Draw some rough strokes on the canvas first!');
          return;
        }
        this.saveStateForUndo();

        this.freehandStrokes.forEach((stroke) => {
          const bbox = this.computeBoundingBox(stroke.points);
          const w = Math.max(40, bbox.maxX - bbox.minX);
          const h = Math.max(40, bbox.maxY - bbox.minY);

          if (w / h > 2.2) {
            this.morphStrokeIntoLine(stroke.points, bbox);
          } else if (Math.abs(w - h) < 30) {
            this.morphStrokeIntoPie(stroke.points, bbox.minX + w * 0.5, bbox.minY + h * 0.5, Math.max(w, h) * 0.5);
          } else {
            this.morphStrokeIntoBar(stroke.points, bbox.minX, bbox.minY, w, h, Math.round(h * 2.5));
          }
        });

        this.freehandStrokes = [];
        this.showToast('✨ Auto-Fixed all freehand drawings into clean charts!');
      });
    }

    // 9. Clear Canvas Button
    const clearBtn = document.getElementById('paint-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.saveStateForUndo();
        this.freehandStrokes = [];
        this.perfectedObjects = [];
        this.redrawAll();
        this.showToast('Canvas cleared.');
      });
    }

    // 10. Download / Export PNG Button
    const exportBtn = document.getElementById('paint-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `data_analytics_sketch_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
      });
    }
  }

  showToast(msg) {
    if (!this.statusBadge) return;
    this.statusBadge.innerHTML = msg;
    this.statusBadge.classList.remove('opacity-0');
    setTimeout(() => {
      if (this.statusBadge) this.statusBadge.classList.add('opacity-0');
    }, 2800);
  }

  startRenderLoop() {
    const loop = (now) => {
      this.updateMorphingObjects(now);
      this.updateParticles();
      this.redrawAll(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateMorphingObjects(now) {
    for (let i = this.morphingObjects.length - 1; i >= 0; i--) {
      const morph = this.morphingObjects[i];
      const elapsed = now - morph.startTime;
      const progress = Math.min(1.0, elapsed / morph.duration);

      const ease = 1 - Math.pow(1 - progress, 3);
      morph.targetObj.alpha = ease;
      morph.strokeAlpha = 1 - ease;

      if (progress >= 1.0) {
        morph.targetObj.alpha = 1.0;
        this.perfectedObjects.push(morph.targetObj);
        this.morphingObjects.splice(i, 1);
      }
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.isShockwave) {
        p.radius += 4;
        p.alpha -= 0.03;
        if (p.alpha <= 0 || p.radius >= p.maxRadius) {
          this.particles.splice(i, 1);
        }
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  redrawAll(now = performance.now()) {
    const w = this.width;
    const h = this.height;
    this.ctx.clearRect(0, 0, w, h);

    // 1. Grid Paper Background
    this.drawGridPaper(w, h);

    // 2. Draw Perfected Objects
    this.perfectedObjects.forEach(obj => {
      this.drawPerfectedObject(obj, now);
    });

    // 3. Draw Active Morphing Objects
    this.morphingObjects.forEach(morph => {
      this.ctx.save();
      this.ctx.globalAlpha = morph.strokeAlpha;
      this.ctx.strokeStyle = morph.targetObj.color || '#1e60d0';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      morph.fromStroke.forEach((pt, idx) => {
        if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
        else this.ctx.lineTo(pt.x, pt.y);
      });
      this.ctx.stroke();
      this.ctx.restore();

      this.drawPerfectedObject(morph.targetObj, now);
    });

    // 4. Draw Freehand User Strokes
    this.freehandStrokes.forEach(stroke => {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      stroke.points.forEach((pt, idx) => {
        if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
        else this.ctx.lineTo(pt.x, pt.y);
      });
      this.ctx.stroke();
    });

    // 5. Draw Particles & Shockwaves
    this.particles.forEach(p => {
      if (p.isShockwave) {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        return;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });

    // 6. Draw Interactive Coordinate Guide Line if Cursor is inside
    if (this.mouse.isInside && this.currentTool !== 'pen') {
      this.drawInteractiveCrosshairGuide();
    }
  }

  drawGridPaper(w, h) {
    this.ctx.fillStyle = '#fafbfc';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    this.ctx.lineWidth = 1;
    const step = 26;

    for (let x = 0; x < w; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    for (let y = 0; y < h; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }
  }

  drawInteractiveCrosshairGuide() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 168, 232, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.mouse.y);
    this.ctx.lineTo(this.width, this.mouse.y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this.mouse.x, 0);
    this.ctx.lineTo(this.mouse.x, this.height);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawActiveStroke() {
    if (this.currentStroke.length < 2) return;
    this.ctx.save();
    this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'rgba(239, 68, 68, 0.6)' : this.currentColor;
    this.ctx.lineWidth = this.currentTool === 'eraser' ? this.brushSize * 5 : this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.currentStroke.forEach((pt, idx) => {
      if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
      else this.ctx.lineTo(pt.x, pt.y);
    });
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawPerfectedObject(obj, now = performance.now()) {
    this.ctx.save();
    this.ctx.globalAlpha = obj.alpha !== undefined ? obj.alpha : 1.0;

    // 1. ACCURATE X / Y AXIS SYSTEM
    if (obj.type === 'axis') {
      const ox = obj.x;
      const oy = obj.y;
      const axW = obj.w;
      const axH = obj.h;

      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(ox, oy);
      this.ctx.lineTo(ox, oy - axH);
      this.ctx.moveTo(ox, oy);
      this.ctx.lineTo(ox + axW, oy);
      this.ctx.stroke();

      // Arrowheads
      this.ctx.fillStyle = '#334155';
      this.ctx.beginPath();
      this.ctx.moveTo(ox, oy - axH - 8);
      this.ctx.lineTo(ox - 5, oy - axH);
      this.ctx.lineTo(ox + 5, oy - axH);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(ox + axW + 8, oy);
      this.ctx.lineTo(ox + axW, oy - 5);
      this.ctx.lineTo(ox + axW, oy + 5);
      this.ctx.fill();

      // Y-Axis Ticks
      const yTicks = obj.yTicks || 5;
      this.ctx.font = '10px Outfit, monospace';
      this.ctx.fillStyle = '#64748b';
      this.ctx.textAlign = 'right';

      for (let i = 0; i <= yTicks; i++) {
        const ty = oy - (axH / yTicks) * i;
        const val = Math.round((obj.yMax / yTicks) * i);

        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(ox - 6, ty);
        this.ctx.lineTo(ox, ty);
        this.ctx.stroke();

        if (i > 0) {
          this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3]);
          this.ctx.beginPath();
          this.ctx.moveTo(ox, ty);
          this.ctx.lineTo(ox + axW, ty);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }

        this.ctx.fillText(val, ox - 10, ty + 3);
      }

      // X-Axis Ticks
      const xLabels = obj.xLabels || ['A', 'B', 'C', 'D'];
      const stepX = axW / (xLabels.length + 1);
      this.ctx.textAlign = 'center';

      xLabels.forEach((label, idx) => {
        const tx = ox + stepX * (idx + 1);
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(tx, oy);
        this.ctx.lineTo(tx, oy + 6);
        this.ctx.stroke();

        this.ctx.fillStyle = '#475569';
        this.ctx.fillText(label, tx, oy + 20);
      });

      // Axis Titles
      this.ctx.font = 'bold 11px Outfit, sans-serif';
      this.ctx.fillStyle = '#1e293b';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(obj.xTitle || 'X Axis', ox + axW * 0.5, oy + 38);

      this.ctx.save();
      this.ctx.translate(ox - 36, oy - axH * 0.5);
      this.ctx.rotate(-Math.PI * 0.5);
      this.ctx.fillText(obj.yTitle || 'Y Axis', 0, 0);
      this.ctx.restore();

    // 2. GLOSSY ANIMATED BAR GRAPH
    } else if (obj.type === 'bar') {
      const grad = this.ctx.createLinearGradient(0, obj.y, 0, obj.y + obj.h);
      grad.addColorStop(0, obj.color);
      grad.addColorStop(1, '#ffffff');

      this.ctx.fillStyle = grad;
      this.ctx.strokeStyle = obj.color;
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = 'rgba(30, 96, 208, 0.15)';
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.roundRect(obj.x, obj.y, obj.w, obj.h, [8, 8, 0, 0]);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;

      // Top Highlight Rim
      this.ctx.fillStyle = obj.color;
      this.ctx.fillRect(obj.x, obj.y, obj.w, 4);

      // Shimmering Light Sweep
      const sweepY = obj.y + ((now * 0.08) % (obj.h + 20));
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      this.ctx.fillRect(obj.x + 2, sweepY, obj.w - 4, 3);

      // Value Badge
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 12px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(obj.value, obj.x + obj.w * 0.5, obj.y - 10);

    // 3. SPLINE LINE WITH FLOWING ENERGY PULSES & BREATHING NODES
    } else if (obj.type === 'line') {
      const pts = obj.points;
      if (pts.length >= 2) {
        const areaGrad = this.ctx.createLinearGradient(0, pts[0].y, 0, 480);
        areaGrad.addColorStop(0, 'rgba(30, 96, 208, 0.18)');
        areaGrad.addColorStop(1, 'rgba(30, 96, 208, 0.0)');

        this.ctx.fillStyle = areaGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(pts[0].x, 460);
        this.ctx.lineTo(pts[0].x, pts[0].y);

        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const cx = (p1.x + p2.x) * 0.5;
          this.ctx.bezierCurveTo(cx, p1.y, cx, p2.y, p2.x, p2.y);
        }

        this.ctx.lineTo(pts[pts.length - 1].x, 460);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = obj.color;
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const cx = (p1.x + p2.x) * 0.5;
          this.ctx.bezierCurveTo(cx, p1.y, cx, p2.y, p2.x, p2.y);
        }
        this.ctx.stroke();

        // Flowing Energy Pulse
        const t = (now * 0.0008) % 1.0;
        const totalSegments = pts.length - 1;
        const currentSeg = Math.min(totalSegments - 1, Math.floor(t * totalSegments));
        const segT = (t * totalSegments) - currentSeg;

        const p1 = pts[currentSeg];
        const p2 = pts[currentSeg + 1];
        if (p1 && p2) {
          const pulseX = p1.x + (p2.x - p1.x) * segT;
          const pulseY = p1.y + (p2.y - p1.y) * segT;

          this.ctx.fillStyle = '#f59e0b';
          this.ctx.shadowColor = '#f59e0b';
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.arc(pulseX, pulseY, 5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }

        // Breathing Nodes
        const breathRadius = 5.5 + Math.sin(now * 0.005) * 1.5;
        pts.forEach(pt => {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.strokeStyle = obj.color;
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, breathRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#0f172a';
          this.ctx.font = 'bold 10px Outfit, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(pt.val, pt.x, pt.y - 10);
        });
      }

    // 4. RADIAL DONUT CHART WITH EDITABLE FIGURES & PERCENTAGE LABELS
    } else if (obj.type === 'pie') {
      let currentAngle = -Math.PI * 0.5;
      const total = obj.slices.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0) || 100;
      const innerRadius = obj.radius * 0.55;

      obj.slices.forEach(slice => {
        const val = parseFloat(slice.value) || 0;
        const sliceAngle = (val / total) * Math.PI * 2;
        const endAngle = currentAngle + sliceAngle;
        const midAngle = currentAngle + sliceAngle * 0.5;

        // Draw Wedge
        this.ctx.fillStyle = slice.color;
        this.ctx.beginPath();
        this.ctx.arc(obj.cx, obj.cy, obj.radius, currentAngle, endAngle);
        this.ctx.arc(obj.cx, obj.cy, innerRadius, endAngle, currentAngle, true);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Slice Label & Percentage Figure
        const pct = Math.round((val / total) * 100);
        const labelRadius = obj.radius + 24;
        const lx = obj.cx + Math.cos(midAngle) * labelRadius;
        const ly = obj.cy + Math.sin(midAngle) * labelRadius;

        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 11px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${pct}%`, lx, ly);

        currentAngle = endAngle;
      });

      // Center Donut Hole & Total
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 16px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${Math.round(total)}`, obj.cx, obj.cy - 6);
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.fillText('TOTAL', obj.cx, obj.cy + 12);

    // 5. TRENDLINE
    } else if (obj.type === 'trendline') {
      this.ctx.strokeStyle = obj.color;
      this.ctx.lineWidth = 2.5;
      this.ctx.setLineDash([6, 6]);
      this.ctx.beginPath();
      this.ctx.moveTo(obj.x1, obj.y1);
      this.ctx.lineTo(obj.x2, obj.y2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.ctx.fillStyle = obj.color;
      this.ctx.font = 'bold 11px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(obj.label, obj.x2 + 8, obj.y2);

    // 6. STAT CALLOUT CARD
    } else if (obj.type === 'stat_badge') {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = obj.color;
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = 'rgba(0,0,0,0.08)';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.roundRect(obj.x, obj.y, 160, 60, 10);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#64748b';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(obj.title, obj.x + 14, obj.y + 22);

      this.ctx.fillStyle = obj.color;
      this.ctx.font = 'bold 16px Outfit, sans-serif';
      this.ctx.fillText(obj.value, obj.x + 14, obj.y + 46);

    // 7. CUSTOM TEXT ANNOTATION
    } else if (obj.type === 'text') {
      this.ctx.fillStyle = obj.color;
      this.ctx.font = 'bold 13px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(obj.text, obj.x, obj.y);
    }

    this.ctx.restore();
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.chartPaintStudio = new ChartPaintStudio();
});
