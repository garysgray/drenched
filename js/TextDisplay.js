// ── TextDisplay ───────────────────────────────────────────────
//
// A passive rendering layer for hero typography. 
// Completely solid by default—only animates when explicitly 
// directed by the EnvironmentController timeline.
//
// Depends on: CONFIG
//
// Role in project: Manages the big narrative text overlay on screen. 
// It is completely passive regarding audio or click tracking, and instead
// exposes clean public functions so the central Engine can command it.

class TextDisplay
{
  constructor()
  {
    // Initialize DOM references
    this.stage       = document.querySelector('.text-stage');
    this.isScrolling = false; // Tracks whether the text is currently scrolling or static
    this.mainText    = document.querySelector('.main-text');
    this.shadowText  = document.querySelector('.shadow-text');
    this._fontFlashTimer = null; // Holds the active timeout handler for thunder flash resets

    // Build the horizontal moving marquee text element
    this._buildScrollEl();
  }

  _buildScrollEl()
  {
    // Create and configure scrolling text element completely from scratch in memory
    this.scrollEl           = document.createElement('div');
    this.scrollEl.className = 'scroll-left';
    this.scrollEl.innerHTML = '<p>It was a Dark and Stormy Night!!!</p>';
    
    // VISUAL FIX: Forces the browser to display the clicking hand cursor over this text
    this.scrollEl.style.cursor = 'pointer'; 
    
    this.stage.appendChild(this.scrollEl);
    this.scrollText = this.scrollEl.querySelector('p');
  }

  /**
   * CENTRALIZED ENGINE CONNECTOR: 
   * Allows the central Engine.js file to securely hook a master click listener 
   * straight onto this dynamically spawned element once it is injected into the DOM.
   */
  bindScrollElementClick(callbackFunction) 
  {
    this.scrollEl.addEventListener('click', callbackFunction);
  }

  /**
   * CENTRALIZED ENGINE CONNECTOR:
   * Flips the active scrolling state back and forth cleanly.
   */
  toggleScrollMode() 
  {
    this.forceSetMode(!this.isScrolling);
  }

  /**
   * CENTRALIZED ENGINE CONNECTOR:
   * Forcefully switches the layout to a specific layout mode state.
   */
  forceSetMode(scrolling) 
  {
    this.isScrolling = scrolling;
    
    // Toggles the 'scrolling' class on your HTML stage box, which turns the CSS marquee animation on or off
    this.stage.classList.toggle('scrolling', scrolling); 
  }

  /**
   * CENTRALIZED ENGINE CONNECTOR:
   * Adjusts the CSS marquee scroll timeline duration whenever the UI slider shifts.
   */
  updateAnimationSpeed(seconds) 
  {
    if (this.scrollText) {
      // Lower numbers make the animation duration shorter, meaning it zooms across the screen much faster!
      this.scrollText.style.animationDuration = `${seconds}s`;
    }
  }

  /**
   * Synchronized Timeline Entrypoint: Executed exclusively by EnvironmentController.
   */
  flashFont({ crack, attackSecs, decaySecs })
  {
    // Clear any existing flash timer to prevent animations from stepping on each other
    clearTimeout(this._fontFlashTimer);

    // Calculate flash intensity based on thunder crack strength
    const peak           = Math.min(1, crack);
    const peakBrightness = 1 + peak * 2.5;
    const restShadowOp   = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--text-shadow-opacity')) || 0.85;
    const peakShadowOp   = Math.min(1, restShadowOp + peak * (1 - restShadowOp));
    const targets        = [this.mainText, this.shadowText, this.scrollText];

    console.log(`[TEXT] flashStart=${performance.now().toFixed(2)}ms peak=${peakBrightness.toFixed(2)}`);

    // Apply flash effect to all text elements
    for (const el of targets)
    {
      if (!el) continue;

      // Reset styles and force reflow
      el.style.transition = 'none';
      el.style.filter     = 'brightness(1)';
      el.style.opacity    = el === this.shadowText ? String(restShadowOp) : '1';
      
      // WEIRD SYNTAX: "void el.offsetWidth" is a clever browser hack. 
      // It forces the web browser to recalculate the text layout instantly. 
      // Without this line, the browser groups style updates together, which breaks the flash animation flow.
      void el.offsetWidth; 

      // Apply flash animation (fades the brightness into maximum white glint)
      el.style.transition = `filter ${attackSecs}s linear, opacity ${attackSecs}s linear`;
      el.style.filter     = `brightness(${peakBrightness})`;
      if (el === this.shadowText) el.style.opacity = String(peakShadowOp);
    }

    // Set timer to smoothly fade back to the normal baseline dark state
    this._fontFlashTimer = setTimeout(() =>
    {
      for (const el of targets)
      {
        if (!el) continue;
        el.style.transition = `filter ${decaySecs}s ease-out, opacity ${decaySecs}s ease-out`;
        el.style.filter     = 'brightness(1)';
        if (el === this.shadowText) el.style.opacity = String(restShadowOp);
      }
    }, attackSecs * 1000); // Multiplied by 1000 because JavaScript setTimeout timers count in milliseconds
  }
}
