// Sound recipe definitions (procedural audio blueprints)
// These define the exact volume, filters, and timing shapes for every synthesized sound effect.

const SoundRecipes = 
{
  // UI CLICK: A sharp, crisp button sound that pops instantly and ends quickly
  ui_click: 
  {
    // The total length of the raw sound buffer file generated in seconds
    bufferSecs: () => CONFIG.audio.clickLenSecs,
    
    // Filters modify the tone: 'highpass' cuts out bass frequencies to keep the click sounding light and crisp
    filters: 
    [{
      type: 'highpass',
      frequency: () => CONFIG.audio.clickFilterFreq // The frequency boundary line where bass is cut off
    }],
    
    // The Volume Shape (Envelope) controls how the sound fades over time
    envelope: 
    {
      peak: () => CONFIG.audio.clickGain,          // peak = The maximum loudness volume (0.0 to 1.0) this click reaches
      endTime: () => CONFIG.audio.clickDecaySecs    // endTime = The exact second marks when the click must hit 0 volume and stop
    }
  },

  // THUNDER CRACK: The immediate, explosive visual lightning strike blast
  thunder_crack: 
  {
    // The length of this audio block in seconds
    bufferSecs: () => CONFIG.audio.crackLenSecs,
    
    filters: null, // No tone filters needed; plays raw, harsh white noise static for maximum impact
    
    // Pass in custom settings (cfg) to dynamically adjust volume based on how close the lightning is
    envelope: (cfg) => 
    ({
      peak: cfg.crack,                       // peak = The maximum blast volume, calculated dynamically per lightning flash
      attack: CONFIG.audio.crackAttackSecs,  // attack = Fade-in speed. Set to near-zero so the sound explodes instantly
      endTime: CONFIG.audio.crackDecaySecs   // endTime = The exact lifespan in seconds when the explosion trailing echo dies out
    })
  },

  // THUNDER RUMBLE LAYER: The deep, muffled background rolling vibrations that echo after a crack
  thunder_rumble_layer: 
  {
    // The duration of the low-end roll, passed in dynamically from the engine physics
    bufferSecs: (cfg) => cfg.rumbleLen,
    
    // A list of two audio filters working together to shape the tone
    filters: (intensity) => 
    [{
        type: 'lowshelf', // lowshelf = A bass-booster node that amplifies low vibrations
        frequency: CONFIG.audio.rumbleShelfFreq,
        gain: CONFIG.rumbleShelfGain[intensity] // Pulls a bass volume multiplier out of config based on current rain speed
      },
      {
        type: 'lowpass',  // lowpass = A muffler node. It blocks high frequencies, making the rumble sound distant and deep
        frequency: CONFIG.rumbleHiCut[intensity]
    }],
    
    // The shape of the rumbling volume over time
    envelope: (cfg, vol) =>
    ({
      peak: vol,                              // peak = The maximum volume limit for this specific rolling wave
      attack: CONFIG.audio.rumbleAttackSecs,  // attack = Fade-in speed. Takes seconds to slowly swell up like real distance sound
      holdAt: CONFIG.audio.rumbleHoldSecs,    // holdAt = Sustain duration. How many seconds to lock the volume at its max loudness
      endTime: cfg.fadeMin + Math.random() * cfg.fadeMax // endTime = Total duration. Adds a random roll so each rumble lasts a unique length
    })
  }

};
