// ──────────────────────────────────────────────────────────────
// ── AUDIOMANAGER — PART 1 ────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Core audio system handling all sound synthesis and playback
// Core Role:   Manages Web Audio nodes with static pooling for performance
// Dependencies: CONFIG, SoundRecipes

class AudioManager
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(initialVolume = 1)
  {
    // Initialize Web Audio context
    this.ctx = new AudioContext();
    
    // Volume state tracking
    this.muted = false;
    this._masterVolume = initialVolume;

    // ── SAFARI/iOS AUTO-WAKE TRIGGER GUARD ────────────────────
    if (this.ctx.state === 'suspended') 
    {
      this.ctx.onstatechange = () => 
      {
        if (this.ctx.state === 'running') 
        {
          console.log("AudioManager: Audio pipeline unlocked by user gesture. Synthesizers online.");
        }
      };
    }

    // ── AUDIO GRAPH SETUP ─────────────────────────────────────
    // Create master gain node (final output stage)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = initialVolume;
    this.masterGain.connect(this.ctx.destination);

    // ── NODE POOLING SYSTEM ──────────────────────────────────
    // Pre-allocated channels prevent audio popping
    this._loops = {}; // Persistent loop channels
    this._oneShotPool = []; // One-shot effect channels
    this._maxPoolSize = 12; // Max concurrent sounds

    // Initialize pre-connected node pools
    this._initNodePools();
  }

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
      filterConfigs = (Array.isArray(filterConfigs) ? filterConfigs : [filterConfigs]).map(f => (
      {
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

    //  Fire the synthesizers! Feed the random static noise through the filters and volume envelopes to play the sound.
    this.playOneShot(buffer, filterConfigs, envelope);
  }

  // Builds and permanently hooks up channels to the master graph at initialization.
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
  // ── AUDIOMANAGER — PART 2 ────────────────────────────────────
  // Fallback helper pipeline to link up one-shot configurations cleanly
    // Reusable channel worker method that completely replaces runtime node instantiation.
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
    source.connect(channel.filters[0]); // <-- Kept exactly as your original code intended!

    this._applyEnvelope(channel.gain.gain, envelope, startTime);
    source.start(startTime);
    
    channel.source = source;

    // ── THE ONLY PERFORMANCE FIX REQUIRED ──
    // When the noise buffer naturally finishes playing, reclaim this pool node safely
    source.onended = () => 
    {
      channel.inUse = false;
      channel.source = null;
    };
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

  // Configures a pre-connected filter node safely without destroying the audio graph.
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
      loop.gain.gain.setTargetAtTime(safeValue, now, timeConstant);
    } else {
      loop.gain.gain.setValueAtTime(safeValue, now);
    }
  }

  // ── DYNAMIC ENGINE MODULATORS ──────────────────────────────
  setMasterVolume(value)
  {
    this._masterVolume = value;
    if (!this.muted && this.masterGain)
    {
      this.masterGain.gain.setValueAtTime(value, this.ctx.currentTime);
    }
  }

  toggleMute()
  {
    this.muted = !this.muted;
    const targetVolume = this.muted ? 0 : this._masterVolume;
    if (this.masterGain) 
    {
      this.masterGain.gain.setValueAtTime(targetVolume, this.ctx.currentTime);
    }
    return this.muted;
  }

  resume()
  {
    if (this.ctx && typeof this.ctx.resume === 'function') 
    {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  // ── MASTER TEARDOWN PIPELINE ────────────────────────────────
  stopAll()
  {
    console.log("AudioManager: Disposing active synthesizers and looping nodes...");
    
    Object.keys(this._loops).forEach(name => this.stopLoop(name));

    this._oneShotPool.forEach(channel => 
    {
      if (channel.source) 
      {
        try { channel.source.stop(); } catch (_) {}
      }
      channel.inUse = false;
    });

    if (this.ctx && typeof this.ctx.close === 'function')
    {
      this.ctx.close().then(() => 
      {
        console.log("AudioManager: AudioContext closed cleanly.");
      });
    }
  }
}
