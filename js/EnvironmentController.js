// // ──────────────────────────────────────────────────────────────
// // ── ENVIRONMENTCONTROLLER ─────────────────────────────────────
// // ──────────────────────────────────────────────────────────────
// //
// // Description: Central coordinator for weather effects and timed events
// // Core Role:   Synchronizes audio, visuals and text during weather changes
// // Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay

class EnvironmentController
{
    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(audio, visuals, text)
    {
        // References to the systems controlled by this coordinator
        this.audio = audio;
        this.visuals = visuals;
        this.text = text;

        // ── DELTA TIME STATE TRACKING ──────────────────────────
        // Counts down remaining seconds until the next storm strike.
        this.strikeCountdown = 0;
        this.isStormActive = false;

        // Current weather intensity
        this.currentIntensity = null;

        // Initialize persistent rain audio
        this._initRainLoop();
    }

    // ── PERSISTENT RAIN AUDIO ──────────────────────────────────
    _initRainLoop()
    {
        if (!this.audio || !this.audio.ctx)
        {
            return;
        }

        const a = CONFIG.audio;

        const buffer = AudioManager.createNoiseBuffer(this.audio.ctx, a.noiseBufferSecs);

        this.audio.startLoopingNoise('rain', buffer, {type: 'bandpass', frequency: a.rainFilterFreq, Q: a.rainFilterQ });
    }

    // ── WEATHER INTENSITY ──────────────────────────────────────
    changeIntensity(id)
    {
        this.currentIntensity = id;
        this.isStormActive = true;

        if (this.visuals)
        {
            this.visuals.setIntensity(id);
        }

        if (this.audio)
        {
            this.audio.setLoopGain('rain', CONFIG.rainLevels[id], CONFIG.audio.rainGainFadeTime);
        }

        // Changing intensity instantly seeds the first delta countdown
        this._scheduleNextStrikeUsingDelta(id);
    }

    // ── MASTER FRAME HEARTBEAT LOOP ────────────────────────────
    // Driven 60 times a second automatically by the core Engine loop handler
    update(dt)
    {
        if (!this.isStormActive) return;

        // Subtract the exact fraction of elapsed step-time (e.g., 0.0166)
        this.strikeCountdown -= dt;

        if (this.strikeCountdown <= 0)
        {
            // Calculate the exact frame delta overshoot.
            // If the countdown hit -0.003, it means the frame carried a 3ms overshoot.
            const deltaOvershoot = Math.max(0, Math.abs(this.strikeCountdown));

            // Execute the strike payload with the correct delta overshoot parameter
            this._executeStormStrike(this.currentIntensity, deltaOvershoot);

            // Instantly schedule the next frame deadline
            this._scheduleNextStrikeUsingDelta(this.currentIntensity);
        }
    }

    // ── DELTA TIME-STEP COOLDOWN GENERATOR ─────────────────────
    _scheduleNextStrikeUsingDelta(intensity)
    {
        const cfg = CONFIG.thunder[intensity];

        if (!cfg)
        {
            return;
        }

        // Convert the random millisecond delay safely into pure SECONDS
        const delayInSeconds = (cfg.minDelay + Math.random() * cfg.delayRange) / CONFIG.System.MS_PER_SECOND;

        // Set the hard frame deadline countdown slider
        this.strikeCountdown = delayInSeconds;

       // console.log('[STORM] Next strike scheduled via delta frame tracker in', `${delayInSeconds.toFixed(2)} seconds`);
    }

    // ── COMPLETE STORM STRIKE EXECUTION ────────────────────────
    _executeStormStrike(intensity, deltaOvershoot = 0)
    {
        const cfg = CONFIG.thunder[intensity];

        if (!cfg)
        {
            console.error('EnvironmentController: No thunder configuration for intensity:', intensity);
            return;
        }

        if (!this.audio || !this.audio.ctx)
        {
            console.warn('EnvironmentController: Audio system unavailable for storm strike.');
            return;
        }

        const now = this.audio.ctx.currentTime;

        const payload = { crack: cfg.crackVolume, lightningPeak: cfg.lightningPeak, attackSecs: cfg.flashAttack, decaySecs: cfg.flashDecay };

        // console.log(
        //     '[STORM] STRIKE PULSE',
        //     {
        //         intensity,
        //         deltaOvershoot: `${deltaOvershoot.toFixed(3)}s`,
        //         lightningPeak: cfg.lightningPeak,
        //         flashAttack: cfg.flashAttack,
        //         flashDecay: cfg.flashDecay,
        //         crackVolume: cfg.crackVolume,
        //         rumbleVolume: cfg.rumbleVolume
        //     }
        // );

        // Forward deltaOvershoot straight into your visual controllers
        if (this.visuals && typeof this.visuals.flashLightning === 'function')
        {
            this.visuals.flashLightning(payload, deltaOvershoot);
        }

        // Forward deltaOvershoot straight into your text layout managers
        if (this.text && typeof this.text.flashFont === 'function')
        {
            this.text.flashFont(payload, deltaOvershoot);
        }

        // Forward deltaOvershoot parameter straight down to your audio nodes
        this._playCrack(now, cfg, deltaOvershoot);
        this._playRumble(now, cfg, intensity, deltaOvershoot);
    }

    // ── THUNDER CRACK ──────────────────────────────────────────
    _playCrack(now, cfg, deltaOvershoot = 0)
    {
        if (!this.audio) 
        {
            return;
        }
        
        this.audio.play('thunder_crack', cfg, now, deltaOvershoot);
    }

    // ── THUNDER RUMBLE ─────────────────────────────────────────
    _playRumble(now, cfg, intensity, deltaOvershoot = 0)
    {
        if (!this.audio) 
        {
            return;
        }

        const a = CONFIG.audio;
        const layerCount = CONFIG.rumbleLayers[intensity];

        for (let l = 0; l < layerCount; l++)
        {
            const offset = l * (a.rumbleLayerOffset + Math.random() * a.rumbleLayerRand);
            const vol = cfg.rumbleVolume / layerCount * (a.rumbleVolRandMin + Math.random() * a.rumbleVolRandMax);

            this.audio.play(
                'thunder_rumble_layer',
                {
                    rumbleLen: cfg.rumbleLength,
                    fadeMin: cfg.fadeMin,
                    fadeMax: cfg.fadeMax,
                    intensity,
                    volume: vol
                },
                now + offset,
                deltaOvershoot
            );
        }
    }

    // ── COMPLETE LIFE CYCLE TEARDOWN ───────────────────────────
    destroy()
    {
        this.isStormActive = false;
        this.strikeCountdown = 0;

        this.audio = null;
        this.visuals = null;
        this.text = null;

        console.log('EnvironmentController: Delta system and framework tracking destroyed.');
    }
}
