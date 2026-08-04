// ── AudioManager ──────────────────────────────────────────────
//
// Generic Web Audio wrapper optimized with static node pooling:
//   - AudioContext + master gain
//   - Fixed, pre-connected channel nodes to stop browser configuration clicks
//   - Safe, popping-free one-shot playback and loop channel management
//
// Game-specific sound recipes live in separate modules.
//
// Why this exists:
// The AudioManager handles all audio operations in the game, providing a clean
// abstraction over the Web Audio API. It manages sound effects, music, and
// audio processing while preventing common issues like audio popping and
// configuration clicks. The static node pooling system improves performance
// by reusing audio nodes instead of creating new ones for each sound.

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
    filters: [{
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
    envelope: (cfg) => ({
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
    filters: (intensity) => [
      {
        type: 'lowshelf', // lowshelf = A bass-booster node that amplifies low vibrations
        frequency: CONFIG.audio.rumbleShelfFreq,
        gain: CONFIG.rumbleShelfGain[intensity] // Pulls a bass volume multiplier out of config based on current rain speed
      },
      {
        type: 'lowpass',  // lowpass = A muffler node. It blocks high frequencies, making the rumble sound distant and deep
        frequency: CONFIG.rumbleHiCut[intensity]
      }
    ],
    
    // The shape of the rumbling volume over time
    envelope: (cfg, vol) => ({
      peak: vol,                              // peak = The maximum volume limit for this specific rolling wave
      attack: CONFIG.audio.rumbleAttackSecs,  // attack = Fade-in speed. Takes seconds to slowly swell up like real distance sound
      holdAt: CONFIG.audio.rumbleHoldSecs,    // holdAt = Sustain duration. How many seconds to lock the volume at its max loudness
      endTime: cfg.fadeMin + Math.random() * cfg.fadeMax // endTime = Total duration. Adds a random roll so each rumble lasts a unique length
    })
  }
};


class AudioManager
{
  constructor(initialVolume = 1)
  {
    // Create the main audio context
    this.ctx            = new AudioContext();
    this.muted          = false;
    this._preMuteVolume = initialVolume;
    this._masterVolume  = initialVolume;

    // Master volume control node routed directly to speakers
    this.masterGain            = this.ctx.createGain();
    this.masterGain.gain.value = initialVolume;
    this.masterGain.connect(this.ctx.destination);

    // Pre-allocate static channels to prevent audio popping
    // This creates a pool of reusable audio nodes that are always connected
    this._loops = {};
    this._oneShotPool = [];
    this._maxPoolSize = 12; // Maximum concurrent thunder layers/UI sounds allowed

    // Initialize the node pools
    this._initNodePools();
  }

  /**
   * Unified sound playback interface
   * @param {string} assetKey - Key from SoundRecipes
   * @param {object} params - Recipe-specific parameters
   * @param {number|null} customStartTime - Optional AudioContext timestamp
   */

  play(assetKey, params = {}, customStartTime = null) 
  {
    // Look up the specific "cooking recipe" for this sound (e.g., 'ui_click' or 'raindrop')
    const recipe = SoundRecipes[assetKey];
    if (!recipe) 
    {
      console.error(`Unknown sound asset: ${assetKey}`);
      return;
    }

    // THE WEIRD SYNTAX: A smart checker. If a recipe setting is a function, run it. 
    // If it's just a raw number/value, use it as-is.
    const resolveValue = (val, ...args) => typeof val === 'function' ? val(...args) : val;

    //  Figure out how long the audio clip needs to be, then generate a blank bucket of random static noise
    const bufferSecs = resolveValue(recipe.bufferSecs, params);
    const buffer = AudioManager.createNoiseBuffer(this.ctx, bufferSecs);

    //  Look up audio filter rules (like lowpass/highpass to make thunder sound deep or rain sound crisp)
    let filterConfigs = resolveValue(recipe.filters, params);
    if (filterConfigs) 
    {
      // Force filters into a list format and calculate their frequency, resonance (Q), and volume adjustments
      filterConfigs = (Array.isArray(filterConfigs) ? filterConfigs : [filterConfigs]).map(f => ({
        type: f.type,
        frequency: resolveValue(f.frequency, params),
        Q: resolveValue(f.Q, params),
        gain: resolveValue(f.gain, params)
      }));
    }

    //  Look up the "Volume Envelope" (how fast the sound fades in, how long it holds, and how it fades out)
    const rawEnv = resolveValue(recipe.envelope, params);
    const envelope = 
    {
      peak: resolveValue(rawEnv.peak, params),      // Maximum loudness
      attack: resolveValue(rawEnv.attack, params),  // Fade-in time (seconds)
      holdAt: resolveValue(rawEnv.holdAt, params),  // Duration at peak volume
      endTime: resolveValue(rawEnv.endTime, params),// Fade-out time (seconds)
      startTime: customStartTime || this.ctx.currentTime // Play right now, or at a specific scheduled frame
    };

    //  Print a debug log to the browser console showing exactly when this noise scheduled itself
    console.log(`[AUDIO] ${assetKey} scheduled=${envelope.startTime.toFixed(4)}s bufferSecs=${bufferSecs.toFixed(3)}`);

    //  Fire the synthesizers! Feed the random static noise through the filters and volume envelopes to play the sound.
    this.playOneShot(buffer, filterConfigs, envelope);
  }


  /**
   * Builds and permanently hooks up channels to the master graph at initialization.
   */
  _initNodePools()
  {
    // Initialize a pool of pre-connected audio nodes
    // This prevents audio popping by keeping nodes connected at all times
    for (let i = 0; i < this._maxPoolSize; i++)
    {
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Create pre-built filter nodes for our static channels
      const filter1 = this.ctx.createBiquadFilter();
      const filter2 = this.ctx.createBiquadFilter();

      // Chain them permanently: Filter 1 -> Filter 2 -> Gain -> Master
      // This fixed connection graph prevents runtime configuration clicks
      filter1.connect(filter2);
      filter2.connect(gainNode);
      gainNode.connect(this.masterGain);

      this._oneShotPool.push({
        gain: gainNode,
        filters: [filter1, filter2],
        source: null,
        inUse: false
      }); 
    }
  }

  static createNoiseBuffer(ctx, durationSecs)
  {
    // Create a white noise buffer of the specified duration
    const bufferSize = ctx.sampleRate * durationSecs;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    
    // Fill buffer with random values between -1 and 1
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    // Taper the edges to prevent popping
    // This creates a smooth fade-in and fade-out at the buffer edges
    const taper = Math.min(300, bufferSize / 2);
    for (let i = 0; i < taper; i++) 
    {
      data[i] *= (i / taper);
      data[bufferSize - 1 - i] *= (i / taper);
    }
    return buffer;
  }

  /**
   * Configures a pre-connected filter node safely without destroying the audio graph.
   */
  _configureFilter(filterNode, config)
  {
    if (!config) {
      filterNode.type = 'allpass'; // Set to allpass (bypass mode) if no filter is required
      return;
    }
    filterNode.type = config.type;
    if (config.frequency !== undefined) filterNode.frequency.setValueAtTime(config.frequency, this.ctx.currentTime);
    if (config.Q !== undefined)         filterNode.Q.setValueAtTime(config.Q, this.ctx.currentTime);
    if (config.gain !== undefined)      filterNode.gain.setValueAtTime(config.gain, this.ctx.currentTime);
  }

  _applyEnvelope(gainParam, envelope, startTime)
  {
    // Apply an ADSR (Attack-Decay-Sustain-Release) envelope to a gain parameter
    const peak    = envelope.peak ?? 1;    // Maximum volume
    const attack  = envelope.attack ?? 0;  // Time to reach peak volume
    const holdAt  = envelope.holdAt;       // Optional sustain time
    const endTime = envelope.endTime ?? (attack + (envelope.decay ?? 0.1));

    // Start from absolute silence to prevent pops
    gainParam.setValueAtTime(0, startTime);

    // Apply attack with minimum duration to prevent artifacts
    const safeAttack = Math.max(0.005, attack);
    gainParam.linearRampToValueAtTime(peak, startTime + safeAttack);

    // Optional sustain phase
    if (holdAt !== undefined && holdAt > safeAttack)
      gainParam.setValueAtTime(peak, startTime + holdAt);

    // Smooth release to silence
    gainParam.exponentialRampToValueAtTime(0.001, startTime + endTime);
    gainParam.setValueAtTime(0, startTime + endTime + 0.005);
  }

  startLoopingNoise(name, buffer, filter)
  {
    if (this._loops[name]) this.stopLoop(name);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Loops are continuous, so we set up a dedicated sub-graph node chain here
    const filterNode = this.ctx.createBiquadFilter();
    this._configureFilter(filterNode, filter);

    source.connect(filterNode);
    filterNode.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this._loops[name] = { source, gain, filterNode };
    return gain;
  }

  stopLoop(name)
  {
    const loop = this._loops[name];
    if (!loop) return;

    try { loop.source.stop(); } catch (_) {}
    delete this._loops[name];
  }

  setLoopGain(name, value, timeConstant = 0)
  {
    const loop = this._loops[name];
    if (!loop) return;

    const now = this.ctx.currentTime;
    const safeValue = isFinite(value) ? value : 0;
    
    if (timeConstant > 0) {
      const safeTimeConstant = Math.max(0.001, isFinite(timeConstant) ? timeConstant : 0.1);
      loop.gain.gain.setTargetAtTime(safeValue, now, safeTimeConstant);
    } else {
      loop.gain.gain.setValueAtTime(safeValue, now);
    }
  }

  /**
   * Reusable channel worker method that completely replaces runtime node instantiation.
   */
  playOneShot(buffer, filter, envelope = {})
  {
    const startTime = envelope.startTime ?? this.ctx.currentTime;

    // Find an available pre-connected channel node in our static memory array pool
    const channel = this._oneShotPool.find(ch => !ch.inUse || this.ctx.currentTime > ch.endTime);
    if (!channel) return; // Drop sound if the game is somehow violently overloading sounds

    channel.inUse = true;
    channel.endTime = startTime + (envelope.endTime ?? 0.5);

    // Reset and apply filter arrays cleanly to the static slots
    const filterConfigs = filter ? (Array.isArray(filter) ? filter : [filter]) : [];
    this._configureFilter(channel.filters[0], filterConfigs[0]);
    this._configureFilter(channel.filters[1], filterConfigs[1]);

    // Spin up just the source, wire it to the permanent track input, and execute envelope
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(channel.filters[0]);

    this._applyEnvelope(channel.gain.gain, envelope, startTime);
    source.start(startTime);
    
    channel.source = source;
  }

  setMasterVolume(value)
  {
    const vol = Math.max(0, Math.min(1, value));
    this._masterVolume = vol;
    this._preMuteVolume = vol;
    CONFIG.masterVolume  = vol;

    if (!this.muted)
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
  }

  toggleMute()
  {
    if (this.muted)
    {
      this.muted = false;
      this.masterGain.gain.setValueAtTime(this._preMuteVolume, this.ctx.currentTime);
    }
    else
    {
      this._preMuteVolume = this._masterVolume;
      this.muted          = true;
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }

    return this.muted;
  }

  resume()
  {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}
