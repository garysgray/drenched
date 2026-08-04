// ── HUD ───────────────────────────────────────────────────────
//
// Owns all UI behavior:
//   - Entrance animation (JS driven, no CSS animation)
//   - Auto-hide after idle timeout
//   - Cursor hide/show in sync with HUD
//   - Master volume slider and mute toggle visual state management
//
// Depends on: CONFIG (config.js)

class HUD
{
  /**
   * Targets the DOM HUD wrapper, caches references, and initializes interface states.
   * No longer accepts callbacks or binds mouse events directly.
   */
  constructor()
  {
    this.el        = document.querySelector('.HUD'); // The floating main interface window
    this.hideTimer = null;                           // Holds the active idle countdown timer handle

    // Cache references to the interactive controls so the Engine can manipulate them
    this.slider      = document.getElementById('scroll-speed');
    this.label       = document.getElementById('scroll-speed-val');
    this.volSlider   = document.getElementById('master-volume');
    this.volLabel    = document.getElementById('master-volume-val');
    this.muteBtn     = document.getElementById('mute-btn');

    this._initAutoHide();  // Fire up the interface tracking idle hide timers
  }

  /**
   * NEW ENGINE INTERFACE: Handles the visual wipeout and highlight for weather speed buttons.
   */
  syncSpeedButtonUI(activeId) 
  {
    ['slow', 'med', 'fast'].forEach(b => document.getElementById(b).className = '');
    document.getElementById(activeId).className = 'active-speed';
  }

  /**
   * NEW ENGINE INTERFACE: Handles the visual wipeout and lookup injection for color buttons.
   */
  syncColorButtonUI(activeId) 
  {
    ['red', 'green', 'blue'].forEach(b => document.getElementById(b).className = '');
    document.getElementById(activeId).className = CONFIG.colors[activeId].cls;
  }

  /**
   * NEW ENGINE INTERFACE: Syncs the text mode button highlights and opens/closes the slider panel.
   */
  syncTextMenuSlider(isScrolling) 
  {
    const staticBtn = document.getElementById('text-mode-static');
    const scrollBtn = document.getElementById('text-mode-scroll');
    const speedGroup = document.getElementById('scroll-speed-group');
    const divider = document.getElementById('scroll-speed-divider');

    if (staticBtn) staticBtn.className = isScrolling ? '' : 'active-speed';
    if (scrollBtn) scrollBtn.className = isScrolling ? 'active-speed' : '';
    if (speedGroup) speedGroup.style.display = isScrolling ? 'flex' : 'none';
    if (divider) divider.style.display = isScrolling ? 'block' : 'none';
  }

  /**
   * NEW ENGINE INTERFACE: Setup initial text scroll slider bounds using values directly from config.js
   */
  initScrollSlider() 
  {
    if (this.slider) {
      this.slider.min   = CONFIG.scroll.minSpeedSecs;
      this.slider.max   = CONFIG.scroll.maxSpeedSecs;
      this.slider.value = CONFIG.scroll.defaultSpeedSecs;
      this.updateSliderLabel();
    }
  }

  /**
   * NEW ENGINE INTERFACE: Updates the visual duration numbers label next to the scroll speed bar.
   */
  updateSliderLabel() 
  {
    if (this.label && this.slider) {
      this.label.textContent = `${this.slider.value}s`;
    }
  }

  /**
   * NEW ENGINE INTERFACE: Seed starting volume layout numbers based on configurations.
   */
  initVolumeUI()
  {
    if (this.volSlider && this.volLabel) {
      this.volSlider.value = Math.round(CONFIG.masterVolume * 100);
      this.volLabel.textContent = `${this.volSlider.value}%`;
    }
  }

  /**
   * NEW ENGINE INTERFACE: Instantly synchronizes the text percentage readout label on screen.
   */
  updateVolumeLabel()
  {
    if (this.volLabel && this.volSlider) {
      this.volLabel.textContent = `${this.volSlider.value}%`;
    }
  }

  /**
   * ENGINE INTERFACE: Checks system properties to accurately alter text labels and styling layouts.
   */
  updateMuteButtonVisuals(isMuted)
  {
    if (this.muteBtn) {
      this.muteBtn.className   = isMuted ? 'active-speed' : ''; // Highlight button red/active if system is muted
      this.muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';   // Dynamically swap display text phrasing
    }
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
