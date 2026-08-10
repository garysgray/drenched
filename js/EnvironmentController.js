// // ──────────────────────────────────────────────────────────────
// // ── ENVIRONMENTCONTROLLER ─────────────────────────────────────
// // ──────────────────────────────────────────────────────────────
// //
// // Description: Central coordinator for weather effects and timed events
// // Core Role:   Synchronizes audio, visuals and text during weather changes
// // Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay

// class EnvironmentController 
// {
//   // ── CONSTRUCTOR ────────────────────────────────────────────
//   constructor(audio, visuals, text) 
//   {
//     // Reference core systems
//     this.audio = audio;
//     this.visuals = visuals;
//     this.text = text;
    
//     // Thunder scheduling state
//     this.thunderTimer = null;
    
//     // Initialize persistent weather effects
//     this._initRainLoop();
//   }

//   // Initialize the persistent rain audio layer
//   _initRainLoop() 
//   {
//     if (!this.audio || !this.audio.ctx) return;
//     const a = CONFIG.audio;
//     const buffer = AudioManager.createNoiseBuffer(this.audio.ctx, a.noiseBufferSecs);
//     this.audio.startLoopingNoise('rain', buffer, 
//     {
//       type: 'bandpass',
//       frequency: a.rainFilterFreq,
//       Q: a.rainFilterQ
//     });
//   }

//   // Handle all weather intensity changes
//   changeIntensity(id)
//   {
//       if (!CONFIG.rainLevels || !(id in CONFIG.rainLevels))
//       {
//           console.warn(`EnvironmentController: Unknown rain intensity "${id}".`);
//           return;
//       }

//       this.currentIntensity = id;

//       if (this.visuals)
//       {
//           this.visuals.setIntensity(id);
//       }

//       if (this.audio)
//       {
//           this.audio.setLoopGain(
//               'rain',
//               CONFIG.rainLevels[id],
//               CONFIG.audio.rainGainFadeTime
//           );
//       }

//       this._scheduleNextStrike(id);
//   }

//   // Unified storm strike timeline
//   _executeStormStrike(intensity) 
//   {
//     const cfg = CONFIG.thunderCfg[intensity];
//     const a = CONFIG.audio;
//     if (!cfg) return;

//     // Anchor to the exact unshakeable Web Audio hardware clock
//     const now = this.audio.ctx.currentTime;

//     const payload = { crack: cfg.crack, attackSecs: a.crackAttackSecs, decaySecs: a.crackDecaySecs };

//     // Firing these instantly ensures the lightning and font styles inject 
//     // onto the page at the exact same millisecond the audio context is triggered.
//     if (this.visuals && typeof this.visuals.flashLightning === 'function') 
//     {
//       this.visuals.flashLightning(payload);
//     }
//     if (this.text && typeof this.text.flashFont === 'function') 
//     {
//       this.text.flashFont(payload);
//     }

//     // Fire audio one-shots locked precisely to our hardware clock timeline
//     this._playCrack(now, cfg);
//     this._playRumble(now, cfg, intensity);
//   }

//   // Audio effect methods (moved from RainSounds)
//   _playCrack(now, cfg) 
//   {
//     this.audio.play('thunder_crack', cfg, now);
//   }

//   // Audio effect methods (moved from RainSounds)
//   _playRumble(now, cfg, intensity) 
//   {
//     if (!this.audio) return;
//     const a = CONFIG.audio;
//     const layerCount = CONFIG.rumbleLayers[intensity];
    
//     for (let l = 0; l < layerCount; l++) 
//     {
//       const offset = l * (a.rumbleLayerOffset + Math.random() * a.rumbleLayerRand);
//       const vol = cfg.rumble / layerCount * (a.rumbleVolRandMin + Math.random() * a.rumbleVolRandMax);
      
//       this.audio.play('thunder_rumble_layer', 
//       {
//         rumbleLen: cfg.rumbleLen,
//         fadeMin: cfg.fadeMin,
//         fadeMax: cfg.fadeMax,
//         intensity: intensity
//       }, 
//       now + offset);
//     }
//   }

