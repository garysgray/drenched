// ──────────────────────────────────────────────────────────────
// ── CONFIG ────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// Description: Centralized configuration store for all project settings,
//              system parameters, and runtime constants.
// Dependencies: None (base-level application dependency)

// ── GLOBAL ENUMS ─────────────────────────────────────────────
const UI_ACTIONS = Object.freeze({
  SET_SCROLL_SPEED:   0,
  SET_MASTER_VOLUME:  1,
  TOGGLE_MUTE:        2,
  SET_RAIN_INTENSITY: 3,
  SET_COLOR:          4,
  TOGGLE_SCROLL_MODE: 5,
  SET_TEXT_MODE:      6
});

const STORAGE_KEYS = Object.freeze({
  RAIN_INTENSITY: 'rainIntensity',
  COLOR_THEME:    'colorTheme',
  MASTER_VOLUME:  'masterVolume',
  MUTE_MODE:      'muteMode',
  SCROLL_SPEED:   'scrollSpeed',
  SCROLL_MODE:    'scrollMode',
  TEXT_MODE:      'textMode'
});

const RAIN_INTENSITY_MODES = Object.freeze({ 
  RAIN: 0, 
  STORM: 1, 
  TORRENT: 2 
});

// ── ENGINE MATH & TIMING CONSTANTS ───────────────────────────
// Grouped into a flat object to prevent global redeclared errors.
const SHARED_SYSTEM_MATH = Object.freeze({
  VOLUME_SCALE_FACTOR: 100,       // Replaces loose 'MULTIPLYER'
  MS_PER_SECOND:       1000,      // Replaces loose 'SECONDS'
  RGBA_CHANNELS:       4,         // Replaces loose 'RGBA_CHANNEL_COUNT'
  NOISE_TEX_SIZE:      128,       // Replaces loose 'NOISE_TEXTURE_SIZE'
  COLOR_CHANNEL_MAX:   255,
  FIXED_TIMESTEP:      1 / 60,    // 60fps logic updates
  MAX_FRAME_TIME:      0.25,      // Clamp lag spikes
  MAX_STEPS:           5          // Prevent loop spiral of death
});

