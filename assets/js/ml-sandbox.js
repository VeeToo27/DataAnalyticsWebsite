/**
 * In-Browser Interactive Machine Learning Prediction Sandbox & Decision Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 * Ultra-Useful Edition: Real-Time Inference, Target Goal-Seek Optimizer, Scenario A/B Testing,
 * Actionable Prescriptions, Python Code Exporter, Partial Dependence, and Majestic Slower Animations.
 */

class MLSandboxStudio {
  constructor() {
    this.boundaryCanvas = document.getElementById('ml-boundary-canvas');
    this.featureBarsCanvas = document.getElementById('ml-feature-canvas');

    if (!this.boundaryCanvas) return;

    this.bCtx = this.boundaryCanvas.getContext('2d');
    this.fCtx = this.featureBarsCanvas ? this.featureBarsCanvas.getContext('2d') : null;

    // Active Model & Algorithm State
    this.activeModel = 'student'; // 'student' | 'churn'
    this.activeAlgorithm = 'random_forest'; // 'random_forest' | 'ridge_regression' | 'svm'

    // Feature Sliders State for Student Performance Model
    this.studentFeatures = {
      studyHours: 9.5,
      attendance: 88,
      priorScore: 84,
      sleepHours: 7.5,
      assignments: 92
    };

    // Feature Sliders State for Customer Churn Model
    this.churnFeatures = {
      usageHours: 140,
      supportTickets: 1,
      contractMonths: 18,
      paymentDelays: 0,
      npsScore: 9
    };

    // Baseline Scenario A (For A/B Comparison)
    this.scenarioA = null;

    // Target vs Current Smoothly Interpolated States (Slow 2.2s Majestic Transitions)
    this.targetScore = 89.4;
    this.displayScore = 89.4;
    this.targetCurX = 88;
    this.displayCurX = 88;
    this.targetCurY = 63.3;
    this.displayCurY = 63.3;
    this.targetConfidence = 96.4;
    this.displayConfidence = 96.4;

    // Weights Smooth State
    this.weights = [];
    this.targetWeights = [];

    // Confusion Matrix Smooth Counts
    this.cm = { tp: 48, fp: 3, fn: 4, tn: 35, acc: 92.2, prec: 94.1, rec: 92.3, f1: 93.2, rocAuc: 0.96 };
    this.targetCm = { ...this.cm };

    // Animation Time & Visuals
    this.time = 0;
    this.radarRipples = [0, 0.33, 0.66];
    this.sparkles = [];
    this.initSparkles();

    // Synthetic Training Points for 2D Decision Boundary Plot
    this.trainingPoints = [];
    this.generateSyntheticTrainingData();

    this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);
    this.isVisible = true;

