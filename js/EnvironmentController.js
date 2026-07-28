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
    this.audio.setLoopGain(
      'rain',
      CONFIG.rainLevels[id],
      CONFIG.audio.rainGainFadeTime
    );
    
    // Reset thunder scheduling
    this._scheduleNextStrike(id);
  }

  // Unified storm strike timeline
  _executeStormStrike(intensity) 
  {
    const cfg = CONFIG.thunderCfg[intensity];
    const a = CONFIG.audio;
    const now = this.audio.ctx.currentTime;
    
    // Shared payload for visual/text sync
    const payload = 
    {
      intensity,
      crack: cfg.crack,
      attackSecs: a.crackAttackSecs,
      decaySecs: a.crackDecaySecs
    };
    
    // Instant visual/text effects
    this.visuals.flashLightning(payload);
    this.text.flashFont(payload);
    
    // Audio timeline
    this._playCrack(now, cfg);
    this._playRumble(now, cfg, intensity);
  }

  // Audio effect methods (moved from RainSounds)
  _playCrack(now, cfg) 
  {
    const a = CONFIG.audio;
    const buf = AudioManager.createNoiseBuffer(this.audio.ctx, a.crackLenSecs);
    
    this.audio.playOneShot(buf, null, 
    {
      peak: cfg.crack,
      attack: a.crackAttackSecs,
      endTime: a.crackDecaySecs,
      startTime: now
    });
  }

  _playRumble(now, cfg, intensity) 
  {
    const a = CONFIG.audio;
    const layerCount = CONFIG.rumbleLayers[intensity];
    
    for (let l = 0; l < layerCount; l++) 
    {
      const offset = l * (a.rumbleLayerOffset + Math.random() * a.rumbleLayerRand);
      const buf = AudioManager.createNoiseBuffer(this.audio.ctx, cfg.rumbleLen);
      const vol = cfg.rumble / layerCount * (a.rumbleVolRandMin + Math.random() * a.rumbleVolRandMax);
      
      this.audio.playOneShot(buf, [
        { type: 'lowshelf', frequency: a.rumbleShelfFreq, gain: CONFIG.rumbleShelfGain[intensity] },
        { type: 'lowpass', frequency: CONFIG.rumbleHiCut[intensity] }
      ], {
        peak: vol,
        attack: a.rumbleAttackSecs,
        holdAt: a.rumbleHoldSecs,
        endTime: cfg.fadeMin + Math.random() * cfg.fadeMax,
        startTime: now + offset
      });
    }
  }

  // Thunder scheduling (moved from RainSounds)
  _scheduleNextStrike(intensity) 
  {
    clearTimeout(this.thunderTimer);
    
    const { min, range } = CONFIG.thunderDelay[intensity];
    const delay = min + Math.random() * range;
    
    this.thunderTimer = setTimeout(() => {
      this._executeStormStrike(intensity);
      this._scheduleNextStrike(intensity); // Loop
    }, delay);
  }
}