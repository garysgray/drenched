// ── TextDisplay ───────────────────────────────────────────────
//
// Toggles between static glowing text and scrolling marquee.
// HUD buttons control the mode. Clicking the static text also
// switches to scroll mode for discoverability.
// Receives UISounds reference for click feedback.
// Font flash sync: Engine._onThunderStrike → flashFont(strike)
//
// Depends on: CONFIG (config.js)

class TextDisplay
{
  /**
   * Targets the DOM screen area, grabs the audio reference, and boots the text layouts.
   * @param {AudioManager} audioManager - The system audio manager used for sound playback.
   */
  constructor(audioManager)
  {
    this.stage       = document.querySelector('.text-stage'); // The HTML container displaying the text
    this.audio       = audioManager;                          // Reference to AudioManager for sound playback
    this.isScrolling = false;                                 // Tracks whether the text is currently moving or still
    this.mainText    = document.querySelector('.main-text');
    this.shadowText  = document.querySelector('.shadow-text');
    this._fontFlashTimer = null;

    this._buildScrollEl(); // Inject the scrolling text marquee element into the page
    this._bindClicks();    // Hook up mouse click listeners to the text and control panel buttons
  }

  /**
   * Dynamically constructs the HTML structural elements needed for the rolling text animation.
   */
  _buildScrollEl()
  {
    this.scrollEl           = document.createElement('div');
    this.scrollEl.className = 'scroll-left'; // Applies CSS styles handling the rolling movement track
    this.scrollEl.innerHTML = '<p>It was a Dark and Stormy Night!!!</p>';
    this.stage.appendChild(this.scrollEl);    // Appends the new scrolling paragraph into the main display container
    this.scrollText = this.scrollEl.querySelector('p');
  }

  /**
   * Flashes hero text brightness in sync with a thunder crack strike.
   * Called by Engine._onThunderStrike — mirrors RainVisuals.flashLightning timing.
   *
   * Peak glow scales with strike.crack; attack/decay match the crack audio envelope.
   */
  flashFont({ crack, attackSecs, decaySecs })
  {
    console.log(`[TEXT] flashStart=${performance.now().toFixed(2)}ms ` +
                `peak=${Math.min(1, crack).toFixed(2)} attack=${attackSecs}s`);
    clearTimeout(this._fontFlashTimer);

    const peak           = Math.min(1, crack);
    const peakBrightness = 1 + peak * 2.5;
    const restShadowOp   = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--text-shadow-opacity')) || 0.85;
    const peakShadowOp   = Math.min(1, restShadowOp + peak * (1 - restShadowOp));
    const targets        = [this.mainText, this.shadowText, this.scrollText];

    for (const el of targets)
    {
      if (!el) continue;

      // Pause ambient flicker on static text only — scroll marquee keeps moving.
      if (el === this.mainText) el.style.animation = 'none';
      el.style.transition = 'none';
      el.style.filter     = 'brightness(1)';
      el.style.opacity    = el === this.shadowText ? String(restShadowOp) : '1';
      void el.offsetWidth;

      el.style.transition = `filter ${attackSecs}s linear, opacity ${attackSecs}s linear`;
      el.style.filter     = `brightness(${peakBrightness})`;
      if (el === this.shadowText)
        el.style.opacity = String(peakShadowOp);
    }

    this._fontFlashTimer = setTimeout(() =>
    {
      for (const el of targets)
      {
        if (!el) continue;
        el.style.transition = `filter ${decaySecs}s ease-out, opacity ${decaySecs}s ease-out`;
        el.style.filter     = 'brightness(1)';
        if (el === this.shadowText)
          el.style.opacity = String(restShadowOp);
      }

      this._fontFlashTimer = setTimeout(() =>
      {
        for (const el of targets)
        {
          if (!el) continue;
          if (el === this.mainText) el.style.animation = '';
          el.style.transition = '';
          el.style.filter     = '';
          el.style.opacity    = '';
        }
      }, decaySecs * 1000);
    }, attackSecs * 1000);
  }

  /**
   * Internal state manager. Switches layout classes and toggles button highlights in one place.
   * @param {boolean} scrolling - True forces marquee mode; False switches back to still text.
   */
  _setMode(scrolling)
  {
    this.isScrolling = scrolling;
    
    // Toggle the 'scrolling' CSS class on the main container to show/hide the still vs moving text layout layers
    this.stage.classList.toggle('scrolling', scrolling);
    
    // Switch the active button highlight styling class ('active-speed') between the two mode buttons
    document.getElementById('text-mode-static').className = scrolling ? '' : 'active-speed';
    document.getElementById('text-mode-scroll').className = scrolling ? 'active-speed' : '';

    // Dynamically show or completely hide the scroll speed slider control group depending on the active layout mode
    document.getElementById('scroll-speed-group').style.display   = scrolling ? 'flex'  : 'none';
    document.getElementById('scroll-speed-divider').style.display = scrolling ? 'block' : 'none';
  }

  /**
   * Maps mouse click event listeners to interactive screen elements and configuration controls.
   */
  _bindClicks()
  {
    // Feature: Clicking directly on the large static display text automatically triggers scroll mode
    document.getElementById('text-toggle').addEventListener('click', () =>
    {
        this.audio.play('ui_click'); // Fire interactive button feedback sound
      this._setMode(true);    // Swap layout state cleanly to scrolling
    });

    // Control Box: Handles clicking the explicit "Static Layout" menu button
    document.getElementById('text-mode-static').addEventListener('click', () =>
    {
      this.audio.play('ui_click');
      this._setMode(false);   // Stop text movement layout
    });

    // Control Box: Handles clicking the explicit "Scroll Layout" menu button
    document.getElementById('text-mode-scroll').addEventListener('click', () =>
    {
      this.audio.play('ui_click');
      this._setMode(true);    // Trigger text movement layout
    });

    // UI Input Setup: Connect HTML handles for the numeric scroll speed slider system
    const slider = document.getElementById('scroll-speed');
    const label  = document.getElementById('scroll-speed-val');

    // Seed the UI inputs bounds dynamically using global variables defined in config.js
    slider.min   = CONFIG.scroll.minSpeedSecs;
    slider.max   = CONFIG.scroll.maxSpeedSecs;
    slider.value = CONFIG.scroll.defaultSpeedSecs;

    // Listener: Updates live text animation cycles whenever the user drags the speed slider bar
    slider.addEventListener('input', () =>
    {
      const val = slider.value;
      label.textContent = `${val}s`; // Update text label on screen to show active value (e.g. "5s")

      // Find the moving paragraph item and instantly alter its CSS animation duration properties
      const p = document.querySelector('.scroll-left p');
      if (p) p.style.animationDuration = `${val}s`; // A lower slider value makes the text cycle faster
    });
  }
}
