// ──────────────────────────────────────────────────────────────
// ── CONFIG ────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Centralized configuration store for all magic numbers and
//              runtime constants. Ensures consistency across the project.
// Core Role:   Single source of truth for all configurable values
// Dependencies: None (base-level dependency for all other files)

// ── CONSTANTS ────────────────────────────────────────────────
const INTENSITY_MODES = { 
  SLOW: 'slow', 
  MED: 'med', 
  FAST: 'fast' 
};

// ── CONFIG DATA STRUCTURE ────────────────────────────────────
const _configData = 
{
  // ── Intensity Presets ──────────────────────────────────────
  intensities: Object.freeze({
    [INTENSITY_MODES.SLOW]: Object.freeze({
      durAngled:   '1.3s',
      durStraight: '0.25s',
      durRev:      '1.3s',
      opAngled:    '0.00',
      opStraight:  '0.30',
      opRev:       '0.00',
      lightA:      '0.02',
      lightB:      '0.09',
    }),
    
    [INTENSITY_MODES.MED]: Object.freeze({
      durAngled:   '0.18s',
      durStraight: '0.22s',
      durRev:      '0.15s',
      opAngled:    '0.50',
      opStraight:  '0.20',
      opRev:       '0.00',
      lightA:      '0.65',
      lightB:      '0.35',
    }),

    [INTENSITY_MODES.FAST]: Object.freeze({
      durAngled:   '0.045s',
      durStraight: '0.055s',
      durRev:      '0.038s',
      opAngled:    '0.70',
      opStraight:  '0.30',
      opRev:       '0.45',
      lightA:      '0.90',
      lightB:      '0.55',
    }),
  }),

  // ── Color Themes ──────────────────────────────────────────
  colors: Object.freeze({
    red:   Object.freeze({ color: '#cc0000', glow: 'rgba(200,0,0,0.75)',   cls: 'active-red' }),
    green: Object.freeze({ color: '#00bb00', glow: 'rgba(0,185,0,0.75)',   cls: 'active-green' }),
    blue:  Object.freeze({ color: '#2255ff', glow: 'rgba(30,85,255,0.75)', cls: 'active-blue' }),
  }),

  // ── Audio Constants ───────────────────────────────────────
  audio: Object.freeze({
    noiseBufferSecs:   2,
    rainFilterFreq:    1000,
    rainFilterQ:       0.5,
    rainGainFadeTime:  0.5,
    crackLenSecs:      0.08,
    crackAttackSecs:   0.002,
    crackDecaySecs:    0.07,
    rumbleAttackSecs:  0.15,
    rumbleHoldSecs:    0.5,
    rumbleLayerOffset: 0.08,
    rumbleLayerRand:   0.12,
    rumbleVolRandMin:  0.8,
    rumbleVolRandMax:  0.4,
    rumbleShelfFreq:   350,
    clickLenSecs:      0.04,
    clickFilterFreq:   1800,
    clickGain:         0.8,
    clickDecaySecs:    0.04,
  }),

  // ── Weather System ────────────────────────────────────────
  rainLevels: Object.freeze({ slow: 0.1, med: 0.25, fast: 0.5 }),

  thunderDelay: Object.freeze({
    slow: Object.freeze({ min: 15000, range: 15000 }),
    med:  Object.freeze({ min: 8000,  range: 8000 }),
    fast: Object.freeze({ min: 3000,  range: 4000 }),
  }),

  thunderCfg: Object.freeze({
    slow: Object.freeze({ crack: 0.3,  rumble: 0.25,  rumbleLen: 2.5, fadeMin: 2.0, fadeMax: 1.0 }),
    med:  Object.freeze({ crack: 0.8,  rumble: 0.65,  rumbleLen: 3.5, fadeMin: 3.0, fadeMax: 1.5 }),
    fast: Object.freeze({ crack: 1.4,  rumble: 1.05,  rumbleLen: 5.0, fadeMin: 4.5, fadeMax: 2.0 }),
  }),

  rumbleLayers: Object.freeze({ slow: 1, med: 2, fast: 3 }),
  rumbleShelfGain: Object.freeze({ slow: 6, med: 14, fast: 20 }),
  rumbleHiCut: Object.freeze({ slow: 300, med: 600, fast: 1200 }),

  // ── UI Configuration ──────────────────────────────────────
  hud: Object.freeze({
    autoHideMs:    3000,
    transitionCss: 'opacity 0.6s ease, transform 0.6s ease',
  }),

  scroll: Object.freeze({
    defaultSpeedSecs: 20,
    minSpeedSecs:     5,
    maxSpeedSecs:     40,
  }),

  // ── Visual Effects ────────────────────────────────────────
  grain: Object.freeze({
    alpha: 18,
  }),

  // ── Content ───────────────────────────────────────────────
  text: Object.freeze({
    content: "It was a Dark and Stormy Night!!!",
  }),
};

// ── PUBLIC CONFIG INTERFACE ─────────────────────────────────
const CONFIG = {
  // Immutable property accessors
  get intensities() { return _configData.intensities; },
  get colors() { return _configData.colors; },
  get audio() { return _configData.audio; },
  get rainLevels() { return _configData.rainLevels; },
  get thunderDelay() { return _configData.thunderDelay; },
  get thunderCfg() { return _configData.thunderCfg; },
  get rumbleLayers() { return _configData.rumbleLayers; },
  get rumbleShelfGain() { return _configData.rumbleShelfGain; },
  get rumbleHiCut() { return _configData.rumbleHiCut; },
  get hud() { return _configData.hud; },
  get scroll() { return _configData.scroll; },
  get grain() { return _configData.grain; },
  get text() { return _configData.text; },
  
  // Mutable properties
  _masterVolume: 1,
  get masterVolume() { return this._masterVolume; },
  set masterVolume(value) {
    if (value >= 0 && value <= 1) this._masterVolume = value;
    else console.error('Volume must be between 0 and 1');
  },
};

// Freeze the CONFIG object to prevent modifications
Object.freeze(CONFIG);