//   // Thunder scheduling (moved from RainSounds)
//   _scheduleNextStrike(intensity)
//   {
//       clearTimeout(this.thunderTimer);

//       const delayConfig = CONFIG.thunderDelay[intensity];

//       if (!delayConfig)
//       {
//           console.warn(`EnvironmentController: No thunder delay configuration for "${intensity}".`);

//           this.thunderTimer = null;
//           return;
//       }

//       const { min, range } = delayConfig;
//       const delay = min + Math.random() * range;

//       this.thunderTimer = setTimeout(() =>
//       {
//           this._executeStormStrike(intensity);
//           this._scheduleNextStrike(intensity);
//       }, delay);
//   }

//   // ── COMPLETE LIFE CYCLE TEARDOWN ───────────────────────────
//   destroy()
//   {
//     // Force the background lightning/thunder timeline generator clock to stop dead
//     clearTimeout(this.thunderTimer);
//     this.thunderTimer = null;

//     // Erase the pointer pathways to prevent heap layout anchoring leaks
//     this.audio = null;
//     this.visuals = null;
//     this.text = null;

//     console.log("EnvironmentController: Background strike clocks and interval engines terminated.");
//   }
// }
// ──────────────────────────────────────────────────────────────
// ── ENVIRONMENTCONTROLLER ─────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central coordinator for weather effects and timed events
// Core Role:   Synchronizes audio, lightning and font effects
// Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay
//
// IMPORTANT:
//
// A storm strike is ONE event.
//
// When a strike occurs:
//
//     STRIKE
//       │
//       ├──► Lightning
//       │
//       ├──► Font Flash
//       │
//       ├──► Thunder Crack
//       │
//       └──► Thunder Rumble
//
// This means there can never be a thunder strike without its
// corresponding lightning and font flash.
//
// The delay only determines WHEN the next complete strike occurs.
// ──────────────────────────────────────────────────────────────

class EnvironmentController
{
    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(audio, visuals, text)
    {
        // References to the systems controlled by this coordinator
        this.audio = audio;
        this.visuals = visuals;
        this.text = text;

        // Timer responsible for scheduling the NEXT complete strike
        this.thunderTimer = null;

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

        const buffer = AudioManager.createNoiseBuffer(
            this.audio.ctx,
            a.noiseBufferSecs
        );

        this.audio.startLoopingNoise(
            'rain',
            buffer,
            {
                type: 'bandpass',
                frequency: a.rainFilterFreq,
                Q: a.rainFilterQ
            }
        );
    }

    // ── WEATHER INTENSITY ──────────────────────────────────────
    changeIntensity(id)
    {
        this.currentIntensity = id;

        if (this.visuals)
        {
            this.visuals.setIntensity(id);
        }

        if (this.audio)
        {
            this.audio.setLoopGain(
                'rain',
                CONFIG.rainLevels[id],
                CONFIG.audio.rainGainFadeTime
            );
        }

        // Changing intensity also restarts the strike schedule.
        this._scheduleNextStrike(id);
    }

