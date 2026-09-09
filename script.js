/**
 * VOVNX - Coming Soon Experience
 * Hinterland / The Long Dark Aesthetic & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Update year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Initialize Snow / Atmospheric Cold Dust Drift
  initParticles();

  // Initialize 2-bar Menu Toggle & Black Overlay
  initMenu();

  // Button hover interactive feedback
  initButtonInteractions();
});

/* ==========================================================================
   2-Bar Menu Toggle & Fullscreen Overlay Navigation
   ========================================================================== */

function initMenu() {
  const toggleBtn = document.getElementById('menu-toggle');
  const overlay = document.getElementById('menu-overlay');
  const menuLinks = document.querySelectorAll('.menu-link');
  const menuNav = overlay.querySelector('.menu-nav');
  const aboutPanel = document.getElementById('about');

  if (!toggleBtn || !overlay) return;

  function openMenu() {
    toggleBtn.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    showMenu();
    toggleBtn.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showMenu() {
    if (menuNav) menuNav.hidden = false;
    if (aboutPanel) aboutPanel.hidden = true;
  }

  function showAbout() {
    if (menuNav) menuNav.hidden = true;
    if (aboutPanel) aboutPanel.hidden = false;
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('is-open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when clicking any link
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.getAttribute('href') === '#about') {
        e.preventDefault();
        showAbout();
      } else {
        closeMenu();
      }
    });
  });

  // Close when clicking on backdrop
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('menu-backdrop')) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      if (aboutPanel && !aboutPanel.hidden) {
        showMenu();
      } else {
        closeMenu();
      }
    }
  });
}

/* ==========================================================================
   Snow & Cold Dust Particle Simulation
   ========================================================================== */

function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const PARTICLE_COUNT = Math.min(Math.floor((width * height) / 28000), 45);
  const particles = [];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * (width + 200) - 100;
      this.y = initial ? Math.random() * height : -10;
      this.size = Math.random() * 1.2 + 0.5;
      this.speedY = Math.random() * 0.5 + 0.2;
      this.speedX = Math.random() * 0.4 + 0.1;
      this.opacity = Math.random() * 0.18 + 0.04;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.015 + 0.005;
    }

    update() {
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.2;
      this.y += this.speedY;

      if (this.y > height + 10 || this.x > width + 100) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 235, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   Atmospheric Ambient Wind Audio Synthesizer (Web Audio API)
   ========================================================================== */

let audioCtx = null;
let isAudioPlaying = false;
let masterGain = null;
let windNode = null;

function initAmbientAudio() {
  const toggleBtn = document.getElementById('audio-toggle');
  const label = toggleBtn ? toggleBtn.querySelector('.audio-label') : null;
  const mutedLine1 = document.getElementById('audio-muted-line');
  const mutedLine2 = document.getElementById('audio-muted-line-2');
  const wave1 = document.getElementById('audio-wave-1');
  const wave2 = document.getElementById('audio-wave-2');

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isAudioPlaying) {
      startWindSynth();
      isAudioPlaying = true;
      if (label) label.textContent = 'AMBIENCE: ON';
      if (mutedLine1) mutedLine1.style.display = 'none';
      if (mutedLine2) mutedLine2.style.display = 'none';
      if (wave1) wave1.style.display = 'inline';
      if (wave2) wave2.style.display = 'inline';
      toggleBtn.classList.add('is-active');
    } else {
      stopWindSynth();
      isAudioPlaying = false;
      if (label) label.textContent = 'AMBIENCE: OFF';
      if (mutedLine1) mutedLine1.style.display = 'inline';
      if (mutedLine2) mutedLine2.style.display = 'inline';
      if (wave1) wave1.style.display = 'none';
      if (wave2) wave2.style.display = 'none';
      toggleBtn.classList.remove('is-active');
    }
  });
}

function startWindSynth() {
  if (!audioCtx) return;

  // Master Gain for smooth fade-in
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 3);
  masterGain.connect(audioCtx.destination);

  // Buffer length for noise
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  // Pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  // Bandpass Filter simulating cold wind whistling & howling
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(320, audioCtx.currentTime);
  filter.Q.setValueAtTime(2.8, audioCtx.currentTime);

  // Lowpass filter to muffle harsh frequencies
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(650, audioCtx.currentTime);

  // Modulator LFO for organic wind gusts
  const lfo = audioCtx.createOscillator();
  lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);

  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(220, audioCtx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  // Connect graph
  whiteNoise.connect(filter);
  filter.connect(lowpass);
  lowpass.connect(masterGain);

  whiteNoise.start();
  lfo.start();

  windNode = { whiteNoise, lfo, masterGain };
}

function stopWindSynth() {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    setTimeout(() => {
      if (windNode) {
        try {
          windNode.whiteNoise.stop();
          windNode.lfo.stop();
        } catch (e) {}
        windNode = null;
      }
    }, 1300);
  }
}

/* ==========================================================================
   Button Subtle Interactions
   ========================================================================== */

function initButtonInteractions() {
  const buttons = document.querySelectorAll('.brush-btn');

  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      playSoftChime();
    });
  });
}

// Gentle, subtle high-frequency frost chime on button hover
function playSoftChime() {
  if (!audioCtx || !isAudioPlaying) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}
