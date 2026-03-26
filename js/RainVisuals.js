// ── RainVisuals ───────────────────────────────────────────────
//
// Owns all visual updates:
//   - CSS variables on :root
//   - Rain layer animation durations
//   - Film grain canvas
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
        data[i + 3] = CONFIG.grain.alpha;
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