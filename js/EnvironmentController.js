// ──────────────────────────────────────────────────────────────
// ── ENVIRONMENTCONTROLLER ─────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central coordinator for weather effects and timed events
// Core Role:   Synchronizes audio, visuals and text during weather changes
// Dependencies: CONFIG, AudioManager, RainVisuals, TextDisplay

class EnvironmentController 
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(audio, visuals, text) 
  {
    // Reference core systems
    this.audio = audio;
    this.visuals = visuals;
    this.text = text;
    
    // Thunder scheduling state
    this.thunderTimer = null;
    
    // Initialize persistent weather effects
    this._initRainLoop();
  }

  // Initialize the persistent rain audio layer
  _initRainLoop() 
  {
    if (!this.audio || !this.audio.ctx) return;
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
    if (this.visuals) this.visuals.setIntensity(id);
    if (this.audio) this.audio.setLoopGain('rain', CONFIG.rainLevels[id], CONFIG.audio.rainGainFadeTime);
    // Reset thunder scheduling
    this._scheduleNextStrike(id);
  }

  // Unified storm strike timeline
  _executeStormStrike(intensity) 
  {
    const cfg = CONFIG.thunderCfg[intensity];
    const a = CONFIG.audio;
    if (!cfg) return;

    // Anchor to the exact unshakeable Web Audio hardware clock
    const now = this.audio.ctx.currentTime;

    const payload = { crack: cfg.crack, attackSecs: a.crackAttackSecs, decaySecs: a.crackDecaySecs };

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

    // Fire audio one-shots locked precisely to our hardware clock timeline
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
    if (!this.audio) return;
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

  // ── COMPLETE LIFE CYCLE TEARDOWN ───────────────────────────
  destroy()
  {
    // Force the background lightning/thunder timeline generator clock to stop dead
    clearTimeout(this.thunderTimer);
    this.thunderTimer = null;

    // Erase the pointer pathways to prevent heap layout anchoring leaks
    this.audio = null;
    this.visuals = null;
    this.text = null;

    console.log("EnvironmentController: Background strike clocks and interval engines terminated.");
  }
}
