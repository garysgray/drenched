// ══════════════════════════════════════════════════════════════
//  DARK & STORMY NIGHT — script.js
//  Structure:
//    CONFIG        — intensity presets and color themes
//    RainAudio     — all Web Audio (rain noise + thunder + click)
//    RainVisuals   — all CSS variable + animation updates
//    TextDisplay   — static / scrolling text toggle
//    HUD           — buttons, auto-hide, cursor
//    Engine        — creates and connects all systems
//    DOMContentLoaded — single entry point at the bottom
// ══════════════════════════════════════════════════════════════


// ── CONFIG ────────────────────────────────────────────────────
//
// All scene presets live here. To add a new intensity level or
// color theme, just add an entry — nothing else needs to change.

const CONFIG =
{
  intensities:
  {
    slow:
    {
      durAngled:   '1.3s',
      durStraight: '0.25s',
      durRev:      '1.3s',
      opAngled:    '0.00',
      opStraight:  '0.30',
      opRev:       '0.00',
      lightA:      '0.02',
      lightB:      '0.09',
    },

    med:
    {
      durAngled:   '0.18s',
      durStraight: '0.22s',
      durRev:      '0.15s',
      opAngled:    '0.50',
      opStraight:  '0.20',
      opRev:       '0.00',
      lightA:      '0.65',
      lightB:      '0.35',
    },

    fast:
    {
      durAngled:   '0.045s',
      durStraight: '0.055s',
      durRev:      '0.038s',
      opAngled:    '0.70',
      opStraight:  '0.30',
      opRev:       '0.45',
      lightA:      '0.90',
      lightB:      '0.55',
    },
  },

  colors:
  {
    red:   { color: '#cc0000', glow: 'rgba(200,0,0,0.75)',   cls: 'active-red'   },
    green: { color: '#00bb00', glow: 'rgba(0,185,0,0.75)',   cls: 'active-green' },
    blue:  { color: '#2255ff', glow: 'rgba(30,85,255,0.75)', cls: 'active-blue'  },
  },

  rainLevels: { slow: 0.1, med: 0.25, fast: 0.5 },

  thunderDelay:
  {
    slow: { min: 15000, range: 15000 },
    med:  { min: 8000,  range: 8000  },
    fast: { min: 3000,  range: 4000  },
  },
};


// ── RainAudio ─────────────────────────────────────────────────
//
// Owns all audio:
//   - Looping rain noise chain
//   - Thunder synthesizer
//   - UI click sound

class RainAudio
{
  constructor()
  {
    this.ctx          = new AudioContext();
    this.thunderTimer = null;
    this._buildRainChain();
  }

  // White noise → bandpass filter → gain → output
  _buildRainChain()
  {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer     = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source  = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;

    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value         = 0.5;

    this.rainGain            = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    source.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    source.start();
  }

  // Crack = short unfiltered noise burst
  // Rumble = 1-3 staggered low-shelf boosted noise layers
  _strike(intensity)
  {
    const now = this.ctx.currentTime;

    const cfg =
    {
      slow: { crack: 0.3,  rumble: 0.25,  rumbleLen: 2.5, fadeMin: 2.0, fadeMax: 1.0 },
      med:  { crack: 0.8,  rumble: 0.65,  rumbleLen: 3.5, fadeMin: 3.0, fadeMax: 1.5 },
      fast: { crack: 1.4,  rumble: 1.05,  rumbleLen: 5.0, fadeMin: 4.5, fadeMax: 2.0 },
    }[intensity];

    this._playCrack(now, cfg);
    this._playRumble(now, cfg, intensity);
    this._scheduleNextStrike(intensity);
  }

