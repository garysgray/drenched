// ── Engine ────────────────────────────────────────────────────
//
// Top level controller. Creates all subsystems and wires them
// together. Only place that knows about all systems at once.
//
// Depends on: CONFIG, RainAudio, RainVisuals, TextDisplay, HUD

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