// ── INTERNAL CONFIGURATION DATA STRUCTURE ────────────────────
const _configData = {
  // ── Intensity Presets ──────────────────────────────────────
  intensities: Object.freeze({
    [RAIN_INTENSITY_MODES.RAIN]: Object.freeze({
      durAngled:   '1.3s',
      durStraight: '0.25s',
      durRev:      '1.3s',
      opAngled:    '0.00',
      opStraight:  '0.30',
      opRev:       '0.00',
      lightA:      '0.02',
      lightB:      '0.09',
    }),
    [RAIN_INTENSITY_MODES.STORM]: Object.freeze({
      durAngled:   '0.18s',
      durStraight: '0.22s',
      durRev:      '0.15s',
      opAngled:    '0.50',
      opStraight:  '0.20',
      opRev:       '0.00',
      lightA:      '0.65',
      lightB:      '0.35',
    }),
    [RAIN_INTENSITY_MODES.TORRENT]: Object.freeze({
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

  // ── Weather System Dictionaries ────────────────────────────
  rainLevels: Object.freeze({
    [RAIN_INTENSITY_MODES.RAIN]:    0.1, 
    [RAIN_INTENSITY_MODES.STORM]:   0.25, 
    [RAIN_INTENSITY_MODES.TORRENT]: 0.5 
  }),

  // ── Thunder / Lightning Strike Configurations ──────────────
  thunder: Object.freeze({
    [RAIN_INTENSITY_MODES.RAIN]: Object.freeze({
        minDelay: 15000,
        delayRange: 15000,
        crackVolume: 0.3,
        rumbleVolume: 0.25,
        rumbleLength: 2.5,
        fadeMin: 2.0,
        fadeMax: 1.0,
        lightningPeak: 0.3,
        flashAttack: 0.002,
        flashDecay: 0.12
    }),
    [RAIN_INTENSITY_MODES.STORM]: Object.freeze({
        minDelay: 8000,
        delayRange: 8000,
        crackVolume: 0.8,
        rumbleVolume: 0.65,
        rumbleLength: 3.5,
        fadeMin: 3.0,
        fadeMax: 1.5,
        lightningPeak: 0.8,
        flashAttack: 0.002,
        flashDecay: 0.15
    }),
    [RAIN_INTENSITY_MODES.TORRENT]: Object.freeze({
        minDelay: 3000,
        delayRange: 4000,
        crackVolume: 1.0,
        rumbleVolume: 1.0,
        rumbleLength: 5.0,
        fadeMin: 4.5,
        fadeMax: 2.0,
        lightningPeak: 1.0,
        flashAttack: 0.002,
        flashDecay: 0.18
    })
  }),

  rumbleLayers: Object.freeze({ 
    [RAIN_INTENSITY_MODES.RAIN]:    1, 
    [RAIN_INTENSITY_MODES.STORM]:   2, 
    [RAIN_INTENSITY_MODES.TORRENT]: 3 
  }),
  
  rumbleShelfGain: Object.freeze({ 
    [RAIN_INTENSITY_MODES.RAIN]:    6, 
    [RAIN_INTENSITY_MODES.STORM]:   14, 
    [RAIN_INTENSITY_MODES.TORRENT]: 20 
  }),
  
  rumbleHiCut: Object.freeze({ 
    [RAIN_INTENSITY_MODES.RAIN]:    300, 
    [RAIN_INTENSITY_MODES.STORM]:   600, 
    [RAIN_INTENSITY_MODES.TORRENT]: 1200 
  }),

  hud: Object.freeze({
    autoHideMs:    3000,
    transitionCss: 'opacity 0.6s ease, transform 0.6s ease',
  }),

  scroll: Object.freeze({
    defaultSpeedSecs: 40,
    minSpeedSecs:     5,
    maxSpeedSecs:     40,
  }),

  grain: Object.freeze({
    alpha: 18,
  }),

  text: Object.freeze({
    content: "It was a Dark and Stormy Night!!!",
  }),
};

// ── PUBLIC CONFIG INTERFACE ─────────────────────────────────
const CONFIG = {
  // 1. Math and Global Enums (Direct mapping, no proxies)
  System:           SHARED_SYSTEM_MATH,
  UIActions:        UI_ACTIONS,
  StorageKeys:      STORAGE_KEYS,
  intensitiesModes: RAIN_INTENSITY_MODES,

  // 2. Static Configurations (Direct structural access)
  intensities:     _configData.intensities, 
  colors:          _configData.colors, 
  audio:           _configData.audio, 
  rainLevels:      _configData.rainLevels, 
  thunder:         _configData.thunder, 
  rumbleLayers:    _configData.rumbleLayers, 
  rumbleShelfGain: _configData.rumbleShelfGain, 
  rumbleHiCut:     _configData.rumbleHiCut, 
  hud:             _configData.hud, 
  scroll:          _configData.scroll, 
  grain:           _configData.grain, 
  text:            _configData.text, 
  
  // 3. Runtime State Properties with business logic validation
  _masterVolume: 1.0,
  get masterVolume() { return this._masterVolume; },
  set masterVolume(value) {
    if (value >= 0 && value <= 1) {
      this._masterVolume = value;
    } else {
      console.error('Volume must be a normalized value between 0 and 1');
    }
  },
};

// Freeze the interface root
Object.freeze(CONFIG);

// ── UTILITY STORAGE WRAPPER ──────────────────────────────────
const StorageUtil = {
    get(key, fallbackValue) {
        try {
            const savedData = localStorage.getItem("siteSettings");
            if (savedData) {
                const settings = JSON.parse(savedData);
                if (settings[key] !== undefined) {
                    return settings[key];
                }
            }
        } catch (e) {
            console.error(`StorageUtil: Failed to read key "${key}"`, e);
        }
        return fallbackValue;
    },

    set(key, value) {
        try {
            const savedData = localStorage.getItem("siteSettings");
            const currentSettings = savedData ? JSON.parse(savedData) : {};
            
            currentSettings[key] = value;
            localStorage.setItem("siteSettings", JSON.stringify(currentSettings));
        } catch (e) {
            console.error(`StorageUtil: Failed to save key "${key}"`, e);
        }
    }
};
