/**
 * Interactive Proximity Text Magnification & Focus Lens Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 * Normal dark theme appearance where text & cards smoothly magnify and scale up when the cursor is nearby.
 */

(function () {
  class ProximityMagnifierManager {
    constructor() {
      this.aboutSection = document.getElementById('about-section');
      this.textElements = [];
      this.panels = [];
      this.mouseX = -9999;
      this.mouseY = -9999;

      this.init();
    }

    init() {
      // Collect text elements and interactive cards
      this.textElements = Array.from(document.querySelectorAll('#about-section .cipher-text, #about-section h3, #about-section p'));
      this.panels = Array.from(document.querySelectorAll('#about-section .chart-panel, #about-section .contact-item, #about-section .pyramid-tier'));

      // Attach current scale state to each text element
      this.textElements.forEach(el => {
        el._currentScale = 1.0;
        el._targetScale = 1.0;
      });

      this.panels.forEach(p => {
        p._currentScale = 1.0;
        p._targetScale = 1.0;
      });

      window.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        this.mouseX = -9999;
        this.mouseY = -9999;
      });

      // Touch events
      window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          this.mouseX = e.touches[0].clientX;
          this.mouseY = e.touches[0].clientY;
        }
      }, { passive: true });

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    animate() {
      const radius = 220; // Proximity threshold in px
      const maxTextScale = 1.14; // Text gets up to 14% larger
      const maxPanelScale = 1.025; // Panels get a gentle 2.5% lift

      // 1. Text Elements Proximity Magnification
      for (let i = 0; i < this.textElements.length; i++) {
        const el = this.textElements[i];
        const rect = el.getBoundingClientRect();

        // Check if element is in viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;

        const dx = this.mouseX - centerX;
        const dy = this.mouseY - centerY;
        const dist = Math.hypot(dx, dy);

        const isDirectHover = (
          this.mouseX >= rect.left - 10 && this.mouseX <= rect.right + 10 &&
          this.mouseY >= rect.top - 10 && this.mouseY <= rect.bottom + 10
        );

        if (isDirectHover) {
          el._targetScale = maxTextScale;
        } else if (dist < radius) {
          const factor = 1 - (dist / radius);
          el._targetScale = 1.0 + factor * (maxTextScale - 1.0);
        } else {
          el._targetScale = 1.0;
        }

        // Smooth Lerp
        el._currentScale += (el._targetScale - el._currentScale) * 0.18;

        if (Math.abs(el._currentScale - 1.0) > 0.005) {
          el.style.transform = `scale(${el._currentScale.toFixed(3)})`;
          el.classList.add('text-magnified');
        } else {
          el.style.transform = 'scale(1)';
          el.classList.remove('text-magnified');
        }
      }

      // 2. Interactive Card Lift & Border Glow on Proximity
      for (let i = 0; i < this.panels.length; i++) {
        const panel = this.panels[i];
        const rect = panel.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;

        const dx = this.mouseX - centerX;
        const dy = this.mouseY - centerY;
        const dist = Math.hypot(dx, dy);

        const isDirectHover = (
          this.mouseX >= rect.left && this.mouseX <= rect.right &&
          this.mouseY >= rect.top && this.mouseY <= rect.bottom
        );

        if (isDirectHover || dist < 200) {
          panel.classList.add('proximity-focus');
        } else {
          panel.classList.remove('proximity-focus');
        }
      }

      requestAnimationFrame(this.animate);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.proximityMagnifier = new ProximityMagnifierManager();
  });
})();