  _playCrack(now, cfg)
  {
    const buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src  = this.ctx.createBufferSource();
    src.buffer = buf;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(cfg.crack, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  _playRumble(now, cfg, intensity)
  {
    const layerCount = intensity === 'slow' ? 1 : intensity === 'med' ? 2 : 3;

    for (let l = 0; l < layerCount; l++)
    {
      const offset = l * (0.08 + Math.random() * 0.12);

      const buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * cfg.rumbleLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src  = this.ctx.createBufferSource();
      src.buffer = buf;

      const shelf            = this.ctx.createBiquadFilter();
      shelf.type             = 'lowshelf';
      shelf.frequency.value  = 350;
      shelf.gain.value       = intensity === 'slow' ? 6 : intensity === 'med' ? 14 : 20;

      const hiCut            = this.ctx.createBiquadFilter();
      hiCut.type             = 'lowpass';
      hiCut.frequency.value  = intensity === 'slow' ? 300 : intensity === 'med' ? 600 : 1200;

      const gain     = this.ctx.createGain();
      const layerVol = cfg.rumble / layerCount * (0.8 + Math.random() * 0.4);
      const fadeDur  = cfg.fadeMin + Math.random() * cfg.fadeMax;

      gain.gain.setValueAtTime(0,        now + offset);
      gain.gain.linearRampToValueAtTime(layerVol, now + offset + 0.15);
      gain.gain.setValueAtTime(layerVol, now + offset + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + fadeDur);

      src.connect(shelf);
      shelf.connect(hiCut);
      hiCut.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now + offset);
    }
  }

  _scheduleNextStrike(intensity)
  {
    const { min, range } = CONFIG.thunderDelay[intensity];
    const delay          = min + Math.random() * range;
    this.thunderTimer    = setTimeout(() => this._strike(intensity), delay);
  }

  // Short highpass filtered noise burst — crisp UI tick
  playClick()
  {
    const now  = this.ctx.currentTime;
    const buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src  = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'highpass';
    filter.frequency.value = 1800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  setIntensity(id)
  {
    this.rainGain.gain.setTargetAtTime(
      CONFIG.rainLevels[id],
      this.ctx.currentTime,
      0.5
    );
    clearTimeout(this.thunderTimer);
    this._strike(id);
  }

  resume()
  {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}


// ── RainVisuals ───────────────────────────────────────────────
//
// Owns all visual updates:
//   - CSS variables on :root
//   - Rain layer animation durations
//   - Film grain canvas

class RainVisuals
{
  constructor()
  {
    this.root         = document.documentElement;
    this.rainAngled   = document.getElementById('rain-angled');
    this.rainStraight = document.getElementById('rain-straight');
    this.rainRev      = document.getElementById('rain-rev');
    this._initGrain();
  }

  // Redraws random greyscale pixels every frame to simulate film grain
  _initGrain()
  {
    const canvas = document.getElementById('noise');
    const ctx    = canvas.getContext('2d');

    const resize = () =>
    {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () =>
    {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data      = imageData.data;

      for (let i = 0; i < data.length; i += 4)
      {
        const v     = Math.random() * 255;
        data[i]     = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 18;
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  setIntensity(id)
  {
    const s = CONFIG.intensities[id];

    this.rainAngled.style.animationDuration   = s.durAngled;
    this.rainStraight.style.animationDuration = s.durStraight;
    this.rainRev.style.animationDuration      = s.durRev;

    this.root.style.setProperty('--op-angled',   s.opAngled);
    this.root.style.setProperty('--op-straight', s.opStraight);
    this.root.style.setProperty('--op-rev',      s.opRev);
    this.root.style.setProperty('--lightning-a', s.lightA);
    this.root.style.setProperty('--lightning-b', s.lightB);
  }

  setColor(id)
  {
    const c = CONFIG.colors[id];
    this.root.style.setProperty('--text-color', c.color);
    this.root.style.setProperty('--glow-color', c.glow);
  }
}


// ── TextDisplay ───────────────────────────────────────────────
//
// Toggles between static glowing text and scrolling marquee.
// HUD buttons control the mode. Clicking the static text also
// switches to scroll mode for discoverability.
// Receives audio reference so it can play the click sound.

class TextDisplay
{
  constructor(audio)
  {
    this.stage       = document.querySelector('.text-stage');
    this.audio       = audio;
    this.isScrolling = false;

    this._buildScrollEl();
    this._bindClicks();
  }

  _buildScrollEl()
  {
    this.scrollEl           = document.createElement('div');
    this.scrollEl.className = 'scroll-left';
    this.scrollEl.innerHTML = '<p>It was a Dark and Stormy Night!!!</p>';
    this.stage.appendChild(this.scrollEl);
  }

  // Helper to set mode and update button states in one place
  _setMode(scrolling)
{
  this.isScrolling = scrolling;
  this.stage.classList.toggle('scrolling', scrolling);
  document.getElementById('text-mode-static').className = scrolling ? '' : 'active-speed';
  document.getElementById('text-mode-scroll').className = scrolling ? 'active-speed' : '';

  const sliderGroup = document.getElementById('scroll-speed-group');
  sliderGroup.style.display = scrolling ? 'flex' : 'none';

  document.getElementById('scroll-speed-divider').style.display = scrolling ? 'block' : 'none';
}

  _bindClicks()
  {
    // Clicking the static text switches to scroll mode
    document.getElementById('text-toggle').addEventListener('click', () =>
    {
      this.audio.playClick();
      this._setMode(true);
    });

    // HUD static button
    document.getElementById('text-mode-static').addEventListener('click', () =>
    {
      this.audio.playClick();
      this._setMode(false);
    });

    // HUD scroll button
    document.getElementById('text-mode-scroll').addEventListener('click', () =>
    {
      this.audio.playClick();
      this._setMode(true);
    });

    // Scroll speed slider
const slider = document.getElementById('scroll-speed');
const label  = document.getElementById('scroll-speed-val');

slider.addEventListener('input', () =>
{
  const val = slider.value;
  label.textContent = `${val}s`;

  // Update the scrolling animation duration live
  const p = document.querySelector('.scroll-left p');
  if (p) p.style.animationDuration = `${val}s`;
});
  }
}


// ── HUD ───────────────────────────────────────────────────────
//
// Owns all UI behavior:
//   - Entrance animation (JS driven, no CSS animation)
//   - Auto-hide after 3s idle
//   - Cursor hide/show in sync with HUD
//   - Intensity and color button listeners with click sound

class HUD
{
  constructor(onIntensityChange, onColorChange, onClickSound)
  {
    this.el                = document.querySelector('.HUD');
    this.hideTimer         = null;
    this.onIntensityChange = onIntensityChange;
    this.onColorChange     = onColorChange;
    this.onClickSound      = onClickSound;

    this._bindButtons();
    this._initAutoHide();
  }

  _bindButtons()
  {
    ['slow', 'med', 'fast'].forEach(id =>
    {
      document.getElementById(id).addEventListener('click', () =>
      {
        this.onClickSound();
        ['slow', 'med', 'fast'].forEach(b => document.getElementById(b).className = '');
        document.getElementById(id).className = 'active-speed';
        this.onIntensityChange(id);
      });
    });

    ['red', 'green', 'blue'].forEach(id =>
    {
      document.getElementById(id).addEventListener('click', () =>
      {
        this.onClickSound();
        ['red', 'green', 'blue'].forEach(b => document.getElementById(b).className = '');
        document.getElementById(id).className = CONFIG.colors[id].cls;
        this.onColorChange(id);
      });
    });
  }

  // HUD starts at opacity:0 in CSS — JS owns opacity entirely.
  // Double rAF ensures transition is registered before first opacity change.
  _initAutoHide()
  {
    this.el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() =>
    {
      requestAnimationFrame(() =>
      {
        this._show();

        document.addEventListener('mousemove',  () => this._show());
        document.addEventListener('touchstart', () => this._show());
        document.addEventListener('touchmove',  () => this._show());
      });
    });
  }

  _show()
  {
    this.el.style.opacity       = '1';
    this.el.style.pointerEvents = 'auto';
    this.el.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';

    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), 3000);
  }

  _hide()
  {
    this.el.style.opacity       = '0';
    this.el.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}


// ── Engine ────────────────────────────────────────────────────
//
// Top level controller. Creates all subsystems and wires them
// together. Only place that knows about all systems at once.

class Engine
{
  constructor()
  {
    this.audio   = new RainAudio();
    this.visuals = new RainVisuals();
    this.text    = new TextDisplay(this.audio);

    this.hud = new HUD(
      (id) => this._onIntensityChange(id),
      (id) => this._onColorChange(id),
      ()   => this.audio.playClick()
    );

    // Resume AudioContext on first user interaction
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  _onIntensityChange(id)
  {
    this.audio.setIntensity(id);
    this.visuals.setIntensity(id);
  }

  _onColorChange(id)
  {
    this.visuals.setColor(id);
  }

  start(intensityId, colorId)
  {
    this._onIntensityChange(intensityId);
    this._onColorChange(colorId);

    document.getElementById(intensityId).className = 'active-speed';
    document.getElementById(colorId).className     = CONFIG.colors[colorId].cls;
  }
}


// ── Entry point ───────────────────────────────────────────────
//
// DOMContentLoaded waits for all HTML to be parsed before running.
// This prevents "element is null" errors from JS running too early.

document.addEventListener('DOMContentLoaded', () =>
{
  const engine = new Engine();
  engine.start('slow', 'red');
});