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
    this.audio   = new AudioManager(CONFIG.masterVolume);
    this.visuals = new RainVisuals();
    this.ui      = new UISounds(this.audio);
    this.text    = new TextDisplay(this.ui);
    
    // Initialize environment controller (handles rain loop initialization)
    this.environment = new EnvironmentController(this.audio, this.visuals, this.text);

    this.hud = new HUD(
      (id) => this.environment.changeIntensity(id),
      (id) => this.visuals.setColor(id),
      ()   => this.ui.playClick(),
      this.audio
    );

    // Resume AudioContext on first user interaction
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  start(intensityId, colorId)
  {
    this.environment.changeIntensity(intensityId);
    this.visuals.setColor(colorId);

    document.getElementById(intensityId).className = 'active-speed';
    document.getElementById(colorId).className     = CONFIG.colors[colorId].cls;
  }
}