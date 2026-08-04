// ── EnvironmentController ───────────────────────────────────
//
// Master scene director that unifies:
//   - Weather state transitions
//   - Thunder strike timing
//   - Cross-system effect synchronization
//
// Depends on: CONFIG, AudioManager, RainVisuals, TextDisplay

class EnvironmentController 
{
  constructor(audio, visuals, text) 
  {
    this.audio = audio;
    this.visuals = visuals;
    this.text = text;
    this.thunderTimer = null;
    
    // Start background rain loop
    this._initRainLoop();
  }

  // Initialize the persistent rain audio layer
  _initRainLoop() 
  {
    const a = CONFIG.audio;
    const buffer = AudioManager.createNoiseBuffer(this.audio.ctx, a.noiseBufferSecs);
    this.audio.startLoopingNoise('rain', buffer, 
    {
      type: 'bandpass',
      frequency: a.rainFilterFreq,
      Q: a.rainFilterQ
    });
  }

  // Handle all weather intensity changes
  changeIntensity(id) 
  {
    // Update rain visuals
    this.visuals.setIntensity(id);
    
    // Update audio levels
    this.audio.setLoopGain('rain', CONFIG.rainLevels[id], CONFIG.audio.rainGainFadeTime);
    
    // Reset thunder scheduling
    this._scheduleNextStrike(id);
  }

  // Unified storm strike timeline
  _executeStormStrike(intensity) 
  {
    const cfg = CONFIG.thunderCfg[intensity];
    const a = CONFIG.audio;
    if (!cfg) return;

    // 1. Anchor to the exact unshakeable Web Audio hardware clock
    const now = this.audio.ctx.currentTime;

    const payload = {
      crack: cfg.crack,
      attackSecs: a.crackAttackSecs,
      decaySecs: a.crackDecaySecs
    };

    // 2. Telemetry Log
    console.log(`[STRIKE] perf=${performance.now().toFixed(2)}ms audioCtx=${now.toFixed(4)}s intensity=${intensity}`);

    // 3. FIXED: Stripped requestAnimationFrame wrapper. 
    // Firing these instantly ensures the lightning and font styles inject 
    // onto the page at the exact same millisecond the audio context is triggered.
    if (this.visuals && typeof this.visuals.flashLightning === 'function') 
    {
      this.visuals.flashLightning(payload);
    }
    if (this.text && typeof this.text.flashFont === 'function') 
    {
      this.text.flashFont(payload);
    }

    // 4. Fire audio one-shots locked precisely to our hardware clock timeline
    this._playCrack(now, cfg);
    this._playRumble(now, cfg, intensity);
  }

  // Audio effect methods (moved from RainSounds)
  _playCrack(now, cfg) 
  {
    this.audio.play('thunder_crack', cfg, now);
  }

  // Audio effect methods (moved from RainSounds)
  _playRumble(now, cfg, intensity) 
  {
    const a = CONFIG.audio;
    const layerCount = CONFIG.rumbleLayers[intensity];
    
    for (let l = 0; l < layerCount; l++) 
    {
      const offset = l * (a.rumbleLayerOffset + Math.random() * a.rumbleLayerRand);
      const vol = cfg.rumble / layerCount * (a.rumbleVolRandMin + Math.random() * a.rumbleVolRandMax);
      
      this.audio.play('thunder_rumble_layer', 
      {
        rumbleLen: cfg.rumbleLen,
        fadeMin: cfg.fadeMin,
        fadeMax: cfg.fadeMax,
        intensity: intensity
      }, 
      now + offset);
    }
  }

  // Thunder scheduling (moved from RainSounds)
  _scheduleNextStrike(intensity) 
  {
    clearTimeout(this.thunderTimer);
    
    const { min, range } = CONFIG.thunderDelay[intensity];
    const delay = min + Math.random() * range;
    
    this.thunderTimer = setTimeout(() => 
    {
      this._executeStormStrike(intensity);
      this._scheduleNextStrike(intensity); // Loop
    }, delay);
  }
}