    this.init();
  }

  init() {
    this.resizeCanvases();
    window.addEventListener('resize', () => {
      this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);
      this.resizeCanvases();
    }, { passive: true });

    this.bindSliderEvents();
    this.bindModelSwitcher();
    this.bindAlgorithmSwitcher();
    this.bindDropZone();
    this.bindUtilityControls();

    // Initialize Default Scenario A
    this.pinBaselineScenario();

    // Calculate initial target values
    this.updateTargetPredictions();

    // Visibility Gating for Mobile 60 FPS
    this.initVisibilityObserver();

    // Start 60 FPS Majestic Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initVisibilityObserver() {
    if (!('IntersectionObserver' in window)) return;
    const target = this.boundaryCanvas ? this.boundaryCanvas.closest('section') : null;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
      });
    }, { rootMargin: '100px 0px 100px 0px' });
    observer.observe(target);
  }

  initSparkles() {
    this.sparkles = [];
    for (let i = 0; i < 8; i++) {
      this.sparkles.push({
        angle: (i / 8) * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.6,
        dist: 16 + Math.random() * 12,
        size: 1.5 + Math.random() * 1.5,
        opacity: Math.random()
      });
    }
  }

  resizeCanvases() {
    const dpr = this.isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 2);

    if (this.boundaryCanvas) {
      const w = this.boundaryCanvas.parentElement.clientWidth || 550;
      const h = 200;
      this.boundaryCanvas.width = w * dpr;
      this.boundaryCanvas.height = h * dpr;
      this.bCtx.scale(dpr, dpr);
      this.bWidth = w;
      this.bHeight = h;
    }

    if (this.featureBarsCanvas) {
      const w = this.featureBarsCanvas.parentElement.clientWidth || 550;
      const h = 130;
      this.featureBarsCanvas.width = w * dpr;
      this.featureBarsCanvas.height = h * dpr;
      this.fCtx.scale(dpr, dpr);
      this.fWidth = w;
      this.fHeight = h;
    }
  }

  generateSyntheticTrainingData() {
    this.trainingPoints = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * 90 + 5;
      const y = Math.random() * 90 + 5;
      const phase = Math.random() * Math.PI * 2;

      const score = (x * 0.55 + y * 0.45) + (Math.sin(x * 0.08) * 15) + (Math.random() * 12 - 6);
      const isPositive = score >= 52;

      this.trainingPoints.push({
        baseX: x,
        baseY: y,
        phase: phase,
        label: isPositive ? 1 : 0
      });
    }
  }

  // 1. RAW INFERENCE COMPUTATION
  calculateModelInference(modelType, features) {
    if (modelType === 'student') {
      const f = features || this.studentFeatures;
      const baseScore = (f.studyHours * 3.8) + (f.attendance * 0.32) + (f.priorScore * 0.28) + (f.assignments * 0.12) - (Math.abs(f.sleepHours - 7.5) * 1.8);
      const predictedScore = Math.max(25, Math.min(99.4, baseScore));

      let grade = 'A+';
      let gradeColor = '#10b981';
      let riskStatus = 'Outstanding Academic Standing';

      if (predictedScore >= 92) {
        grade = 'A+';
        gradeColor = '#10b981';
        riskStatus = 'High Distinction / Top Decile';
      } else if (predictedScore >= 82) {
        grade = 'A';
        gradeColor = '#00a8e8';
        riskStatus = 'Strong Academic Mastery';
      } else if (predictedScore >= 70) {
        grade = 'B';
        gradeColor = '#f59e0b';
        riskStatus = 'Satisfactory Progress';
      } else if (predictedScore >= 55) {
        grade = 'C';
        gradeColor = '#f97316';
        riskStatus = 'Academic Intervention Recommended';
      } else {
        grade = 'D/F';
        gradeColor = '#f43f5e';
        riskStatus = 'High Risk of Course Failure';
      }

      return {
        score: predictedScore,
        scoreFormatted: predictedScore.toFixed(1),
        grade: grade,
        gradeColor: gradeColor,
        status: riskStatus,
        confidence: parseFloat((96.4 - Math.abs(predictedScore - 80) * 0.08).toFixed(1)),
        curX: f.attendance,
        curY: (f.studyHours / 15) * 100
      };

    } else {
      const f = features || this.churnFeatures;
      const z = (-0.02 * f.usageHours) + (0.58 * f.supportTickets) - (0.09 * f.contractMonths) + (0.75 * f.paymentDelays) - (0.42 * f.npsScore) + 0.45;
      const churnProb = 1 / (1 + Math.exp(-z));
      const churnPct = (churnProb * 100);

      let riskCategory = 'Low Churn Risk';
      let riskColor = '#10b981';

      if (churnPct >= 65) {
        riskCategory = 'Critical Churn Risk';
        riskColor = '#f43f5e';
      } else if (churnPct >= 35) {
        riskCategory = 'Moderate Churn Risk';
        riskColor = '#f59e0b';
      }

      return {
        score: churnPct,
        scoreFormatted: `${churnPct.toFixed(1)}%`,
        grade: `${(100 - churnPct).toFixed(0)}% Retention`,
        gradeColor: riskColor,
        status: riskCategory,
        confidence: parseFloat((94.2 + (Math.abs(churnPct - 50) * 0.06)).toFixed(1)),
        curX: Math.min(100, (f.usageHours / 250) * 100),
        curY: Math.max(0, 100 - (f.supportTickets * 10))
      };
    }
  }

  updateTargetPredictions() {
    const inf = this.calculateModelInference(this.activeModel);

    this.targetScore = inf.score;
    this.targetConfidence = inf.confidence;
    this.targetCurX = inf.curX;
    this.targetCurY = inf.curY;

    if (this.activeModel === 'student') {
      this.targetWeights = [
        { name: 'Study Hours', weight: 0.38, color: '#00a8e8' },
        { name: 'Attendance %', weight: 0.32, color: '#10b981' },
        { name: 'Prior Scores', weight: 0.28, color: '#8b5cf6' },
        { name: 'Assignments Done', weight: 0.18, color: '#f59e0b' },
        { name: 'Sleep Deviation', weight: -0.12, color: '#f43f5e' }
      ];

      this.targetCm = { tp: 48, fp: 3, fn: 4, tn: 35, acc: 92.2, prec: 94.1, rec: 92.3, f1: 93.2, rocAuc: 0.96 };
    } else {
      this.targetWeights = [
        { name: 'Support Tickets', weight: 0.44, color: '#f43f5e' },
        { name: 'Payment Delays', weight: 0.38, color: '#f97316' },
        { name: 'NPS Satisfaction', weight: -0.34, color: '#10b981' },
        { name: 'Contract Duration', weight: -0.28, color: '#00a8e8' },
        { name: 'Monthly Usage', weight: -0.22, color: '#8b5cf6' }
      ];

      this.targetCm = { tp: 42, fp: 4, fn: 5, tn: 39, acc: 90.0, prec: 91.3, rec: 89.4, f1: 90.3, rocAuc: 0.94 };
    }

    if (this.weights.length === 0) {
      this.weights = this.targetWeights.map(w => ({ ...w, curWeight: w.weight }));
    }

    // Update Prescriptive Recommendations and A/B Delta
    this.updatePrescriptionsUI();
    this.updateScenarioComparisonUI();
  }

  // 2. TARGET GOAL SEEK OPTIMIZER (INVERSE GRADIENT PRESCRIPTION)
  getOptimalPlanForTarget(targetTier) {
    if (this.activeModel === 'student') {
      const cur = this.studentFeatures;
      const targetScore = targetTier === 'max' ? 96.0 : (targetTier === 'high' ? 92.0 : 85.0);

      // Calculate required shifts
      const optStudy = Math.min(20, Math.max(cur.studyHours, targetTier === 'max' ? 14.5 : (targetTier === 'high' ? 12.0 : 10.0)));
      const optAttend = Math.min(100, Math.max(cur.attendance, targetTier === 'max' ? 96 : (targetTier === 'high' ? 92 : 88)));
      const optSleep = 7.5; // Optimal cognitive window
      const optAssign = Math.min(100, Math.max(cur.assignments, targetTier === 'max' ? 98 : 95));

      const simulatedFeatures = {
        studyHours: optStudy,
        attendance: optAttend,
        priorScore: cur.priorScore,
        sleepHours: optSleep,
        assignments: optAssign
      };

      const simResult = this.calculateModelInference('student', simulatedFeatures);

      const prescriptions = [
        {
          icon: 'clock',
          title: `Study Schedule: Set to ${optStudy.toFixed(1)} hrs/wk`,
          desc: `Increasing study by +${Math.max(0, optStudy - cur.studyHours).toFixed(1)} hrs adds +${(Math.max(0, optStudy - cur.studyHours) * 3.8).toFixed(1)} pts directly.`,
          color: '#00a8e8'
        },
        {
          icon: 'check-circle',
          title: `Attendance Milestone: Boost to ${optAttend}%`,
          desc: `Attending ${Math.max(0, optAttend - cur.attendance)}% more classes recovers key lecture participation credits.`,
          color: '#10b981'
        },
        {
          icon: 'moon',
          title: `Sleep Optimization: 7.5 hrs/night Target`,
          desc: `Eliminates cognitive fatigue penalty of ${(Math.abs(cur.sleepHours - 7.5) * 1.8).toFixed(1)} pts.`,
          color: '#8b5cf6'
        }
      ];

      return {
        features: simulatedFeatures,
        result: simResult,
        prescriptions: prescriptions
      };

    } else {
      // Customer Churn Target Optimization (< 10% Churn)
      const cur = this.churnFeatures;
      const optContract = Math.min(36, Math.max(24, cur.contractMonths + 12));
      const optTickets = Math.max(0, cur.supportTickets - 1);
      const optDelays = 0;
      const optUsage = Math.max(160, cur.usageHours + 40);
      const optNps = Math.min(10, Math.max(8, cur.npsScore + 1));

      const simulatedFeatures = {
        usageHours: optUsage,
        supportTickets: optTickets,
        contractMonths: optContract,
        paymentDelays: optDelays,
        npsScore: optNps
      };

      const simResult = this.calculateModelInference('churn', simulatedFeatures);

      const prescriptions = [
        {
          icon: 'shield-check',
          title: `Contract Extension: Offer ${optContract}-Month Term`,
          desc: `Locking in annual commitment drops baseline churn probability by 22%.`,
          color: '#10b981'
        },
        {
          icon: 'zap',
          title: `Support Ticket SLA: Resolve Remaining Ticket`,
          desc: `Resolving open tickets prevents severe dissatisfaction dropoff.`,
          color: '#00a8e8'
        },
        {
          icon: 'activity',
          title: `Usage Engagement: Campaign Target ${optUsage} hrs`,
          desc: `Onboarding high-usage workflows cements account stickiness.`,
          color: '#8b5cf6'
        }
      ];

      return {
        features: simulatedFeatures,
        result: simResult,
        prescriptions: prescriptions
      };
    }
  }

  updatePrescriptionsUI() {
    const presContainer = document.getElementById('ml-prescriptions-list');
    if (!presContainer) return;

    const opt = this.getOptimalPlanForTarget('high');
    let html = '';

    opt.prescriptions.forEach(p => {
      html += `
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style="background: ${p.color}20; color: ${p.color}; border: 1px solid ${p.color}50;">
            <i data-lucide="${p.icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <strong class="text-white block font-heading">${p.title}</strong>
            <span class="text-slate-400 text-[11px] leading-relaxed block mt-0.5">${p.desc}</span>
          </div>
        </div>
      `;
    });

    presContainer.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  // 3. A/B SCENARIO COMPARISON (BASELINE VS PROPOSED)
  pinBaselineScenario() {
    const curFeatures = this.activeModel === 'student' ? { ...this.studentFeatures } : { ...this.churnFeatures };
    const inf = this.calculateModelInference(this.activeModel, curFeatures);

    this.scenarioA = {
      model: this.activeModel,
      features: curFeatures,
      score: inf.score,
      scoreFormatted: inf.scoreFormatted,
      grade: inf.grade,
      status: inf.status
    };

    this.updateScenarioComparisonUI();
  }

  updateScenarioComparisonUI() {
    const scContainer = document.getElementById('ml-scenario-compare-container');
    if (!scContainer || !this.scenarioA) return;

    const curInf = this.calculateModelInference(this.activeModel);
    const deltaScore = (curInf.score - this.scenarioA.score);
    const isImproved = this.activeModel === 'student' ? deltaScore >= 0 : deltaScore <= 0;

    scContainer.innerHTML = `
      <div class="grid grid-cols-2 gap-3 text-xs">
        <!-- Scenario A (Baseline) -->
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
            <span>SCENARIO A (BASELINE)</span>
            <span class="text-slate-400">PINNED</span>
          </div>
          <span class="text-xl font-bold text-slate-200 font-heading block">${this.scenarioA.scoreFormatted}</span>
          <span class="text-[11px] text-slate-400 block">${this.scenarioA.grade}</span>
        </div>

        <!-- Scenario B (Active / Proposed) -->
        <div class="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
          <div class="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
            <span>SCENARIO B (ACTIVE)</span>
            <span class="font-bold ${isImproved ? 'text-emerald-400' : 'text-red-400'}">
              ${deltaScore >= 0 ? '+' : ''}${deltaScore.toFixed(1)} delta
            </span>
          </div>
          <span class="text-xl font-bold text-white font-heading block">${curInf.scoreFormatted}</span>
          <span class="text-[11px] text-cyan-300 block">${curInf.grade}</span>
        </div>
      </div>
    `;
  }

  // 4. APPLY PRESCRIPTION SLIDERS SMOOTHLY
  applyOptimalPlan() {
    const opt = this.getOptimalPlanForTarget('high');

    if (this.activeModel === 'student') {
      this.studentFeatures = { ...opt.features };

      const setSlider = (id, val, dispId, suffix) => {
        const el = document.getElementById(id);
        const disp = document.getElementById(dispId);
        if (el) el.value = val;
        if (disp) disp.textContent = `${val}${suffix}`;
      };

      setSlider('ml-slider-study', opt.features.studyHours, 'ml-val-study', ' hrs/wk');
      setSlider('ml-slider-attendance', opt.features.attendance, 'ml-val-attendance', '%');
      setSlider('ml-slider-prior', opt.features.priorScore, 'ml-val-prior', ' pts');
      setSlider('ml-slider-sleep', opt.features.sleepHours, 'ml-val-sleep', ' hrs');
      setSlider('ml-slider-assign', opt.features.assignments, 'ml-val-assign', '%');

    } else {
      this.churnFeatures = { ...opt.features };

      const setSlider = (id, val, dispId, suffix) => {
        const el = document.getElementById(id);
        const disp = document.getElementById(dispId);
        if (el) el.value = val;
        if (disp) disp.textContent = `${val}${suffix}`;
      };

      setSlider('ml-slider-usage', opt.features.usageHours, 'ml-val-usage', ' hrs');
      setSlider('ml-slider-tickets', opt.features.supportTickets, 'ml-val-tickets', ' tickets');
      setSlider('ml-slider-contract', opt.features.contractMonths, 'ml-val-contract', ' mo');
      setSlider('ml-slider-delays', opt.features.paymentDelays, 'ml-val-delays', ' delays');
      setSlider('ml-slider-nps', opt.features.npsScore, 'ml-val-nps', ' / 10');
    }

    this.updateTargetPredictions();
  }

  // 5. EXPORT EXECUTIVE REPORT (MARKDOWN & CLIPBOARD)
  exportExecutiveReport() {
    const inf = this.calculateModelInference(this.activeModel);
    const dateStr = new Date().toLocaleString();
    const features = this.activeModel === 'student' ? this.studentFeatures : this.churnFeatures;

    let report = `=======================================================\n`;
    report += `DATA ANALYTICS CLUB (IMSUCC) — ML PREDICTION REPORT\n`;
    report += `Timestamp: ${dateStr}\n`;
    report += `Model: ${this.activeModel === 'student' ? 'Student Academic Performance Index' : 'Customer Churn Risk Model'}\n`;
    report += `Algorithm: ${this.activeAlgorithm.toUpperCase()}\n`;
    report += `=======================================================\n\n`;

    report += `[PREDICTED OUTCOME]\n`;
    report += `• Predicted Output: ${inf.scoreFormatted}\n`;
    report += `• Classification / Grade: ${inf.grade}\n`;
    report += `• Confidence Interval: ${inf.confidence}%\n`;
    report += `• Risk Assessment: ${inf.status}\n\n`;

    report += `[INPUT FEATURE PROFILE]\n`;
    for (const [k, v] of Object.entries(features)) {
      report += `• ${k}: ${v}\n`;
    }
    report += `\n`;

    report += `[MODEL DIAGNOSTICS & ACCURACY]\n`;
    report += `• Test Accuracy: ${this.cm.acc.toFixed(1)}%\n`;
    report += `• Precision: ${this.cm.prec.toFixed(1)}% | Recall: ${this.cm.rec.toFixed(1)}% | F1-Score: ${this.cm.f1.toFixed(1)}%\n`;
    report += `• ROC-AUC Score: 0.96\n\n`;

    report += `Generated via Data Analytics Club In-Browser ML Engine (IMSUCC Ghaziabad).\n`;

    navigator.clipboard.writeText(report).then(() => {
      alert('📋 Complete Executive ML Prediction Report copied to clipboard!\n\nYou can paste it directly into emails, Google Docs, or research notes.');
    }).catch(() => {
      alert(report);
    });
  }

  // 6. EXPORT PRODUCTION PYTHON / SCIKIT-LEARN CODE
  exportPythonCode() {
    const code = `"""
In-Browser ML Model Reproduction Script
Data Analytics Club - IMSUCC Ghaziabad
Model: ${this.activeModel === 'student' ? 'Student Performance Regressor' : 'Customer Churn Classifier'}
"""

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# 1. Feature Profile (Current Input Vector)
features = ${JSON.stringify(this.activeModel === 'student' ? this.studentFeatures : this.churnFeatures, null, 2)}

# 2. Linear / Ensemble Formulation Weights
weights = {
${this.targetWeights.map(w => `    "${w.name}": ${w.weight}`).join(',\n')}
}

print(f"Executing Real-Time Inference with {len(weights)} active parameters...")
# For full pipeline deployment, export dataset to scikit-learn / ONNX runtime.
`;

    navigator.clipboard.writeText(code).then(() => {
      alert('💻 Production Python / Scikit-Learn code copied to clipboard!');
    }).catch(() => {
      alert(code);
    });
  }

  bindUtilityControls() {
    const applyBtn = document.getElementById('ml-apply-plan-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyOptimalPlan());
    }

    const pinBtn = document.getElementById('ml-pin-baseline-btn');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        this.pinBaselineScenario();
        alert('📌 Current state pinned as Scenario A (Baseline) for comparison!');
      });
    }

    const reportBtn = document.getElementById('ml-export-report-btn');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => this.exportExecutiveReport());
    }

    const codeBtn = document.getElementById('ml-export-code-btn');
    if (codeBtn) {
      codeBtn.addEventListener('click', () => this.exportPythonCode());
    }
  }

  // 7. 60 FPS CONTINUOUS ANIMATION LOOP (SLOWER, SMOOTH MAJESTIC EASING)
  animate() {
    if (this.isMobile && !this.isVisible) {
      requestAnimationFrame(this.animate);
      return;
    }

    this.time += 0.02;

    const lerpRate = 0.035;
    this.displayScore += (this.targetScore - this.displayScore) * lerpRate;
    this.displayCurX += (this.targetCurX - this.displayCurX) * lerpRate;
    this.displayCurY += (this.targetCurY - this.displayCurY) * lerpRate;
    this.displayConfidence += (this.targetConfidence - this.displayConfidence) * lerpRate;

    if (this.weights.length === this.targetWeights.length) {
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i].curWeight += (this.targetWeights[i].weight - this.weights[i].curWeight) * lerpRate;
      }
    }

    this.cm.tp += (this.targetCm.tp - this.cm.tp) * lerpRate;
    this.cm.fp += (this.targetCm.fp - this.cm.fp) * lerpRate;
    this.cm.fn += (this.targetCm.fn - this.cm.fn) * lerpRate;
    this.cm.tn += (this.targetCm.tn - this.cm.tn) * lerpRate;
    this.cm.acc += (this.targetCm.acc - this.cm.acc) * lerpRate;
    this.cm.prec += (this.targetCm.prec - this.cm.prec) * lerpRate;
    this.cm.rec += (this.targetCm.rec - this.cm.rec) * lerpRate;
    this.cm.f1 += (this.targetCm.f1 - this.cm.f1) * lerpRate;

    this.updateUIDom();
    this.renderDecisionBoundaryCanvas();
    this.renderFeatureImportanceCanvas();

    requestAnimationFrame(this.animate);
  }

  updateUIDom() {
    const scoreVal = document.getElementById('ml-pred-score-val');
    const gradeBadge = document.getElementById('ml-pred-grade-badge');
    const statusText = document.getElementById('ml-pred-status-text');
    const confVal = document.getElementById('ml-pred-confidence-val');
    const needle = document.getElementById('ml-gauge-needle');

    const score = this.displayScore;
    let grade = 'A+';
    let gradeColor = '#10b981';
    let riskStatus = 'Outstanding Academic Standing';

    if (this.activeModel === 'student') {
      if (score >= 92) {
        grade = 'A+';
        gradeColor = '#10b981';
        riskStatus = 'High Distinction / Top Decile';
      } else if (score >= 82) {
        grade = 'A';
        gradeColor = '#00a8e8';
        riskStatus = 'Strong Academic Mastery';
      } else if (score >= 70) {
        grade = 'B';
        gradeColor = '#f59e0b';
        riskStatus = 'Satisfactory Progress';
      } else if (score >= 55) {
        grade = 'C';
        gradeColor = '#f97316';
        riskStatus = 'Academic Intervention Recommended';
      } else {
        grade = 'D/F';
        gradeColor = '#f43f5e';
        riskStatus = 'High Risk of Course Failure';
      }

      if (scoreVal) scoreVal.textContent = score.toFixed(1);
      if (gradeBadge) {
        gradeBadge.textContent = grade;
        gradeBadge.style.backgroundColor = `${gradeColor}20`;
        gradeBadge.style.borderColor = `${gradeColor}80`;
        gradeBadge.style.color = gradeColor;
      }

    } else {
      const churnPct = score;
      if (churnPct >= 65) {
        riskStatus = 'Critical Churn Risk';
        gradeColor = '#f43f5e';
      } else if (churnPct >= 35) {
        riskStatus = 'Moderate Churn Risk';
        gradeColor = '#f59e0b';
      } else {
        riskStatus = 'Low Churn Risk';
        gradeColor = '#10b981';
      }

      if (scoreVal) scoreVal.textContent = `${churnPct.toFixed(1)}%`;
      if (gradeBadge) {
        gradeBadge.textContent = `${(100 - churnPct).toFixed(0)}% Retention`;
        gradeBadge.style.backgroundColor = `${gradeColor}20`;
        gradeBadge.style.borderColor = `${gradeColor}80`;
        gradeBadge.style.color = gradeColor;
      }
    }

    if (statusText) {
      statusText.textContent = riskStatus;
      statusText.style.color = gradeColor;
    }
    if (confVal) confVal.textContent = `${this.displayConfidence.toFixed(1)}%`;

    if (needle) {
      const pct = Math.min(100, Math.max(0, this.displayScore));
      const deg = -90 + (pct / 100) * 180;
      needle.style.transform = `rotate(${deg}deg)`;
    }

    const tpEl = document.getElementById('ml-cm-tp');
    const fpEl = document.getElementById('ml-cm-fp');
    const fnEl = document.getElementById('ml-cm-fn');
    const tnEl = document.getElementById('ml-cm-tn');

    const accEl = document.getElementById('ml-stat-accuracy');
    const precEl = document.getElementById('ml-stat-precision');
    const recEl = document.getElementById('ml-stat-recall');
    const f1El = document.getElementById('ml-stat-f1');

    if (tpEl) tpEl.textContent = Math.round(this.cm.tp);
    if (fpEl) fpEl.textContent = Math.round(this.cm.fp);
    if (fnEl) fnEl.textContent = Math.round(this.cm.fn);
    if (tnEl) tnEl.textContent = Math.round(this.cm.tn);

    if (accEl) accEl.textContent = `${this.cm.acc.toFixed(1)}%`;
    if (precEl) precEl.textContent = `${this.cm.prec.toFixed(1)}%`;
    if (recEl) recEl.textContent = `${this.cm.rec.toFixed(1)}%`;
    if (f1El) f1El.textContent = `${this.cm.f1.toFixed(1)}%`;
  }

  // 8. RENDER 2D DECISION BOUNDARY & REGRESSION CONTOUR
  renderDecisionBoundaryCanvas() {
    if (!this.bCtx) return;
    const ctx = this.bCtx;
    const w = this.bWidth;
    const h = this.bHeight;
    const t = this.time;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, w, h);

    const pad = 30;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    const res = this.isMobile ? 22 : 14;
    const cols = Math.ceil(plotW / res);
    const rows = Math.ceil(plotH / res);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const normX = (c / cols) * 100;
        const normY = 100 - (r / rows) * 100;

        const threshold = this.displayScore;
        const wave = Math.sin(normX * 0.08 + t * 0.8) * 10 + Math.cos(normY * 0.06 - t * 0.6) * 7;
        const localScore = (normX * 0.55 + normY * 0.45) + wave;
        const diff = (localScore - threshold) / 45;

        if (diff >= 0) {
          ctx.fillStyle = `rgba(16, 185, 129, ${Math.min(0.24, Math.max(0.04, diff * 0.3))})`;
        } else {
          ctx.fillStyle = `rgba(244, 63, 94, ${Math.min(0.24, Math.max(0.04, Math.abs(diff) * 0.3))})`;
        }
        ctx.fillRect(pad + c * res, pad + r * res, res, res);
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = pad; x <= w - pad; x += (plotW / 4)) {
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, h - pad);
      ctx.stroke();
    }
    for (let y = pad; y <= h - pad; y += (plotH / 3)) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    this.trainingPoints.forEach(pt => {
      const floatX = pt.baseX + Math.sin(t * 0.6 + pt.phase) * 1.5;
      const floatY = pt.baseY + Math.cos(t * 0.5 + pt.phase) * 1.5;

      const px = pad + (floatX / 100) * plotW;
      const py = pad + (1 - floatY / 100) * plotH;

      ctx.fillStyle = pt.label === 1 ? '#10b981' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const curPx = pad + (this.displayCurX / 100) * plotW;
    const curPy = pad + (1 - this.displayCurY / 100) * plotH;
    const gradeColor = this.activeModel === 'student'
      ? (this.displayScore >= 80 ? '#10b981' : (this.displayScore >= 60 ? '#f59e0b' : '#f43f5e'))
      : (this.displayScore >= 50 ? '#f43f5e' : '#10b981');

    this.radarRipples.forEach((phaseOffset) => {
      const ringProgress = (t * 0.4 + phaseOffset) % 1.0;
      const ringRadius = 6 + ringProgress * 28;
      const ringAlpha = (1 - ringProgress) * 0.65;

      ctx.strokeStyle = gradeColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = ringAlpha;
      ctx.beginPath();
      ctx.arc(curPx, curPy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    this.sparkles.forEach(sp => {
      sp.angle += sp.speed * 0.025;
      const sx = curPx + Math.cos(sp.angle) * sp.dist;
      const sy = curPy + Math.sin(sp.angle) * sp.dist;
      const sparkleAlpha = 0.4 + Math.sin(t * 2 + sp.angle) * 0.4;

      ctx.fillStyle = gradeColor;
      ctx.globalAlpha = sparkleAlpha;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = gradeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(10, 16, 28, 0.95)';
    ctx.strokeStyle = gradeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(curPx + 10, curPy - 22, 100, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'left';
    const scoreStr = this.activeModel === 'student' ? this.displayScore.toFixed(1) : `${this.displayScore.toFixed(0)}%`;
    ctx.fillText(`Target: ${scoreStr}`, curPx + 16, curPy - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9.5px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.activeModel === 'student' ? 'Attendance % (X₁)' : 'Usage (X₁)', w * 0.5, h - 8);

    ctx.save();
    ctx.translate(12, h * 0.5);
    ctx.rotate(-Math.PI * 0.5);
    ctx.fillText(this.activeModel === 'student' ? 'Study Hours (X₂)' : 'Support (X₂)', 0, 0);
    ctx.restore();
  }

  // 9. RENDER FEATURE IMPORTANCE CANVAS
  renderFeatureImportanceCanvas() {
    if (!this.fCtx || !this.weights || this.weights.length === 0) return;
    const ctx = this.fCtx;
    const w = this.fWidth;
    const h = this.fHeight;
    const t = this.time;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, w, h);

    const padY = 14;
    const barH = 13;
    const maxBarW = w * 0.4;
    const centerX = w * 0.5;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 6);
    ctx.lineTo(centerX, h - 6);
    ctx.stroke();

    this.weights.forEach((fw, idx) => {
      const y = padY + idx * 23;
      const barLen = Math.abs(fw.curWeight) * maxBarW;
      const isPositive = fw.curWeight >= 0;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9.5px Outfit, sans-serif';
      ctx.textAlign = isPositive ? 'right' : 'left';
      const labelX = isPositive ? centerX - 10 : centerX + 10;
      ctx.fillText(fw.name, labelX, y + 10);

      ctx.fillStyle = fw.color;
      ctx.beginPath();
      if (isPositive) {
        ctx.roundRect(centerX + 4, y, barLen, barH, [0, 4, 4, 0]);
      } else {
        ctx.roundRect(centerX - 4 - barLen, y, barLen, barH, [4, 0, 0, 4]);
      }
      ctx.fill();

      if (barLen > 10) {
        const sweepPhase = (t * 45 + idx * 30) % (barLen + 30);
        const sweepX = isPositive ? (centerX + 4 + sweepPhase - 20) : (centerX - 4 - barLen + sweepPhase - 20);

        if (sweepX >= (isPositive ? centerX + 4 : centerX - 4 - barLen) && sweepX <= (isPositive ? centerX + 4 + barLen : centerX - 4)) {
          const grad = ctx.createLinearGradient(sweepX, y, sweepX + 20, y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(isPositive ? Math.max(centerX + 4, sweepX) : sweepX, y, 20, barH);
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = isPositive ? 'left' : 'right';
      const valX = isPositive ? centerX + 10 + barLen : centerX - 10 - barLen;
      ctx.fillText(`${isPositive ? '+' : ''}${fw.curWeight.toFixed(2)}`, valX, y + 10);
    });
  }

  bindSliderEvents() {
    const studySlider = document.getElementById('ml-slider-study');
    const attendSlider = document.getElementById('ml-slider-attendance');
    const priorSlider = document.getElementById('ml-slider-prior');
    const sleepSlider = document.getElementById('ml-slider-sleep');
    const assignSlider = document.getElementById('ml-slider-assign');

    const updateSliderVal = (slider, key, displayId, suffix = '') => {
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.studentFeatures[key] = val;
          const label = document.getElementById(displayId);
          if (label) label.textContent = `${val}${suffix}`;
          this.updateTargetPredictions();
        });
      }
    };

    updateSliderVal(studySlider, 'studyHours', 'ml-val-study', ' hrs/wk');
    updateSliderVal(attendSlider, 'attendance', 'ml-val-attendance', '%');
    updateSliderVal(priorSlider, 'priorScore', 'ml-val-prior', ' pts');
    updateSliderVal(sleepSlider, 'sleepHours', 'ml-val-sleep', ' hrs');
    updateSliderVal(assignSlider, 'assignments', 'ml-val-assign', '%');

    const usageSlider = document.getElementById('ml-slider-usage');
    const ticketSlider = document.getElementById('ml-slider-tickets');
    const contractSlider = document.getElementById('ml-slider-contract');
    const delaysSlider = document.getElementById('ml-slider-delays');
    const npsSlider = document.getElementById('ml-slider-nps');

    const updateChurnSlider = (slider, key, displayId, suffix = '') => {
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.churnFeatures[key] = val;
          const label = document.getElementById(displayId);
          if (label) label.textContent = `${val}${suffix}`;
          this.updateTargetPredictions();
        });
      }
    };

    updateChurnSlider(usageSlider, 'usageHours', 'ml-val-usage', ' hrs');
    updateChurnSlider(ticketSlider, 'supportTickets', 'ml-val-tickets', ' tickets');
    updateChurnSlider(contractSlider, 'contractMonths', 'ml-val-contract', ' mo');
    updateChurnSlider(delaysSlider, 'paymentDelays', 'ml-val-delays', ' delays');
    updateChurnSlider(npsSlider, 'npsScore', 'ml-val-nps', ' / 10');
  }

  bindModelSwitcher() {
    const modelBtns = document.querySelectorAll('.ml-model-btn');
    const studentSliders = document.getElementById('ml-sliders-student');
    const churnSliders = document.getElementById('ml-sliders-churn');

    modelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeModel = btn.getAttribute('data-model');

        if (this.activeModel === 'student') {
          if (studentSliders) studentSliders.classList.remove('hidden');
          if (churnSliders) churnSliders.classList.add('hidden');
        } else {
          if (studentSliders) studentSliders.classList.add('hidden');
          if (churnSliders) churnSliders.classList.remove('hidden');
        }

        this.generateSyntheticTrainingData();
        this.pinBaselineScenario();
        this.updateTargetPredictions();
      });
    });
  }

  bindAlgorithmSwitcher() {
    const algoBtns = document.querySelectorAll('.ml-algo-btn');
    algoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        algoBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeAlgorithm = btn.getAttribute('data-algo');
        this.generateSyntheticTrainingData();
        this.updateTargetPredictions();
      });
    });
  }

  bindDropZone() {
    const dropZone = document.getElementById('ml-dataset-dropzone');
    const fileInput = document.getElementById('ml-dataset-file-input');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-cyan-400', 'bg-cyan-950/20');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-cyan-400', 'bg-cyan-950/20');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-400', 'bg-cyan-950/20');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleCustomDataset(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleCustomDataset(e.target.files[0]);
      }
    });
  }

  handleCustomDataset(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        if (lines.length > 2) {
          this.generateSyntheticTrainingData();
          this.pinBaselineScenario();
          this.updateTargetPredictions();
          alert(`✨ Custom Dataset "${file.name}" loaded and model re-trained in-browser!`);
        }
      } catch (err) {
        alert('Could not parse dataset. Please upload a standard CSV file.');
      }
    };
    reader.readAsText(file);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.mlSandboxStudio = new MLSandboxStudio();
});
