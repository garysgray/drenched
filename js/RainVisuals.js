// ──────────────────────────────────────────────────────────────
// ── RAINVISUALS ──────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central controller for all visual effects in the scene
// Core Role:   Manages rain layers, lightning flashes, and visual effects
// Dependencies: CONFIG

class RainVisuals
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor()
  {
    // Cache root element for CSS variable access
    this.root = document.documentElement;

    // Reference visual layer elements
    this.rainAngled   = document.getElementById('rain-angled');
    this.rainStraight = document.getElementById('rain-straight');
    this.rainRev      = document.getElementById('rain-rev');
    this.lightning    = document.getElementById('lightning');
    
    // Validate required elements exist
    if (!this.rainAngled || !this.rainStraight || !this.rainRev || !this.lightning) 
    {
      console.error('Required DOM elements not found');
      return;
    }
    
    // Effect timers
    this.flashTimeRemaining = 0;
    this.isFlashing = false;
    
    // Initialize film grain effect
    this._initGrain();
  }

  // Helper method to generate a texture canvas for a given alpha value
  _createTexture(alpha)
  {
    const size = CONFIG.System.NOISE_TEX_SIZE; // Locked small tile size for CSS repeating background
    const texCanvas = document.createElement('canvas');
    texCanvas.width = size;
    texCanvas.height = size;
    const texCtx = texCanvas.getContext('2d');

    const imageData = texCtx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += CONFIG.System.RGBA_CHANNELS)
    {
      const v = Math.random() * CONFIG.System.COLOR_CHANNEL_MAX;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = alpha;
    }

    texCtx.putImageData(imageData, 0, 0);
    return texCanvas;
  }

  // ── FILM GRAIN RENDERING ───────────────────────────────────────
  _initGrain() 
  {
    var tileCanvas = this.createNoiseTexture(CONFIG.System.NOISE_TEX_SIZE, CONFIG.System.NOISE_TEX_SIZE, CONFIG.grain.alpha);
    var grainDataUrl = tileCanvas.toDataURL();
    var noiseOverlay = document.getElementById('noise');
    if (noiseOverlay) noiseOverlay.style.backgroundImage = 'url(' + grainDataUrl + ')';
  }

  destroy()
  {
    if (this._resizeHandler) 
    {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._flashTimer) 
    {
      clearTimeout(this._flashTimer);
      this._flashTimer = null;
    }
  }

  setIntensity(id)
  {
      const s = CONFIG.intensities[id];

      requestAnimationFrame(() => 
      {
          if (this.rainAngled) this.rainAngled.style.animationDuration = s.durAngled;
          if (this.rainStraight) this.rainStraight.style.animationDuration = s.durStraight;
          if (this.rainRev) this.rainRev.style.animationDuration = s.durRev;

          if (this.root)
          {
              this.root.style.setProperty('--op-angled',   s.opAngled);
              this.root.style.setProperty('--op-straight', s.opStraight);
              this.root.style.setProperty('--op-rev',      s.opRev);
          }
      });
  }

  // BATCHED OPTIMIZATION: Updates text color variable parameters smoothly
  setColor(id)
  {
    const c = CONFIG.colors[id];
    requestAnimationFrame(() => 
    {
      if (this.root) 
      {
        this.root.style.setProperty('--text-color', c.color);
        this.root.style.setProperty('--glow-color', c.glow);
      }
    });
  }

  createNoiseTexture(width, height, alpha) 
  {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += CONFIG.System.RGBA_CHANNELS) 
    {
        var v = Math.random() * CONFIG.System.COLOR_CHANNEL_MAX;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = alpha;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  flashLightning({ lightningPeak, attackSecs, decaySecs }, deltaOvershoot = 0)
  {
      if (!this.lightning)
      {
          return;
      }

      // Configure the exact timing for THIS strike.
      this.lightning.style.setProperty('--lightning-attack', `${attackSecs}s`);
      this.lightning.style.setProperty('--lightning-decay', `${decaySecs}s`);
      this.lightning.style.setProperty('--lightning-peak', String(Math.min(1, lightningPeak)));

      //console.log('[LIGHTNING] FLASH USING DELTA', {peak: lightningPeak, attack: attackSecs ,decay: decaySecs, overshoot: deltaOvershoot});

      // Trigger the lightning flash.
      this.lightning.dataset.flash = 'active';

      // ── THE TIMING FIX ─────────────────────────────────────
      // Calculate total animation lifespan in SECONDS
      const totalLifespan = attackSecs + decaySecs;

      // Subtract the loop's delta overshoot so the visual state
      // matches the hardware audio execution exactly
      this.flashTimeRemaining = totalLifespan - deltaOvershoot;
      this.isFlashing = true;
  }

  // ── MASTER VISUAL TICK LOOP ──────────────────────────────────
  // Driven 60 times a second by your Engine.js game loop
  update(dt)
  {
      if (!this.isFlashing) return;

      // Count down by the fixed frame step fraction (1/60)
      this.flashTimeRemaining -= dt;

      if (this.flashTimeRemaining <= 0)
      {
          // The animation time has officially expired on this exact loop tick!
          if (this.lightning)
          {
              this.lightning.dataset.flash = 'inactive';
          }

          //console.log('[LIGHTNING] FLASH COMPLETE VIA DELTA HEARTBEAT');
          
          // Reset the state machine back to idle
          this.isFlashing = false;
          this.flashTimeRemaining = 0;
      }
  }
}
