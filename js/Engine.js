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
}

