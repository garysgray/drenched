// ── CONFIG ────────────────────────────────────────────────────
//
// Single source of truth for all values in the project.
// Nothing else should contain raw numbers or magic strings.

const CONFIG =
{
  // ── Intensity presets ───────────────────────────────────────
  // Controls rain layer animation speed, opacity, and lightning
  // strength for each storm level.

  intensities:
  {
    slow:
    {
      durAngled:   '1.3s',
      durStraight: '0.25s',
      durRev:      '1.3s',
      opAngled:    '0.00',
      opStraight:  '0.30',
      opRev:       '0.00',
      lightA:      '0.02',
      lightB:      '0.09',
    },

    med:
    {
      durAngled:   '0.18s',
      durStraight: '0.22s',
      durRev:      '0.15s',
      opAngled:    '0.50',
      opStraight:  '0.20',
      opRev:       '0.00',
      lightA:      '0.65',
      lightB:      '0.35',
    },

    fast:
    {
      durAngled:   '0.045s',
      durStraight: '0.055s',
      durRev:      '0.038s',
      opAngled:    '0.70',
      opStraight:  '0.30',
      opRev:       '0.45',
      lightA:      '0.90',
      lightB:      '0.55',
    },
  },


  // ── Color themes ────────────────────────────────────────────
  // Text color, glow color, and active CSS class per theme.

  colors:
  {
    red:   { color: '#cc0000', glow: 'rgba(200,0,0,0.75)',   cls: 'active-red'   },
    green: { color: '#00bb00', glow: 'rgba(0,185,0,0.75)',   cls: 'active-green' },
    blue:  { color: '#2255ff', glow: 'rgba(30,85,255,0.75)', cls: 'active-blue'  },
  },


  // ── Rain audio levels ───────────────────────────────────────
  // Gain values for the rain noise chain per intensity.

  rainLevels: { slow: 0.1, med: 0.25, fast: 0.5 },


  // ── Thunder scheduling ──────────────────────────────────────
  // Milliseconds. Actual delay = min + random(range).

  thunderDelay:
  {
    slow: { min: 15000, range: 15000 },
    med:  { min: 8000,  range: 8000  },
    fast: { min: 3000,  range: 4000  },
  },


  // ── Thunder synthesis ───────────────────────────────────────
  // Per-intensity crack and rumble shape parameters.

  thunderCfg:
  {
    slow: { crack: 0.3,  rumble: 0.25,  rumbleLen: 2.5, fadeMin: 2.0, fadeMax: 1.0 },
    med:  { crack: 0.8,  rumble: 0.65,  rumbleLen: 3.5, fadeMin: 3.0, fadeMax: 1.5 },
    fast: { crack: 1.4,  rumble: 1.05,  rumbleLen: 5.0, fadeMin: 4.5, fadeMax: 2.0 },
  },


  // ── Thunder rumble layers ───────────────────────────────────
  // How many stacked noise layers, shelf boost, and hi-cut per intensity.

  rumbleLayers:    { slow: 1,   med: 2,   fast: 3    },
  rumbleShelfGain: { slow: 6,   med: 14,  fast: 20   },
  rumbleHiCut:     { slow: 300, med: 600, fast: 1200 },


  // ── Audio constants ─────────────────────────────────────────

  audio:
  {
    noiseBufferSecs:   2,       // seconds of white noise in the looping rain buffer
    rainFilterFreq:    1000,    // bandpass center frequency (Hz) for rain noise
    rainFilterQ:       0.5,     // bandpass Q for rain noise
    rainGainFadeTime:  0.5,     // setTargetAtTime time constant for rain gain transitions

    crackLenSecs:      0.08,    // duration of the crack noise burst
    crackAttackSecs:   0.002,   // time to ramp crack up to peak
    crackDecaySecs:    0.07,    // time to fade crack to silence

    rumbleAttackSecs:  0.15,    // time for each rumble layer to ramp up
    rumbleHoldSecs:    0.5,     // hold time before rumble fade begins
    rumbleLayerOffset: 0.08,    // base time offset between stacked rumble layers
    rumbleLayerRand:   0.12,    // random extra offset between layers
    rumbleVolRandMin:  0.8,     // min random volume scale per rumble layer
    rumbleVolRandMax:  0.4,     // random add on top of min (total range 0.8–1.2)
    rumbleShelfFreq:   350,     // low-shelf frequency for rumble bass boost

    clickLenSecs:      0.04,    // duration of the UI click burst
    clickFilterFreq:   1800,    // highpass cutoff for click (Hz)
    clickGain:         0.8,     // initial gain of click
    clickDecaySecs:    0.04,    // click fade duration
  },


  // ── HUD ─────────────────────────────────────────────────────

  hud:
  {
    autoHideMs:    3000,        // idle time before HUD fades out
    transitionCss: 'opacity 0.6s ease, transform 0.6s ease',
  },


  // ── Scroll text ─────────────────────────────────────────────

  scroll:
  {
    defaultSpeedSecs: 20,       // default marquee animation duration
    minSpeedSecs:     5,        // slider minimum
    maxSpeedSecs:     40,       // slider maximum
  },


  // ── Film grain ──────────────────────────────────────────────

  grain:
  {
    alpha: 18,                  // per-pixel alpha for noise overlay (0–255)
  },
};