// ── HUD ───────────────────────────────────────────────────────
//
// Owns all UI behavior:
//   - Entrance animation (JS driven, no CSS animation)
//   - Auto-hide after idle timeout
//   - Cursor hide/show in sync with HUD
//   - Intensity and color button listeners with click sound
//   - Master volume slider and mute toggle
//
// Depends on: CONFIG (config.js)

class HUD
{
  /**
   * Targets the DOM HUD wrapper, caches system callbacks, and initializes interface states.
   * @param {Function} onIntensityChange - Callback fired when a weather speed button is pressed.
   * @param {Function} onColorChange - Callback fired when a lighting color button is pressed.
   * @param {Function} onClickSound - Callback pointing directly to the UI click sound trigger.
   * @param {AudioManager} audio - The initialized master audio context core engine.
   */
  constructor(onIntensityChange, onColorChange, onClickSound, audio)
  {
    this.el                = document.querySelector('.HUD'); // The floating main interface window
    this.hideTimer         = null;                           // Holds the active idle countdown timer handle
    this.onIntensityChange = onIntensityChange;
    this.onColorChange     = onColorChange;
    this.onClickSound      = onClickSound;
    this.audio             = audio;                          // Used to manage volume adjustment parameters

    this._bindButtons();   // Hook up mouse click listeners to weather options
    this._bindVolume();    // Hook up sliders and mute buttons to the audio core
    this._initAutoHide();  // Fire up the interface tracking idle hide timers
  }

  /**
   * Loops through and binds mouse listeners to the storm speed and background color buttons.
   */
  _bindButtons()
  {
    // Weather Speed Group: Controls how fast/heavy the rain loop runs
    ['slow', 'med', 'fast'].forEach(id =>
    {
      document.getElementById(id).addEventListener('click', () =>
      {
        this.onClickSound(); // Play crisp menu click audio feedback
        
        // Strip active CSS styling highlights off all sibling speed buttons
        ['slow', 'med', 'fast'].forEach(b => document.getElementById(b).className = '');
        
        document.getElementById(id).className = 'active-speed'; // Add highlight to the clicked button
        this.onIntensityChange(id);                              // Notify the main Engine about the new weather level
      });
    });

    // Scene Color Group: Controls the color profile filters on screen
    ['red', 'green', 'blue'].forEach(id =>
    {
      document.getElementById(id).addEventListener('click', () =>
      {
        this.onClickSound();
        
        // Strip custom styling classes off all sibling color buttons
        ['red', 'green', 'blue'].forEach(b => document.getElementById(b).className = '');
        
        // Inject custom configuration class names defined inside your config.js file
        document.getElementById(id).className = CONFIG.colors[id].cls;
        this.onColorChange(id);                                  // Notify the main Engine about the color layer update
      });
    });
  }

  /**
   * Synchronizes the volume HTML slider and mute button with the current AudioManager engine state.
   */
  _bindVolume()
  {
    const slider  = document.getElementById('master-volume');
    const label   = document.getElementById('master-volume-val');
    const muteBtn = document.getElementById('mute-btn');

    // Seed starting positions. Translates math ranges (0.0–1.0) into visual percentage integers (0–100)
    slider.value = Math.round(CONFIG.masterVolume * 100);
    label.textContent = `${slider.value}%`;
    this._updateMuteButton(muteBtn); // Ensure the mute toggle visual label is drawn accurately

    // Listener: Monitors when the user clicks and drags the volume slider thumb bar
    slider.addEventListener('input', () =>
    {
      const val = slider.value / 100; // Convert 0-100 integer bounds back down to Web Audio API floating ranges (0.0-1.0)
      this.audio.setMasterVolume(val); // Change speaker nodes intensity level dynamically
      label.textContent = `${slider.value}%`; // Synchronize text percentage readout label on screen
    });

    // Listener: Watches for physical button interaction on the system master mute switch
    muteBtn.addEventListener('click', () =>
    {
      this.onClickSound();
      this.audio.toggleMute();         // Call the core system mute equation rules
      this._updateMuteButton(muteBtn); // Force UI labels to instantly redetermine active wording/styles
    });
  }

  /**
   * Helper that checks live AudioManager properties to accurately alter text labels and styling layouts.
   */
  _updateMuteButton(btn)
  {
    btn.className     = this.audio.muted ? 'active-speed' : ''; // Highlight button red/active if system is muted
    btn.textContent   = this.audio.muted ? 'Unmute' : 'Mute';   // Dynamically swap display text phrasing
  }

  /**
   * Initializes the starting interface faded visibility loop structure.
   * Double requestAnimationFrame (rAF) ensures the browser calculates styling rules before execution.
   */
  _initAutoHide()
  {
    this.el.style.transition = CONFIG.hud.transitionCss; // Fetch CSS sliding movement animation properties from config

    requestAnimationFrame(() =>
    {
      requestAnimationFrame(() =>
      {
        this._show(); // Make HUD visible instantly on file load initialization

        // Hook up movement triggers. Any mouse shift or touchscreen gesture instantly brings back the panel
        document.addEventListener('mousemove',  () => this._show());
        document.addEventListener('touchstart', () => this._show());
        document.addEventListener('touchmove',  () => this._show());
      });
    });
  }

  /**
   * Makes the interface block visible and resets the active inactivity countdown timer loop.
   */
  _show()
  {
    this.el.style.opacity       = '1';
    this.el.style.pointerEvents = 'auto'; // Re-enable click detections over the panel surface layer area
    this.el.style.transform     = 'translateX(-50%) translateY(0)'; // Slide into view from screen bounding boxes
    document.body.style.cursor  = 'crosshair'; // Draw an aiming crosshair mouse icon when moving

    clearTimeout(this.hideTimer); // Clear running timers so the bar doesn't flicker or hide mid-movement
    
    // Begin countdown loop. Hides the interface if mouse stops moving within config duration limits (e.g., 3000ms)
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  /**
   * Smoothly hides the layout block from view and completely drops operating system cursor rendering profiles.
   */
  _hide()
  {
    this.el.style.opacity       = '0';
    this.el.style.pointerEvents = 'none'; // Lock mouse clicks from accidentally firing invisible UI buttons
    document.body.style.cursor  = 'none';   // Completely hide the operating system mouse cursor pointer
  }
}
