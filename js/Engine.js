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

  // ── MASTER CLEANUP LIFECYCLE ───────────────────────────────
  shutdown()
  {
    console.log("Engine: Commencing complete system teardown...");

    // Clear out registered UI Components (TextDisplay, HUD, etc.)
    if (this.ui && this.ui.components) 
    {
      this.ui.components.forEach((component) => 
      {
        if (component && typeof component.destroy === 'function') 
        {
          component.destroy();
        }
      });
    }

    // Clear out core engine infrastructure layers explicitly
    if (this.ui && typeof this.ui.destroy === 'function')                   this.ui.destroy();
    if (this.audio && typeof this.audio.stopAll === 'function')             this.audio.stopAll();
    if (this.visuals && typeof this.visuals.destroy === 'function')         this.visuals.destroy();
    if (this.environment && typeof this.environment.destroy === 'function') this.environment.destroy();

    // Sever all remaining object ties for the Garbage Collector
    this.audio       = null;
    this.visuals     = null;
    this.environment = null;
    this.ui          = null;

    console.log("Engine: Teardown complete. All memory links severed safely.");
  }


}

