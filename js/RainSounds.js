// ── RainSounds ────────────────────────────────────────────────
//
// Weather scene sound recipes built exclusively on top of AudioManager.
// Tracks environmental ambient noise audio states.
//
// Depends on: CONFIG, AudioManager

class RainSounds
{
  /**
   * Caches the system engine reference pointer and triggers the starting rain loop.
   * @param {AudioManager} audio - The initialized master audio controller.
   * @param {Function|null} onStrike - Called instantly when a thunder strike fires.
   *   Receives `{ intensity, crack, attackSecs, decaySecs }` so Engine can sync visuals.
   */
  constructor(audio, onStrike = null)
  {
    this.audio        = audio;
    this.onStrike     = onStrike;
    this.thunderTimer = null; // Holds the active timeout loop handle for thunder scheduling

    this._initRain();
  }

  /**
   * Internal generator to boot up and play the endless ambient background rain looping audio layer.
   */
  _initRain()
  {
    const a      = CONFIG.audio;
    const buffer = AudioManager.createNoiseBuffer(this.audio.ctx, a.noiseBufferSecs);

    this.audio.startLoopingNoise('rain', buffer, {
      type:      'bandpass',
      frequency: a.rainFilterFreq,
      Q:         a.rainFilterQ,
    });
  }

  /**
   * Fires a combined multi-layered localized thunder event payload at the active browser timestamp.
   * Notifies Engine via onStrike callback before playing crack audio so the visual flash is in sync.
   */
  _strike(intensity)
  {
    const now = this.audio.ctx.currentTime;
    const cfg = CONFIG.thunderCfg[intensity];
    const a   = CONFIG.audio;

    if (!cfg) {
      console.warn("Thunder configuration missing for intensity:", intensity);
      return;
    }

    // ── Lightning trigger path (audio → engine → visuals) ─────
    // RainSounds._strike  →  onStrike callback  →  Engine._onThunderStrike  →  RainVisuals.flashLightning
    if (this.onStrike)
    {
      this.onStrike({
        intensity,
        crack:      cfg.crack,
        attackSecs: a.crackAttackSecs,
        decaySecs:  a.crackDecaySecs,
      });
    }

    this._playCrack(now, cfg);             // Execute the sharp initial visual strike noise component
    this._playRumble(now, cfg, intensity); // Execute the low-end vibrating sonic tail rolling sequence
    this._scheduleNextStrike(intensity);   // Seed the timer countdown to determine the next strike event
  }

  /**
   * Internal one-shot processor mapping the sharp high-gain crack burst sound event.
   */
  _playCrack(now, cfg)
  {
    const a   = CONFIG.audio;
    const buf = AudioManager.createNoiseBuffer(this.audio.ctx, a.crackLenSecs);

    this.audio.playOneShot(buf, null, {
      peak:      cfg.crack,
      attack:    a.crackAttackSecs,
      endTime:   a.crackDecaySecs,
      startTime: now,
    });
  }

  /**
   * Internal routine running loop equations to construct heavy soundscapes.
   * Spawns multiple stacked random noise frequencies filtering low-end frequencies.
   */
  _playRumble(now, cfg, intensity)
  {
    const a          = CONFIG.audio;
    const layerCount = CONFIG.rumbleLayers[intensity];

    // Build unique audio offset layers back-to-back to emulate moving sound waves
    for (let l = 0; l < layerCount; l++)
    {
      const offset   = l * (a.rumbleLayerOffset + Math.random() * a.rumbleLayerRand);
      const buf      = AudioManager.createNoiseBuffer(this.audio.ctx, cfg.rumbleLen);
      const layerVol = cfg.rumble / layerCount * (a.rumbleVolRandMin + Math.random() * a.rumbleVolRandMax);
      const fadeDur  = cfg.fadeMin + Math.random() * cfg.fadeMax;

      this.audio.playOneShot(buf, [
        { type: 'lowshelf', frequency: a.rumbleShelfFreq, gain: CONFIG.rumbleShelfGain[intensity] },
        { type: 'lowpass',  frequency: CONFIG.rumbleHiCut[intensity] },
      ], {
        peak:      layerVol,
        attack:    a.rumbleAttackSecs,
        holdAt:    a.rumbleHoldSecs,
        endTime:   fadeDur,
        startTime: now + offset, // Shifts playback position cleanly forward on the audio timeline graph
      });
    }
  }

  /**
   * Internal timer tracker listening to user config ranges to queue up the next weather thunder strike event loop.
   */
  _scheduleNextStrike(intensity)
  {
    const { min, range } = CONFIG.thunderDelay[intensity];
    const delay          = min + Math.random() * range;
    this.thunderTimer    = setTimeout(() => this._strike(intensity), delay);
  }

  /**
   * Smoothly transitions the volume ceiling on the ambient background rain node.
   * Triggered externally when weather or biome configurations are altered.
   */
  setIntensity(id)
  {
    if (!CONFIG.rainLevels[id]) {
      console.warn("Rain level configuration missing for intensity:", id);
      return;
    }

    this.audio.setLoopGain(
      'rain',
      CONFIG.rainLevels[id],
      CONFIG.audio.rainGainFadeTime
    );
    clearTimeout(this.thunderTimer); // Instantly drop the running timer loop schedule
    this._strike(id);               // Trigger an instant storm strike payload using the updated level settings
  }
}
