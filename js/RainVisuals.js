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
    this._flashTimer  = null;
    this._grainTimer = 0;
    this._grainTextures = {};
    
    // Initialize film grain effect
    this._initGrain();
  }

  // Helper method to generate a texture canvas for a given alpha value
  _createTexture(alpha)
  {
    const size = 128; // Locked small tile size for CSS repeating background
    const texCanvas = document.createElement('canvas');
    texCanvas.width = size;
    texCanvas.height = size;
    const texCtx = texCanvas.getContext('2d');

    const imageData = texCtx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4)
    {
      const v = Math.random() * 255;
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
    // Generate exactly one crisp 128x128 noise pattern tile canvas
    const tileCanvas = this._createTexture(CONFIG.grain.alpha);
    
    // Convert that canvas directly into a compressed data URL string
    const grainDataUrl = tileCanvas.toDataURL();
    
    // Inject that data URL directly into an empty layout div overlay element
    const noiseOverlay = document.getElementById('noise');
    if (noiseOverlay) 
    {
      noiseOverlay.style.backgroundImage = `url(${grainDataUrl})`;
    }
  }

  _preGenerateGrainTextures() 
  {
    this._grainTextures = {};
    for (const intensity in CONFIG.intensities) 
    {
      this._grainTextures[intensity] = this._createTexture(CONFIG.grain.alpha);
    }
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

      if (this.root) {
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


  flashLightning({ crack, attackSecs, decaySecs })
  {
    clearTimeout(this._flashTimer);

    const peak = Math.min(1, crack);
    const target = this.lightning;

    // Pass the dynamic timeline durations straight into CSS variables
    target.style.setProperty('--lightning-attack', `${attackSecs}s`);
    target.style.setProperty('--lightning-decay', `${decaySecs}s`);
    target.style.setProperty('--lightning-peak', String(peak));

    // Trigger the animation via the hardware-accelerated attribute state
    target.dataset.flash = "active";

    // Keep the active state alive long enough for the browser 
    // to complete its paint frames over network execution contexts.
    // Instead of killing it at attackSecs (0.05s), wait until the fade starts.
    const holdTimeSecs = attackSecs + 0.05; 

    this._flashTimer = setTimeout(() =>
    {
      target.dataset.flash = "inactive";
    }, holdTimeSecs * 1000);
  }

  
}
