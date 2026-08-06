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
    // Reference existing static elements
    this.stage = document.querySelector('.text-stage');
    this.textWrap = document.querySelector('#text-toggle');
    this.mainText = document.querySelector('.main-text');
    this.shadowText = document.querySelector('.shadow-text');
    this.isScrolling = false;
    this._fontFlashTimer = null;

    // Create scrolling elements
    this.scrollEl = document.createElement('div');
    this.scrollEl.id = 'dynamic-scroll-text';
    this.scrollEl.className = 'scroll-left';
    this.scrollEl.innerHTML = '<p>It was a Dark and Stormy Night!!!</p>';
    this.scrollEl.style.cursor = 'pointer';
    this.stage.appendChild(this.scrollEl);
    this.scrollText = this.scrollEl.querySelector('p');

    // Initialize state
    this.stage.classList.remove('scrolling');
  }

  // Returns event mapping configuration
  getEventMaps() {
    return [
      {
        elementId: 'text-toggle',
        eventType: 'click',
        actionType: 'TOGGLE_SCROLL_MODE'
      },
      {
        elementId: 'dynamic-scroll-text', // <-- Added to register scrolling element click
        eventType: 'click',
        actionType: 'TOGGLE_SCROLL_MODE'
      },
      {
        elementId: 'text-mode-static',
        eventType: 'click',
        actionType: 'SET_TEXT_MODE',
        actionValue: false
      },
      {
        elementId: 'text-mode-scroll',
        eventType: 'click',
        actionType: 'SET_TEXT_MODE',
        actionValue: true
      }
    ];
  }

  /**
   * Updates visual state based on action type
   */
  updateVisualState(actionType, value) {
    switch(actionType) {
      case 'TOGGLE_SCROLL_MODE':
        this.toggleScrollMode();
        break;
      case 'SET_TEXT_MODE':
        this.forceSetMode(value);
        break;
      case 'UPDATE_SCROLL_SPEED':
        this.updateAnimationSpeed(value);
        break;
    }
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


//Synchronized Timeline Entrypoint: Executed exclusively by EnvironmentController.
flashFont({ crack, attackSecs, decaySecs })
{
  // Clear any existing flash timer to prevent animations from stepping on each other
  clearTimeout(this._fontFlashTimer);

  const targets = [this.mainText, this.shadowText, this.scrollText];

  // 1. Trigger the flash by applying a data attribute and setting custom CSS variables
  for (const el of targets)
  {
    if (!el) continue;
    
    // Pass dynamic timing configuration straight into CSS variables
    el.style.setProperty('--flash-attack', `${attackSecs}s`);
    el.style.setProperty('--flash-decay', `${decaySecs}s`);
    
    // Turn the flash on
    el.dataset.flash = "active";
  }

  // 2. Set timer to cleanly turn the flash state off after the attack phase completes
  this._fontFlashTimer = setTimeout(() =>
  {
    for (const el of targets)
    {
      if (!el) continue;
      el.dataset.flash = "inactive";
    }
  }, attackSecs * 1000);
}

}
