// // ──────────────────────────────────────────────────────────────
// // ── ENGINE ───────────────────────────────────────────────────
// // ──────────────────────────────────────────────────────────────
// //
// // Description: Core system coordinator that initializes and connects all subsystems
// // Core Role:   Maintains references to all major systems and handles their interactions
// // Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay, HUD, UIManager
// //
// // Design Notes:
// // - Engine owns system creation and startup configuration.
// // - Engine supplies configuration to the subsystem that owns the behavior.
// // - Engine builds the initial UI state payload.
// // - UIManager remains responsible for UI event routing and component broadcasting.
// // - HUD owns its own auto-hide behavior.

class Engine
{
    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor()
    {
        // Instantiate all core execution and visual layers on boot
        this.textDisplayInstance = new TextDisplay();

        const HUDInstance = new HUD(CONFIG.hud);

        this.audio = new AudioManager(CONFIG.masterVolume);
        this.visuals = new RainVisuals();

        this.environment = new EnvironmentController(this.audio, this.visuals, this.textDisplayInstance);
        this.ui = new UIManager(this.audio, this.visuals, this.environment);

        // ── UI COMPONENT REGISTRATION ─────────────────────────
        this.ui.registerComponent('primary_hud', HUDInstance);
        this.ui.registerComponent('text_display', this.textDisplayInstance);
        this.hud = HUDInstance; // Save reference for the loop updater

        // Handle browser audio autoplay restrictions
        document.addEventListener('click', () => this.audio.resume(), { once: true });

        // Start with default weather parameters
        this.start(CONFIG.intensitiesModes.RAIN, Object.keys(CONFIG.colors));
    }

    // ── INCOMING DELTA ENGINE STEP ROUTER ──────────────────────
    update(dt)
    {
        // Route delta down to storm coordinator
        if (this.environment && typeof this.environment.update === 'function')
        {
            this.environment.update(dt);
        }

        // Route delta down to visual font text layers
        if (this.textDisplayInstance && typeof this.textDisplayInstance.update === 'function')
        {
            this.textDisplayInstance.update(dt); 
        }

        // Route delta down to visual rain layer layout math
        if (this.visuals && typeof this.visuals.update === 'function')
        {
            this.visuals.update(dt);
        }

        // Route delta down to mouse-idle HUD countdown counters
        if (this.hud && typeof this.hud.update === 'function')
        {
            this.hud.update(dt);
        }
    }

    // ── INITIAL SYSTEM START ───────────────────────────────────
    start(intensityId, colorThemeId)
    {
        if (this.environment)
        {
            this.environment.changeIntensity(intensityId);
        }
    }
}
