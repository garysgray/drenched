// ──────────────────────────────────────────────────────────────
// ── SOUND RECIPES ─────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Procedural audio blueprints defining synthesis parameters
//              for all sound effects in the project.
// Core Role:   Provides AudioManager with instructions for generating
//              dynamic sound effects from white noise
// Dependencies: CONFIG

const SoundRecipes = 
{
  // ── UI Sounds ──────────────────────────────────────────────
  ui_click: 
  {
    // Total duration of generated audio buffer
    bufferSecs: () => CONFIG.audio.clickLenSecs,
    
    // Highpass filter removes low frequencies for crispness
    filters: [{
      type: 'highpass',
      frequency: () => CONFIG.audio.clickFilterFreq
    }],
    
    // Fast attack envelope for immediate response
    envelope: {
      peak: () => CONFIG.audio.clickGain,
      endTime: () => CONFIG.audio.clickDecaySecs
    }
  },

  // ── Weather Effects ────────────────────────────────────────
  thunder_crack: 
  {
    // Short duration for sharp impact
    bufferSecs: () => CONFIG.audio.crackLenSecs,
    
    // No filters - raw noise for maximum impact
    filters: null,
    
    // Explosive envelope with near-instant attack
    envelope: (cfg) => ({
      peak: cfg.crack,
      attack: CONFIG.audio.crackAttackSecs,
      endTime: CONFIG.audio.crackDecaySecs
    })
  },

  thunder_rumble_layer: 
  {
    // Dynamic duration based on storm intensity
    bufferSecs: (cfg) => cfg.rumbleLen,
    
    // Dual filters for deep, rumbling bass
    filters: (intensity) => [
      {
        type: 'lowshelf',
        frequency: CONFIG.audio.rumbleShelfFreq,
        gain: CONFIG.rumbleShelfGain[intensity]
      },
      {
        type: 'lowpass',
        frequency: CONFIG.rumbleHiCut[intensity]
      }
    ],
    
    // Slow attack with sustain for distant thunder effect
    envelope: (cfg, vol) => ({
      peak: vol,
      attack: CONFIG.audio.rumbleAttackSecs,
      holdAt: CONFIG.audio.rumbleHoldSecs,
      endTime: cfg.fadeMin + Math.random() * cfg.fadeMax
    })
  }
};
