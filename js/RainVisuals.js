// ── RainVisuals ───────────────────────────────────────────────
//
// Owns all visual updates:
//   - CSS variables on :root
//   - Rain layer animation durations
//   - Film grain canvas
//   - JS-driven lightning flashes (triggered by Engine on thunder strikes)
//
// Depends on: CONFIG (config.js)

class RainVisuals
{
  constructor()
  {
    this.root         = document.documentElement;
    this.rainAngled   = document.getElementById('rain-angled');
    this.rainStraight = document.getElementById('rain-straight');
    this.rainRev      = document.getElementById('rain-rev');
    this.lightning    = document.getElementById('lightning');
    
    if (!this.rainAngled || !this.rainStraight || !this.rainRev || !this.lightning) {
      console.error('Required DOM elements not found');
      return;
    }
    
    this._flashTimer  = null;
    this._grainTimer = 0;
    this._grainTextures = {};
    
    this._initGrain();
  }

  // Helper method to generate a texture canvas for a given alpha value
  _createTexture(alpha)
  {
    const size = 128;
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
    const canvas = document.getElementById('noise');
    if (!canvas) {
      console.error('Noise canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    const TEXTURE_SIZE = 128;
    let grainTexture = null;
    let textureNeedsRefresh = true;

    const resize = () =>
    {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      textureNeedsRefresh = true;
    };

    const drawGrain = () =>
    {
      if (textureNeedsRefresh || !grainTexture)
      {
        grainTexture = this._createTexture(CONFIG.grain.alpha);
        textureNeedsRefresh = false;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const tilesX = Math.ceil(canvas.width / TEXTURE_SIZE) + 1;
      const tilesY = Math.ceil(canvas.height / TEXTURE_SIZE) + 1;

      for (let x = 0; x < tilesX; x++)
      {
        for (let y = 0; y < tilesY; y++)
        {
          ctx.drawImage(
            grainTexture,
            x * TEXTURE_SIZE,
            y * TEXTURE_SIZE,
            TEXTURE_SIZE,
            TEXTURE_SIZE
          );
        }
      }

      requestAnimationFrame(drawGrain);
    };

    resize();
    this._resizeHandler = resize;
    window.addEventListener('resize', this._resizeHandler);
    drawGrain();
  }

  _preGenerateGrainTextures() 
  {
    this._grainTextures = {};
    for (const intensity in CONFIG.intensities) {
      this._grainTextures[intensity] = this._createTexture(CONFIG.grain.alpha);
    }
  }

  destroy()
  {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._flashTimer) {
      clearTimeout(this._flashTimer);
      this._flashTimer = null;
    }
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
  }

  flashLightning({ crack, attackSecs, decaySecs })
  {
    clearTimeout(this._flashTimer);

    const peak = Math.min(1, crack);

    this.lightning.style.transition = 'none';
    this.lightning.style.opacity    = '0';
    void this.lightning.offsetWidth;

    this.lightning.style.transition = `opacity ${attackSecs}s linear`;
    this.lightning.style.opacity    = String(peak);

    this._flashTimer = setTimeout(() =>
    {
      this.lightning.style.transition = `opacity ${decaySecs}s ease-out`;
      this.lightning.style.opacity    = '0';
    }, attackSecs * 1000);
  }

  setColor(id)
  {
    const c = CONFIG.colors[id];
    this.root.style.setProperty('--text-color', c.color);
    this.root.style.setProperty('--glow-color', c.glow);
  }
}
