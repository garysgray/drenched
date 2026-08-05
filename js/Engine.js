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
    this.environment = new EnvironmentController(this.audio, this.visuals, null); // We will link text next

    // FIXED PYRAMID HIERARCHY: Completely removed the direct 'new HUD()' call here.
    // The Engine no longer deals with visual sub-skins directly. It delegates 
    // 100% of the UI workspace construction over to the UIManager master wrapper.
    this.ui = new UIManager(this.audio, this.visuals, this.environment);
    
    // Wire the text component into the environment controller now that UI built it
    this.environment.textDisplay = this.ui.text;

    // Unblock browser sound restriction on the first click
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  /**
   * Fires up the simulation state on load.
   */
  start(intensityId, colorId)
  {
    // Apply default physics engine states
    this.environment.changeIntensity(intensityId);
    this.visuals.setColor(colorId);

    // Command the UI object to sync its visual layouts to match those starting settings
    this.ui.initLayoutStates(intensityId, colorId);
  }
}
