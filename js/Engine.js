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
    // Initialize core subsystems
    this.audio       = new AudioManager(CONFIG.masterVolume);
    this.visuals     = new RainVisuals();
    
    // Create environment controller with audio/visuals references
    this.environment = new EnvironmentController(this.audio, this.visuals, null);

    // Initialize UI management system
    this.ui = new UIManager(this.audio, this.visuals, this.environment);
    
    // ── UI COMPONENT REGISTRATION ─────────────────────────────
    this.ui.registerComponent('primary_hud', new HUD());
    this.ui.registerComponent('text_display', new TextDisplay());
    
    // Connect text display to environment controller
    this.environment.textDisplay = this.ui.components.get('text_display');

    // Handle browser audio autoplay restrictions
    document.addEventListener('click', () => this.audio.resume(), { once: true });
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
}
