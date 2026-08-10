// ──────────────────────────────────────────────────────────────
// ── ENGINE ───────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Core system coordinator that initializes and connects all subsystems
// Core Role:   Maintains references to all major systems and handles their interactions
// Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay, HUD, UIManager
//
// Design Notes:
// - Engine owns system creation and startup configuration.
// - Engine supplies UIManager with configuration from CONFIG.
// - Engine builds the initial UI state payload.
// - UIManager remains responsible for UI event routing and component broadcasting.
// ──────────────────────────────────────────────────────────────

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

        this.environment = new EnvironmentController( this.audio,this.visuals,textDisplayInstance);

        // Pass HUD configuration directly from CONFIG.
        // UIManager consumes these settings but does not define them.
        this.ui = new UIManager( this.audio, this.visuals, this.environment,CONFIG.hud );

        // ── UI COMPONENT REGISTRATION ─────────────────────────
        this.ui.registerComponent('primary_hud', HUDInstance);

        this.ui.registerComponent( 'text_display', textDisplayInstance);

        // Handle browser audio autoplay restrictions
        document.addEventListener( 'click', () => this.audio.resume(), { once: true } );

        // Start with default weather intensity and color theme red
        this.start( CONFIG.intensitiesModes.RAIN, Object.keys(CONFIG.colors)[0]);
    }

    // ── SYSTEM STARTUP ────────────────────────────────────────
    start(intensityId, colorId)
    {
        // Initialize environment with default state
        this.environment.changeIntensity(intensityId);

        // Initialize visual color theme
        this.visuals.setColor(colorId);

        // Build the initial UI state as data rather than passing
        // individual settings directly into UIManager.
        //
        // Engine owns the startup configuration because Engine
        // is responsible for coordinating system initialization.
        const initialStates = 
        [
            { actionType: CONFIG.UIActions.SET_RAIN_INTENSITY, value: intensityId },
            { actionType: CONFIG.UIActions.SET_COLOR,  value: colorId },
            { actionType: CONFIG.UIActions.SET_SCROLL_SPEED, value: CONFIG.scroll.defaultSpeedSecs },
            { actionType: CONFIG.UIActions.SET_MASTER_VOLUME, value: Math.round(CONFIG.masterVolume * 100)}
        ];

        // Send the complete initial state to UIManager.
        // UIManager simply distributes it to registered components.
        this.ui.initLayoutStates(initialStates);
    }

    // ── MASTER CLEANUP LIFECYCLE ───────────────────────────────
    shutdown()
    {
        console.log('Engine: Commencing complete system teardown...');

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
        if (this.ui && typeof this.ui.destroy === 'function')
        {
            this.ui.destroy();
        }

        if (this.audio && typeof this.audio.stopAll === 'function')
        {
            this.audio.stopAll();
        }

        if (this.visuals && typeof this.visuals.destroy === 'function')
        {
            this.visuals.destroy();
        }

        if (this.environment && typeof this.environment.destroy === 'function')
        {
            this.environment.destroy();
        }

        // Sever all remaining object ties for the Garbage Collector
        this.audio       = null;
        this.visuals     = null;
        this.environment = null;
        this.ui          = null;

        console.log('Engine: Teardown complete. All memory links severed safely.');
    }

}