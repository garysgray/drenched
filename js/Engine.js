// ──────────────────────────────────────────────────────────────
// ── ENGINE ───────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Core system coordinator that initializes and connects all subsystems
// Core Role:   Maintains references to all major systems and handles their interactions
// Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay, HUD, UIManager

class Engine 
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor() 
  {
    // Instantiate all core execution and visual layers on boot
    const textDisplayInstance = new TextDisplay();
    const HUDInstance = new HUD();

    this.audio       = new AudioManager(CONFIG.masterVolume);
    this.visuals     = new RainVisuals();
    
    this.environment = new EnvironmentController(this.audio, this.visuals, textDisplayInstance);
    this.ui = new UIManager(this.audio, this.visuals, this.environment);
    
    // ── UI COMPONENT REGISTRATION ─────────────────────────────
    this.ui.registerComponent('primary_hud', HUDInstance);
    this.ui.registerComponent('text_display', textDisplayInstance);

    // Handle browser audio autoplay restrictions
    document.addEventListener('click', () => this.audio.resume(), { once: true });

    // Start with default weather intensity and color theme red
    this.start(CONFIG.intensitiesModes.RAIN, Object.keys(CONFIG.colors)[0]);
    
  }

  // ── SYSTEM STARTUP ─────────────────────────────────────────
  start(intensityId, colorId)
  {
    // Initialize environment with default states
    this.environment.changeIntensity(intensityId);
    this.visuals.setColor(colorId);

    // Configure UI initial states
    this.ui.initLayoutStates(intensityId, colorId);
  }

  shutdown()
  {
    console.log("Engine: Commencing complete system teardown...");

    // 1. Force the UI Manager to cut its global window mouse/touch ropes
    if (this.ui && typeof this.ui.destroy === 'function') 
    {
      this.ui.destroy();
    }

    // 2. Tell your audio manager to stop running oscillators/loops if it has a stop function
    if (this.audio && typeof this.audio.stopAll === 'function')
    {
      this.audio.stopAll();
    }

    // 3. Nullify references so the Garbage Collector knows they are completely fair game to delete
    this.audio       = null;
    this.visuals     = null;
    this.environment = null;
    this.ui          = null;

    console.log("Engine: Teardown complete. All memory links severed safely.");
  }
}

