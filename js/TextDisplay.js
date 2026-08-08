// ──────────────────────────────────────────────────────────────
// ── TEXTDISPLAY ───────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Manages all text rendering and animation for the scene
// Core Role:   Handles static and scrolling text modes with flash effects
// Dependencies: CONFIG, UIComponent

class TextDisplay extends UIComponent
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor()
  {
    super();
    
    // Cache DOM references
    this.stage = document.querySelector('.text-stage');
    this.textWrap = document.querySelector('#text-toggle');
    this.mainText = document.querySelector('.main-text');
    this.shadowText = document.querySelector('.shadow-text');
    
    // State tracking
    this.isScrolling = false;
    this._fontFlashTimer = null;

    // Initialize text content from central config
    const textAsset = CONFIG.text.content;
    this.mainText.textContent = textAsset;
    this.shadowText.textContent = textAsset;

    ///FIXX look into clean up or some other way
    // ── SCROLLING TEXT SETUP ─────────────────────────────────
    this.scrollEl = document.createElement('div');
    this.scrollEl.id = 'dynamic-scroll-text';
    this.scrollEl.className = 'scroll-left';
    this.scrollEl.innerHTML = `<p>${CONFIG.text.content}</p>`;
    this.scrollEl.style.cursor = 'pointer';
    this.stage.appendChild(this.scrollEl);
    this.scrollText = this.scrollEl.querySelector('p');

    // Set initial display state
    this.stage.classList.remove('scrolling');
  }

  updateVisualState(actionType, value) 
  {
    switch(actionType) {
      case CONFIG.UIActions.TOGGLE_SCROLL_MODE:
        this.toggleScrollMode();
        break;
      case CONFIG.UIActions.SET_TEXT_MODE:
        this.forceSetMode(value);
        break;
      case CONFIG.UIActions.SET_SCROLL_SPEED:
        this.updateAnimationSpeed(value);
        break;
    }
  }

  // Returns event mapping configuration
  getEventMaps() 
  {
    return [
      {
        elementId: 'text-toggle',
        eventType: 'click',
        actionType: CONFIG.UIActions.TOGGLE_SCROLL_MODE
      },
      {
        elementId: 'dynamic-scroll-text', // <-- Added to register scrolling element click
        eventType: 'click',
        actionType: CONFIG.UIActions.TOGGLE_SCROLL_MODE
      },
      {
        elementId: 'text-mode-static',
        eventType: 'click',
        actionType: CONFIG.UIActions.SET_TEXT_MODE,
        actionValue: false
      },
      {
        elementId: 'text-mode-scroll',
        eventType: 'click',
        actionType: CONFIG.UIActions.SET_TEXT_MODE,
        actionValue: true
      }
    ];
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

  //CENTRALIZED ENGINE CONNECTORs:
  
  // Allows the central Engine.js file to securely hook a master click listener straight onto this dynamically spawned 
  // element once it is injected into the DOM.
  bindScrollElementClick(callbackFunction) 
  {
    this.scrollEl.addEventListener('click', callbackFunction);
  }

  // Flips the active scrolling state back and forth cleanly.
  toggleScrollMode() 
  {
    this.forceSetMode(!this.isScrolling);
  }

  //Forcefully switches the layout to a specific layout mode state.
  forceSetMode(scrolling) 
  {
    this.isScrolling = scrolling;
    
    // Toggles the 'scrolling' class on your HTML stage box, which turns the CSS marquee animation on or off
    this.stage.classList.toggle('scrolling', scrolling); 
  }

  // Adjusts the CSS marquee scroll timeline duration whenever the UI slider shifts.
  updateAnimationSpeed(seconds) 
  {
    if (this.scrollText) {
      // Lower numbers make the animation duration shorter, meaning it zooms across the screen much faster!
      this.scrollText.style.animationDuration = `${seconds}s`;
    }
  }

}
