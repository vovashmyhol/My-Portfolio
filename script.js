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

  // Initialize Web Audio Ambient Wind Synthesizer
  initAmbientAudio();

  // Button hover interactive feedback
  initButtonInteractions();
});

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
