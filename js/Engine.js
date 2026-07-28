// ── Engine ────────────────────────────────────────────────────
//
// Top level controller. Creates all subsystems and wires them
// together. Only place that knows about all systems at once.
//
// Depends on: CONFIG, AudioManager, RainSounds, RainVisuals, TextDisplay, HUD

class Engine
{
  constructor()
  {
    this.audio   = new AudioManager(CONFIG.masterVolume); // No change needed - uses getter
    this.visuals = new RainVisuals();

    // Lightning sync path: RainSounds._strike → onStrike → _onThunderStrike → RainVisuals.flashLightning
    this.sounds  = new RainSounds(this.audio, (strike) => this._onThunderStrike(strike));
    this.ui      = new UISounds(this.audio);
    this.text    = new TextDisplay(this.ui);

    this.hud = new HUD(
      (id) => this._onIntensityChange(id),
      (id) => this._onColorChange(id),
      ()   => this.ui.playClick(),
      this.audio
    );

    // Resume AudioContext on first user interaction
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  _onIntensityChange(id)
  {
    this.sounds.setIntensity(id);
    this.visuals.setIntensity(id);
  }

  _onColorChange(id)
  {
    this.visuals.setColor(id);
  }

  // Receives strike payload from RainSounds the moment _strike() fires the crack audio.
  // Forwards timing and intensity to visuals and text so both flash in sync with the sound.
  //
  // Font sync path: RainSounds._strike → onStrike → _onThunderStrike → TextDisplay.flashFont
  _onThunderStrike(strike)
  {
    this.visuals.flashLightning(strike);
    this.text.flashFont(strike);
  }

  start(intensityId, colorId)
  {
    this._onIntensityChange(intensityId);
    this._onColorChange(colorId);

    document.getElementById(intensityId).className = 'active-speed';
    document.getElementById(colorId).className     = CONFIG.colors[colorId].cls; // No change needed - uses getter
  }
}