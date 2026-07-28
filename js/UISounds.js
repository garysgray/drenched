// ── UISounds ──────────────────────────────────────────────────
//
// Clean collection of global User Interface sound effect assets.
// Completely decoupled from game-world weather scenes.
//
// Depends on: CONFIG, AudioManager

class UISounds
{
  /**
   * Tracks the core reference pointer to your shared main audio context engine.
   * @param {AudioManager} audio - The initialized master audio controller.
   */
  constructor(audio)
  {
    this.audio = audio;
  }

  /**
   * Generates and fires a crisp, highpass-filtered procedural click noise asset.
   * Can be wired up easily to button elements, menu clicks, or navigation events.
   */
  playClick()
  {
    const a   = CONFIG.audio;
    // Generate a fresh, short noise buffer custom-tailored for UI interaction snap
    const buf = AudioManager.createNoiseBuffer(this.audio.ctx, a.clickLenSecs);

    // Pass the parameters cleanly straight into the modular audio engine tool
    this.audio.playOneShot(buf, {
      type:      'highpass',
      frequency: a.clickFilterFreq,
    }, {
      peak:    a.clickGain,
      endTime: a.clickDecaySecs,
    });
  }
}
