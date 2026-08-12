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

        // HUD receives its own configuration because HUD owns its auto-hide behavior and presentation lifecycle.
        this.hud = new HUD(CONFIG.hud);

        this.audio = new AudioManager(CONFIG.masterVolume);
        this.visuals = new RainVisuals();

        this.environment = new EnvironmentController(this.audio, this.visuals, this.textDisplayInstance);

        // UIManager only needs the systems it mediates.
        this.ui = new UIManager(this.audio, this.visuals, this.environment);

        // ── UI COMPONENT REGISTRATION ─────────────────────────
        this.ui.registerComponent('primary_hud', this.hud); 
        this.ui.registerComponent('text_display', this.textDisplayInstance);

        // Handle browser audio autoplay restrictions
        document.addEventListener('click', () => this.audio.resume(), { once: true });

        // ── NEW: FIXED TIMESTEP LOOP PROPERTIES ────────────────
        this.FIXED_TIMESTEP = 1 / 60;    // target update rate — 60fps
        this.MAX_FRAME_TIME = 0.25;      // clamp large frame spikes to prevent spiral of death
        this.MAX_STEPS      = 5;         // max update steps per frame before draining accumulator

        this.lastTime       = performance.now();
        this.accumulator    = 0;

        // Bind the loop context so it can safely recurse via requestAnimationFrame
        this._loopBound = this.gameLoop.bind(this);

        // Reset lastTime on tab focus to prevent large accumulated deltas after switching tabs
        document.addEventListener("visibilitychange", () =>
        {
            if (document.visibilityState === "visible") 
            {
                this.lastTime = performance.now();
            }
        });

        // Start with default weather intensity and first configured color theme
        this.start(CONFIG.intensitiesModes.RAIN, Object.keys(CONFIG.colors)[0]);

        // Kick off the heartbeat loop execution
        requestAnimationFrame(this._loopBound);
    }

    // ── CORE GAME LOOP ─────────────────────────────────────────
    gameLoop()
    {
        try
        {
            const now = performance.now();
            // Calculate time passed since last frame and clamp any massive lag spikes
            const frameTime = Math.min((now - this.lastTime) / 1000, this.MAX_FRAME_TIME);
            this.lastTime        = now;
            this.accumulator    += frameTime;

            let steps = 0;
            // Step the simulation logic in fixed intervals
            while (this.accumulator >= this.FIXED_TIMESTEP && steps < this.MAX_STEPS)
            {
                // Ticks down your storm and strike timelines
                if (this.environment && typeof this.environment.update === 'function')
                {
                    this.environment.update(this.FIXED_TIMESTEP);
                }

                // Ticks down your visual font text fades
                if (this.textDisplayInstance && typeof this.textDisplayInstance.update === 'function')
                {
                    this.textDisplayInstance.update(this.FIXED_TIMESTEP); 
                }

                // Ticks your rain graphic layer positioning calculations
                if (this.visuals && typeof this.visuals.update === 'function')
                {
                    this.visuals.update(this.FIXED_TIMESTEP);
                }

                // Ticks down your mouse-idle HUD auto-hide counters
                if (this.hud && typeof this.hud.update === 'function')
                {
                    // Now the HUD timer updates independently on its own clean track!
                    this.hud.update(this.FIXED_TIMESTEP);
                }

                this.accumulator -= this.FIXED_TIMESTEP;
                steps++;
            }


            // Hit the step cap — drain accumulator to avoid a catchup spiral next frame
            if (steps >= this.MAX_STEPS) 
            {
                this.accumulator = 0;
            }

            // Render/Visual frame pulse updates
            if (this.visuals && typeof this.visuals.render === 'function')
            {
                this.visuals.render();
            }
        }
        catch (e) 
        { 
            console.error("Engine gameLoop error:", e); 
        }
        finally   
        { 
            requestAnimationFrame(this._loopBound); 
        }
    }

    // ── INITIAL SYSTEM START ───────────────────────────────────
    start(intensityId, colorThemeId)
    {
        if (this.environment)
        {
            this.environment.changeIntensity(intensityId);
        }
        
        // (Include any theme configuration assignment code if your original start method had it)
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

        // Clear out UIManager event infrastructure
        if (this.ui && typeof this.ui.destroy === 'function')
        {
            this.ui.destroy();
        }

        // Clear out core engine infrastructure layers
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
        this.audio = null;
        this.visuals = null;
        this.environment = null;
        this.ui = null;

        console.log("Engine: Teardown complete. All memory links severed safely.");
    }

}


