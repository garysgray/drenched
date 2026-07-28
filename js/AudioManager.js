// ── AudioManager ──────────────────────────────────────────────
//
// Generic Web Audio wrapper optimized with static node pooling:
//   - AudioContext + master gain
//   - Fixed, pre-connected channel nodes to stop browser configuration clicks
//   - Safe, popping-free one-shot playback and loop channel management
//
// Game-specific sound recipes live in separate modules.

class AudioManager
{
  constructor(initialVolume = 1)
  {
    this.ctx            = new AudioContext();
    this.muted          = false;
    this._preMuteVolume = initialVolume;
    this._masterVolume  = initialVolume;

    // Master volume control node routed directly to speakers
    this.masterGain            = this.ctx.createGain();
    this.masterGain.gain.value = initialVolume;
    this.masterGain.connect(this.ctx.destination);

    // FIX: Pre-allocate static channels so the browser doesn't pop when connecting nodes at runtime
    this._loops = {};
    this._oneShotPool = [];
    this._maxPoolSize = 12; // Maximum concurrent thunder layers/UI sounds allowed

    this._initNodePools();
  }

  /**
   * Builds and permanently hooks up channels to the master graph at initialization.
   */
  _initNodePools()
  {
    for (let i = 0; i < this._maxPoolSize; i++)
    {
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Create pre-built filter nodes for our static channels
      const filter1 = this.ctx.createBiquadFilter();
      const filter2 = this.ctx.createBiquadFilter();

      // Chain them permanently: Filter 1 -> Filter 2 -> Gain -> Master
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
    const bufferSize = ctx.sampleRate * durationSecs;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    // Taper the extreme edges of the audio file to guarantee zero initial waveform pop
    const taper = Math.min(300, bufferSize / 2);
    for (let i = 0; i < taper; i++) {
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
    const peak    = envelope.peak ?? 1;
    const attack  = envelope.attack ?? 0;
    const holdAt  = envelope.holdAt;
    const endTime = envelope.endTime ?? (attack + (envelope.decay ?? 0.1));

    // Ensure it sets baseline from absolute silence smoothly
    gainParam.setValueAtTime(0, startTime);

    const safeAttack = Math.max(0.005, attack);
    gainParam.linearRampToValueAtTime(peak, startTime + safeAttack);

    if (holdAt !== undefined && holdAt > safeAttack)
      gainParam.setValueAtTime(peak, startTime + holdAt);

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
