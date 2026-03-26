// ── RainAudio ─────────────────────────────────────────────────
//
// Owns all audio:
//   - Looping rain noise chain
//   - Thunder synthesizer
//   - UI click sound
//
// Depends on: CONFIG (config.js)

class RainAudio
{
  constructor()
  {
    this.ctx          = new AudioContext();
    this.thunderTimer = null;
    this._buildRainChain();
  }

  // White noise → bandpass filter → gain → output
  _buildRainChain()
  {
    const a          = CONFIG.audio;
    const bufferSize = this.ctx.sampleRate * a.noiseBufferSecs;
    const buffer     = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source  = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;

    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = a.rainFilterFreq;
    filter.Q.value         = a.rainFilterQ;

    this.rainGain            = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    source.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    source.start();
  }

  // Crack = short unfiltered noise burst
  // Rumble = 1–3 staggered low-shelf boosted noise layers
  _strike(intensity)
  {
    const now = this.ctx.currentTime;
    const cfg = CONFIG.thunderCfg[intensity];

    this._playCrack(now, cfg);
    this._playRumble(now, cfg, intensity);
    this._scheduleNextStrike(intensity);
  }

  _playCrack(now, cfg)
  {
    const a   = CONFIG.audio;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * a.crackLenSecs, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src  = this.ctx.createBufferSource();
    src.buffer = buf;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(cfg.crack,  now + a.crackAttackSecs);
    gain.gain.exponentialRampToValueAtTime(0.001, now + a.crackDecaySecs);

    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  _playRumble(now, cfg, intensity)
  {
    const a          = CONFIG.audio;
    const layerCount = CONFIG.rumbleLayers[intensity];

    for (let l = 0; l < layerCount; l++)
    {
      const offset = l * (a.rumbleLayerOffset + Math.random() * a.rumbleLayerRand);

      const buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * cfg.rumbleLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src  = this.ctx.createBufferSource();
      src.buffer = buf;

      const shelf            = this.ctx.createBiquadFilter();
      shelf.type             = 'lowshelf';
      shelf.frequency.value  = a.rumbleShelfFreq;
      shelf.gain.value       = CONFIG.rumbleShelfGain[intensity];

      const hiCut            = this.ctx.createBiquadFilter();
      hiCut.type             = 'lowpass';
      hiCut.frequency.value  = CONFIG.rumbleHiCut[intensity];

      const gain     = this.ctx.createGain();
      const layerVol = cfg.rumble / layerCount * (a.rumbleVolRandMin + Math.random() * a.rumbleVolRandMax);
      const fadeDur  = cfg.fadeMin + Math.random() * cfg.fadeMax;

      gain.gain.setValueAtTime(0,        now + offset);
      gain.gain.linearRampToValueAtTime(layerVol,  now + offset + a.rumbleAttackSecs);
      gain.gain.setValueAtTime(layerVol, now + offset + a.rumbleHoldSecs);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + fadeDur);

      src.connect(shelf);
      shelf.connect(hiCut);
      hiCut.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now + offset);
    }
  }

  _scheduleNextStrike(intensity)
  {
    const { min, range } = CONFIG.thunderDelay[intensity];
    const delay          = min + Math.random() * range;
    this.thunderTimer    = setTimeout(() => this._strike(intensity), delay);
  }

  // Short highpass filtered noise burst — crisp UI tick
  playClick()
  {
    const a   = CONFIG.audio;
    const now = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * a.clickLenSecs, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src  = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'highpass';
    filter.frequency.value = a.clickFilterFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(a.clickGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + a.clickDecaySecs);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  setIntensity(id)
  {
    this.rainGain.gain.setTargetAtTime(
      CONFIG.rainLevels[id],
      this.ctx.currentTime,
      CONFIG.audio.rainGainFadeTime
    );
    clearTimeout(this.thunderTimer);
    this._strike(id);
  }

  resume()
  {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}