    // ── COMPLETE STORM STRIKE ──────────────────────────────────
    //
    // THIS is the master event.
    //
    // Everything associated with a lightning/thunder event
    // originates here.
    //
    _executeStormStrike(intensity)
    {
        const cfg = CONFIG.thunder[intensity];

        if (!cfg)
        {
            console.error(
                'EnvironmentController: No thunder configuration for intensity:',
                intensity
            );

            return;
        }

        if (!this.audio || !this.audio.ctx)
        {
            console.warn(
                'EnvironmentController: Audio system unavailable for storm strike.'
            );

            return;
        }

        // Use the exact Web Audio clock for synchronized audio scheduling.
        const now = this.audio.ctx.currentTime;

        // ── BUILD ONE SHARED STRIKE PAYLOAD ────────────────────
        //
        // The exact same timing information is sent to both
        // lightning and font flash.
        //
        // This is what keeps the visual effects synchronized.

        const payload =
        {
            crack: cfg.crackVolume,
            lightningPeak: cfg.lightningPeak,
            attackSecs: cfg.flashAttack,
            decaySecs: cfg.flashDecay
        };

        console.log(
            '[STORM] STRIKE',
            {
                intensity,
                lightningPeak: cfg.lightningPeak,
                flashAttack: cfg.flashAttack,
                flashDecay: cfg.flashDecay,
                crackVolume: cfg.crackVolume,
                rumbleVolume: cfg.rumbleVolume
            }
        );

        // ── LIGHTNING ──────────────────────────────────────────
        //
        // Lightning receives the shared strike payload.

        if (
            this.visuals &&
            typeof this.visuals.flashLightning === 'function'
        )
        {
            this.visuals.flashLightning(payload);
        }

        // ── FONT FLASH ─────────────────────────────────────────
        //
        // Font receives the EXACT SAME strike payload.
        //
        // Therefore there is no independent font-flash timer.
        // The font flashes because THIS lightning strike happened.

        if (
            this.text &&
            typeof this.text.flashFont === 'function'
        )
        {
            this.text.flashFont(payload);
        }

        // ── THUNDER CRACK ──────────────────────────────────────
        //
        // Crack starts at the same Web Audio timestamp as the
        // visual strike.

        this._playCrack(now, cfg);

        // ── THUNDER RUMBLE ──────────────────────────────────────

        this._playRumble(now, cfg, intensity);
    }

    // ── THUNDER CRACK ──────────────────────────────────────────
    _playCrack(now, cfg)
    {
        if (!this.audio)
        {
            return;
        }

        this.audio.play(
            'thunder_crack',
            cfg,
            now
        );
    }

    // ── THUNDER RUMBLE ─────────────────────────────────────────
    _playRumble(now, cfg, intensity)
    {
        if (!this.audio)
        {
            return;
        }

        const a = CONFIG.audio;
        const layerCount = CONFIG.rumbleLayers[intensity];

        for (let l = 0; l < layerCount; l++)
        {
            const offset =
                l *
                (
                    a.rumbleLayerOffset +
                    Math.random() * a.rumbleLayerRand
                );

            const vol =
                cfg.rumbleVolume /
                layerCount *
                (
                    a.rumbleVolRandMin +
                    Math.random() * a.rumbleVolRandMax
                );

            this.audio.play(
                'thunder_rumble_layer',
                {
                    rumbleLen: cfg.rumbleLength,
                    fadeMin: cfg.fadeMin,
                    fadeMax: cfg.fadeMax,
                    intensity,
                    volume: vol
                },
                now + offset
            );
        }
    }

    // ── NEXT STRIKE SCHEDULER ──────────────────────────────────
    //
    // This controls ONLY the time between complete storm strikes.
    //
    // Example:
    //
    // Storm:
    //     wait 8-16 seconds
    //          ↓
    //       STRIKE
    //          ↓
    //     wait 8-16 seconds
    //          ↓
    //       STRIKE
    //
    // Every STRIKE automatically contains lightning + font +
    // thunder.

    _scheduleNextStrike(intensity)
    {
        clearTimeout(this.thunderTimer);

        const cfg = CONFIG.thunder[intensity];

        if (!cfg)
        {
            return;
        }

        const delay =
            cfg.minDelay +
            Math.random() * cfg.delayRange;

        console.log(
            '[STORM] Next strike scheduled in',
            `${(delay / 1000).toFixed(2)} seconds`
        );

        this.thunderTimer = setTimeout(() =>
        {
            // Create ONE complete synchronized storm event.
            this._executeStormStrike(intensity);

            // Schedule the next complete event.
            this._scheduleNextStrike(intensity);

        }, delay);
    }

    // ── COMPLETE LIFE CYCLE TEARDOWN ───────────────────────────
    destroy()
    {
        clearTimeout(this.thunderTimer);
        this.thunderTimer = null;

        this.audio = null;
        this.visuals = null;
        this.text = null;

        console.log(
            'EnvironmentController: Storm scheduler and system references destroyed.'
        );
    }
}