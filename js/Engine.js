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
        // Set up defaults and pull your values straight from storage
        let activeTheme = Object.keys(CONFIG.colors)[0]; 
        let activeMode = CONFIG.intensitiesModes.RAIN;   
        let currentMute = false;                        
        let currentScrollMode = false; 
        let currentTextMode = false;
        let currentVolume = CONFIG.masterVolume; 
        let currentScrollSpeed = CONFIG.scroll.defaultSpeedSecs;
        
        try 
        {
            const savedData = localStorage.getItem("siteSettings");
            if (savedData) 
            {
                const settings = JSON.parse(savedData);
                
                if (settings.colorTheme) activeTheme = settings.colorTheme;
                if (settings.rainIntensity) activeMode = settings.rainIntensity;
                if (settings.muteMode !== undefined) currentMute = settings.muteMode;
                if (settings.scrollMode !== undefined) currentScrollMode = settings.scrollMode;
                if (settings.textMode !== undefined) currentTextMode = settings.textMode;
                if (settings.masterVolume !== undefined) currentVolume = settings.masterVolume;
                if (settings.scrollSpeed !== undefined) currentScrollSpeed = settings.scrollSpeed;
            }
        } 
        catch(e) 
        {
            console.error("Engine: Failed to read initial theme from storage", e);
        }

        // Instantiate core layers using the parsed storage properties cleanly
        this.audio = new AudioManager(currentVolume / 100);
        this.textDisplayInstance = new TextDisplay();
        this.hud = new HUD(CONFIG.hud);
        this.visuals = new RainVisuals();
        this.environment = new EnvironmentController(this.audio, this.visuals, this.textDisplayInstance);
        this.ui = new UIManager(this.audio, this.visuals, this.environment);

        // UI COMPONENT REGISTRATION
        this.ui.registerComponent('primary_hud', this.hud); 
        this.ui.registerComponent('text_display', this.textDisplayInstance);

        // Handle browser audio autoplay restrictions
        document.addEventListener('click', () => this.audio.resume(), { once: true });

        // Trigger system startup sequence
        this.start(activeMode, activeTheme, currentMute, currentScrollMode, currentTextMode, currentVolume, currentScrollSpeed);
    }
    // ── CORE UPDATE TICK ───────────────────────────────────────
    // Called by Main's gameLoop with the FIXED_TIMESTEP delta time
    update(dt)
    {
        if (this.environment && typeof this.environment.update === 'function') this.environment.update(dt);
        if (this.textDisplayInstance && typeof this.textDisplayInstance.update === 'function') this.textDisplayInstance.update(dt); 
        if (this.visuals && typeof this.visuals.update === 'function') this.visuals.update(dt);
        if (this.hud && typeof this.hud.update === 'function') this.hud.update(dt);
    }
    // ── INITIAL SYSTEM START ───────────────────────────────────
        start(intensityId, colorThemeId, currentMute, currentScrollMode, currentTextMode, currentVolume, currentScrollSpeed)
    {
        if (this.environment) this.environment.changeIntensity(intensityId);
        if (this.visuals && typeof this.visuals.setColor === 'function') this.visuals.setColor(colorThemeId);

        if (this.audio)
        {
            if (typeof this.audio.setMute === 'function') {
                this.audio.setMute(currentMute);
            } else {
                this.audio.isMuted = currentMute; 
            }

            if (typeof this.audio.setMasterVolume === 'function') {
                this.audio.setMasterVolume(currentVolume / 100);
            } else {
                this.audio.masterVolume = currentVolume / 100;
            }
        }

        // BROADCAST INITIAL LAYOUT STATES TO UI COMPONENTS
        if (this.ui && typeof this.ui.initLayoutStates === 'function')
        {
            this.ui.initLayoutStates([
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
    // ── MASTER CLEANUP LIFECYCLE ───────────────────────────────
    shutdown()
    {
        console.log("Engine: Commencing complete system teardown...");
        if (this.ui && this.ui.components) 
        {
            this.ui.components.forEach((c) => { if (c && typeof c.destroy === 'function') c.destroy(); });
        }
        if (this.ui && typeof this.ui.destroy === 'function') this.ui.destroy();
        if (this.audio && typeof this.audio.stopAll === 'function') this.audio.stopAll();
        if (this.visuals && typeof this.visuals.destroy === 'function') this.visuals.destroy();
        if (this.environment && typeof this.environment.destroy === 'function') this.environment.destroy();

        this.audio = null; this.visuals = null; this.environment = null; this.ui = null;
        console.log("Engine: Teardown complete.");
    }
}
