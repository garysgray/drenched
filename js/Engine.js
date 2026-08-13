// // ──────────────────────────────────────────────────────────────
// // ── ENGINE ───────────────────────────────────────────────────
// // ──────────────────────────────────────────────────────────────
// //
// // Description: Core system coordinator that initializes and connects all subsystems
// // Core Role:   Maintains references to all major systems and handles their interactions
// // Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay, HUD, UIManager
// //

class Engine
{
    // ── PRIVATE PROPERTIES ──────────────────────────────────────
    #audio;
    #textDisplayInstance;
    #hud;
    #visuals;
    #environment;
    #ui;

    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor()
    {
        // Get user settings as a temporary local data object
        const settings = this.#loadSettingsFromStorage();

        // Now instantiate your core layers cleanly using your class properties
        this.#audio = new AudioManager(settings.currentVolume / CONFIG.System.VOLUME_SCALE_FACTOR);
        this.#textDisplayInstance = new TextDisplay();
        this.#hud = new HUD(CONFIG.hud);
        this.#visuals = new RainVisuals();
        this.#environment = new EnvironmentController(this.#audio, this.#visuals, this.#textDisplayInstance);
        this.#ui = new UIManager(this.#audio, this.#visuals, this.#environment);

        // UI COMPONENT REGISTRATION
        this.#ui.registerComponent('primary_hud', this.#hud); 
        this.#ui.registerComponent('text_display', this.#textDisplayInstance);

        // Handle browser audio autoplay restrictions
        document.addEventListener('click', () =>{ this.#audio.resume(); }, { once: true });

        // Trigger system startup sequence passing the assigned instance values
        this.start(settings.activeMode, settings.activeTheme, settings.currentMute, settings.currentScrollMode, settings.currentTextMode, settings.currentVolume, settings.currentScrollSpeed);
    }

    // ── PUBLIC SUBSYSTEM ACCESSORS ─────────────────────────────
    get audio() { return this.#audio; }
    get textDisplayInstance() { return this.#textDisplayInstance; }
    get hud() { return this.#hud; }
    get visuals() { return this.#visuals; }
    get environment() { return this.#environment; }
    get ui() { return this.#ui; }

    // SEPARATE STORAGE LOADER ───────────────────
    // Returns a pure temporary data object for immediate startup use
    #loadSettingsFromStorage()
    {
        return {
            activeTheme:       StorageUtil.get('colorTheme', Object.keys(CONFIG.colors)),
            activeMode:        StorageUtil.get('rainIntensity', CONFIG.intensitiesModes.RAIN),
            currentMute:       StorageUtil.get('muteMode', false),
            currentScrollMode: StorageUtil.get('scrollMode', false),
            currentTextMode:   StorageUtil.get('textMode', false),
            currentVolume:     StorageUtil.get('masterVolume', CONFIG.masterVolume),
            currentScrollSpeed: StorageUtil.get('scrollSpeed', CONFIG.scroll.defaultSpeedSecs)
        };
    }
    
    // Called by Main's gameLoop with the FIXED_TIMESTEP delta time
    update(dt)
    {
        if (this.#environment && typeof this.#environment.update === 'function') this.#environment.update(dt);
        if (this.#textDisplayInstance && typeof this.#textDisplayInstance.update === 'function') this.#textDisplayInstance.update(dt); 
        if (this.#visuals && typeof this.#visuals.update === 'function') this.#visuals.update(dt);
        if (this.#hud && typeof this.#hud.update === 'function') this.#hud.update(dt);
    }
    
    // ── INITIAL SYSTEM START ───────────────────────────────────
    start(intensityId, colorThemeId, currentMute, currentScrollMode, currentTextMode, currentVolume, currentScrollSpeed)
    {
        if (this.#environment) this.#environment.changeIntensity(intensityId);
        if (this.#visuals && typeof this.#visuals.setColor === 'function') this.#visuals.setColor(colorThemeId);

        if (this.#audio)
        {
            if (typeof this.#audio.setMute === 'function') 
            {
                this.#audio.setMute(currentMute);
            } 
            else 
            {
                this.#audio.isMuted = currentMute; 
            }

            if (typeof this.#audio.setMasterVolume === 'function') 
            {
                this.#audio.setMasterVolume(currentVolume / CONFIG.System.VOLUME_SCALE_FACTOR);
            } 
            else 
            {
                this.#audio.masterVolume = currentVolume / CONFIG.System.VOLUME_SCALE_FACTOR;
            }
        }

        // BROADCAST INITIAL LAYOUT STATES TO UI COMPONENTS
        if (this.#ui && typeof this.#ui.initLayoutStates === 'function')
        {
            this.#ui.initLayoutStates([
                { actionType: CONFIG.UIActions.SET_RAIN_INTENSITY, value: intensityId },
                { actionType: CONFIG.UIActions.SET_COLOR, value: colorThemeId },
                { actionType: CONFIG.UIActions.TOGGLE_MUTE, value: currentMute },
                { actionType: CONFIG.UIActions.TOGGLE_SCROLL_MODE, value: currentScrollMode },
                { actionType: CONFIG.UIActions.SET_TEXT_MODE, value: currentTextMode },
                { actionType: CONFIG.UIActions.SET_MASTER_VOLUME, value: currentVolume },
                { actionType: CONFIG.UIActions.SET_SCROLL_SPEED, value: currentScrollSpeed }
            ]);
        }
    }
    
    // ── MASTER MASTER CLEANUP LIFECYCLE ────────────────────────
    shutdown()
    {
        console.log("Engine: Commencing complete system teardown...");
        if (this.#ui && this.#ui.components) 
        {
            this.#ui.components.forEach((c) => { if (c && typeof c.destroy === 'function') c.destroy(); });
        }
        if (this.#ui && typeof this.#ui.destroy === 'function') this.#ui.destroy();
        if (this.#audio && typeof this.#audio.stopAll === 'function') this.#audio.stopAll();
        if (this.#visuals && typeof this.#visuals.destroy === 'function') this.#visuals.destroy();
        if (this.#environment && typeof this.#environment.destroy === 'function') this.#environment.destroy();

        this.#audio = null; this.#visuals = null; this.#environment = null; this.#ui = null;
        console.log("Engine: Teardown complete.");
    }
}
