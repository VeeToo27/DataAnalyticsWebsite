/**
 * Main UI Controller & Interactions
 * Data Analytics Club - IMSUCC Ghaziabad
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar Scroll Blur Effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  // 2. Smooth Scroll Down Handler
  const scrollCue = document.getElementById('scroll-cue');
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      const target = document.getElementById('about-section') || document.getElementById('content-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // 3. Reveal on Scroll (Intersection Observer)
  const revealElements = document.querySelectorAll('.fade-in-up');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => observer.observe(el));
});
