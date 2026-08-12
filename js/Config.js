// ──────────────────────────────────────────────────────────────
// ── CONFIG ────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Centralized configuration store for all magic numbers and
// runtime constants. Ensures consistency across the project.
// Core Role:   Single source of truth for all configurable values
// Dependencies: None (base-level dependency for all other files)

// ── CONSTANTS ────────────────────────────────────────────────
const UI_ACTIONS = Object.freeze(
{
  SET_SCROLL_SPEED:   0,
  SET_MASTER_VOLUME:  1,
  TOGGLE_MUTE:        2,
  SET_RAIN_INTENSITY: 3,
  SET_COLOR:          4,
  TOGGLE_SCROLL_MODE: 5,
  SET_TEXT_MODE:      6
});

const RAIN_INTENSITY_MODES = Object.freeze(
{ 
  RAIN: 0, 
  STORM: 1, 
  TORRENT: 2 
});

// ── CONFIG DATA STRUCTURE ────────────────────────────────────
const _configData = 
{
  // ── Intensity Presets ──────────────────────────────────────
  intensities: Object.freeze(
  {
    [RAIN_INTENSITY_MODES.RAIN]: Object.freeze(
    {
      durAngled:   '1.3s',
      durStraight: '0.25s',
      durRev:      '1.3s',
      opAngled:    '0.00',
      opStraight:  '0.30',
      opRev:       '0.00',
      lightA:      '0.02',
      lightB:      '0.09',
    }),
    
    [RAIN_INTENSITY_MODES.STORM]: Object.freeze(
    {
      durAngled:   '0.18s',
      durStraight: '0.22s',
      durRev:      '0.15s',
      opAngled:    '0.50',
      opStraight:  '0.20',
      opRev:       '0.00',
      lightA:      '0.65',
      lightB:      '0.35',
    }),

    [RAIN_INTENSITY_MODES.TORRENT]: Object.freeze(
    {
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
  colors: Object.freeze(
  {
    red:   Object.freeze({ color: '#cc0000', glow: 'rgba(200,0,0,0.75)',   cls: 'active-red' }),
    green: Object.freeze({ color: '#00bb00', glow: 'rgba(0,185,0,0.75)',   cls: 'active-green' }),
    blue:  Object.freeze({ color: '#2255ff', glow: 'rgba(30,85,255,0.75)', cls: 'active-blue' }),
  }),

  // ── Audio Constants ───────────────────────────────────────
  audio: Object.freeze(
  {
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

  // ── Weather System Dictionaries ────────────────────────────
  rainLevels: Object.freeze(
  {
    [RAIN_INTENSITY_MODES.RAIN]:    0.1, 
    [RAIN_INTENSITY_MODES.STORM]:   0.25, 
    [RAIN_INTENSITY_MODES.TORRENT]: 0.5 
  }),

// ── THUNDER / LIGHTNING STRIKE CONFIGURATION ───────────────
//
// Every thunder event is treated as ONE complete strike.
//
// One scheduled strike produces:
//   1. Lightning
//   2. Font flash
//   3. Thunder crack
//   4. Thunder rumble
//
// The delay controls how long we wait before creating the NEXT
// complete strike. The visual/audio settings control that strike.

thunder: Object.freeze(
{
    [RAIN_INTENSITY_MODES.RAIN]: Object.freeze(
    {
        // Time between complete storm strikes
        minDelay: 15000,
        delayRange: 15000,

        // Thunder
        crackVolume: 0.3,
        rumbleVolume: 0.25,
        rumbleLength: 2.5,
        fadeMin: 2.0,
        fadeMax: 1.0,

        // Lightning + font flash
        lightningPeak: 0.3,
        flashAttack: 0.002,
        flashDecay: 0.12
    }),

    [RAIN_INTENSITY_MODES.STORM]: Object.freeze(
    {
        // Time between complete storm strikes
        minDelay: 8000,
        delayRange: 8000,

        // Thunder
        crackVolume: 0.8,
        rumbleVolume: 0.65,
        rumbleLength: 3.5,
        fadeMin: 3.0,
        fadeMax: 1.5,

        // Lightning + font flash
        lightningPeak: 0.8,
        flashAttack: 0.002,
        flashDecay: 0.15
    }),

    [RAIN_INTENSITY_MODES.TORRENT]: Object.freeze(
    {
        // Time between complete storm strikes
        minDelay: 3000,
        delayRange: 4000,

        // Thunder
        crackVolume: 1.0,
        rumbleVolume: 1.0,
        rumbleLength: 5.0,
        fadeMin: 4.5,
        fadeMax: 2.0,

        // Lightning + font flash
        lightningPeak: 1.0,
        flashAttack: 0.002,
        flashDecay: 0.18
    })
}),

  rumbleLayers: Object.freeze(
  { 
    [RAIN_INTENSITY_MODES.RAIN]:    1, 
    [RAIN_INTENSITY_MODES.STORM]:   2, 
    [RAIN_INTENSITY_MODES.TORRENT]: 3 
  }),
  
  rumbleShelfGain: Object.freeze(
  { 
    [RAIN_INTENSITY_MODES.RAIN]:    6, 
    [RAIN_INTENSITY_MODES.STORM]:   14, 
    [RAIN_INTENSITY_MODES.TORRENT]: 20 
  }),
  
  rumbleHiCut: Object.freeze(
  { 
    [RAIN_INTENSITY_MODES.RAIN]:    300, 
    [RAIN_INTENSITY_MODES.STORM]:   600, 
    [RAIN_INTENSITY_MODES.TORRENT]: 1200 
  }),

  // ── UI Configuration ──────────────────────────────────────
  hud: Object.freeze(
  {
    autoHideMs:    3000,
    transitionCss: 'opacity 0.6s ease, transform 0.6s ease',
  }),

  scroll: Object.freeze(
  {
    defaultSpeedSecs: 40,
    minSpeedSecs:     5,
    maxSpeedSecs:     40,
  }),

  // ── Visual Effects ────────────────────────────────────────
  grain: Object.freeze(
  {
    alpha: 18,
  }),

  // ── Content ───────────────────────────────────────────────
  text: Object.freeze(
  {
    content: "It was a Dark and Stormy Night!!!",
  }),

};

// ── PUBLIC CONFIG INTERFACE ─────────────────────────────────
const CONFIG = 
{
  // Immutable property accessors
  get UIActions() { return UI_ACTIONS; },
  get intensitiesModes() { return RAIN_INTENSITY_MODES; },
  get intensities() { return _configData.intensities; }, 
  get colors() { return _configData.colors; },
  get audio() { return _configData.audio; },
  get rainLevels() { return _configData.rainLevels; },
  get thunder() { return _configData.thunder; },
  get rumbleLayers() { return _configData.rumbleLayers; },
  get rumbleShelfGain() { return _configData.rumbleShelfGain; },
  get rumbleHiCut() { return _configData.rumbleHiCut; },
  get hud() { return _configData.hud; },
  get scroll() { return _configData.scroll; },
  get grain() { return _configData.grain; },
  get text() { return _configData.text; },
  
  // Mutable properties
  _masterVolume: 100,
  get masterVolume() { return this._masterVolume; },
  set masterVolume(value) 
  {
    if (value >= 0 && value <= 1) this._masterVolume = value;
    else console.error('Volume must be between 0 and 1');
  },
};

// Freeze the CONFIG object to prevent modifications
Object.freeze(CONFIG);
