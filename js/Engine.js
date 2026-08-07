// ── Engine ────────────────────────────────────────────────────
//
// Top level controller. Creates all subsystems and wires them
// together. Only place that knows about all systems at once.
//
// Depends on: CONFIG, AudioManager, RainSounds, RainVisuals, TextDisplay, HUD
//
// Why this exists:
// The Engine class acts as the central coordinator for all game subsystems.
// It initializes and connects audio, visuals, text display, and the HUD,
// ensuring they work together seamlessly. This avoids tight coupling between
// subsystems while providing a single point of control.

class Engine 
{
  constructor() 
  {
    // Initialize core logic subsystems
    this.audio       = new AudioManager(CONFIG.masterVolume);
    this.visuals     = new RainVisuals();
    this.environment = new EnvironmentController(this.audio, this.visuals, null);

    // Initialize UI manager with core engine references
    this.ui = new UIManager(this.audio, this.visuals, this.environment);
    
    // Register all UI components
    this.ui.registerComponent('primary_hud', new HUD());
    this.ui.registerComponent('text_display', new TextDisplay());
    
    // Wire text display reference into environment controller
    this.environment.textDisplay = this.ui.components.get('text_display');

    // Unblock browser sound restriction on the first click
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }


  // Fires up the simulation state on load.
  start(intensityId, colorId)
  {
    // Apply default physics engine states
    this.environment.changeIntensity(intensityId);
    this.visuals.setColor(colorId);

    // Initialize UI states through registry system
    this.ui.initLayoutStates(intensityId, colorId);
  }
}
