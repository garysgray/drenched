// ── HUD ───────────────────────────────────────────────────────
//
// Owns all UI behavior:
//   - Entrance animation (JS driven, no CSS animation)
//   - Auto-hide after idle timeout
//   - Cursor hide/show in sync with HUD
//   - Intensity and color button listeners with click sound
//
// Depends on: CONFIG (config.js)

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
    this.el.style.transition = CONFIG.hud.transitionCss;

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
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  _hide()
  {
    this.el.style.opacity       = '0';
    this.el.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}