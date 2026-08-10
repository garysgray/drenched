// ──────────────────────────────────────────────────────────────
// ── UIMANAGER ──────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central controller for all UI components and their interactions
// Core Role:   Manages component registration, event handling, and state broadcasts
// Dependencies: CONFIG, UIComponent, AudioManager, RainVisuals, EnvironmentController

class UIManager
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(audio, visuals, environment) 
  {
    // Reference core engine systems
    this.engines = { audio, visuals, environment };
    
    // Component registry
    this.components = new Map();
    
    // Auto-hide timer reference
    this.hideTimer = null;
    
    // Cache HUD element reference
    this.hudEl = document.querySelector('.HUD');

    // Track element listeners so we can unbind them during teardown
    this._registeredListeners = [];
    
    // Initialize auto-hide behavior
    this._initAutoHide();
  }

  registerComponent(name, instance) 
  {
    this.components.set(name, instance);
    
    const eventMaps = instance.getEventMaps();
    eventMaps.forEach(({elementId, eventType, actionType, actionValue}) => 
    {
      const element = document.getElementById(elementId);
      if (element) 
      {
        // Save a named reference wrapper for this specific element handler
        const handler = () => {
          this.engines.audio.play('ui_click');
          const finalValue = (element.type === 'range') ? parseFloat(element.value) : actionValue;
          this._handleComponentAction(actionType, finalValue);
        };

        element.addEventListener(eventType, handler);

        // Store it so destroy() can scrub it later
        this._registeredListeners.push({ element, eventType, handler });
      }
    });
  }
  _handleComponentAction(actionType, value) 
  {
    // Local placeholder to pass the updated mute boolean down to the HUD broadcast
    let broadcastValue = value;

    // Core Logic Redirection: Update background physics/audio context engines instantly
    switch(actionType) 
    {
      case CONFIG.UIActions.SET_RAIN_INTENSITY:
        if (this.engines.environment) 
        {
          this.engines.environment.changeIntensity(value);
        }
        break;
      case CONFIG.UIActions.SET_COLOR:
        if (this.engines.visuals) this.engines.visuals.setColor(value);
        break;

      // VOLUME CONTROL ENGINE PIPE
      case CONFIG.UIActions.SET_MASTER_VOLUME:
        if (this.engines.audio) 
        {
          // Check if your AudioManager uses a setter function, otherwise mutate the property
          if (typeof this.engines.audio.setMasterVolume === 'function') 
          {
            this.engines.audio.setMasterVolume(value / 100);
          } 
          else 
          {
            this.engines.audio.masterVolume = value / 100; // Scales 0-100 slider down to 0.0-1.0 float
          }
        }
        break;

      // MUTE STATE ENGINE PIPE
      case CONFIG.UIActions.TOGGLE_MUTE:
        if (this.engines.audio && typeof this.engines.audio.toggleMute === 'function') 
        {
          // Executes the audio hardware mute and grabs the returned true/false boolean
          broadcastValue = this.engines.audio.toggleMute(); 
        }
        break;

      // SCROLL SPEED ENGINE PIPE
      case CONFIG.UIActions.SET_SCROLL_SPEED:
        break;
    }

    // Loop through ALL registered components blindly. If they are a UIComponent,
    // pass the action straight through their standard inbound door.
    this.components.forEach((component) => 
    {
      if (typeof component.updateVisualState === 'function') 
      {
        component.updateVisualState(actionType, broadcastValue);
      }
    });
  }

  initLayoutStates(intensityId, colorId) 
{
  // Broadcast to all components safely without picking favorites by name
  this.components.forEach((component) => 
  {
    if (typeof component.updateVisualState === 'function') 
    {
      component.updateVisualState(CONFIG.UIActions.SET_RAIN_INTENSITY, intensityId);
      component.updateVisualState(CONFIG.UIActions.SET_COLOR, colorId);
      component.updateVisualState(CONFIG.UIActions.SET_SCROLL_SPEED, CONFIG.scroll.defaultSpeedSecs);
      component.updateVisualState(CONFIG.UIActions.SET_MASTER_VOLUME, Math.round(CONFIG.masterVolume * 100));
    }
  });
}

  _initAutoHide() 
  {
    if (!this.hudEl) return;
    
    // Apply the CSS transition style
    this.hudEl.style.transition = CONFIG.hud.transitionCss;
    
    // Save a named reference to the function so it can be un-bound later
    this._boundShow = () => this._show();
    
    // Show the UI immediately on startup
    this._show();
    
    // Attach named listeners safely
    document.addEventListener('mousemove',  this._boundShow);
    document.addEventListener('touchstart', this._boundShow);
    document.addEventListener('touchmove',  this._boundShow);
  }

  //  Add this cleanup method to your UIManager class to prevent memory leaks
  destroy() 
  {
    // Clear global mouse/touch ropes
    if (this._boundShow) 
    {
      document.removeEventListener('mousemove',  this._boundShow);
      document.removeEventListener('touchstart', this._boundShow);
      document.removeEventListener('touchmove',  this._boundShow);
    }

    // Unbind all component button/slider listeners safely
    this._registeredListeners.forEach(({ element, eventType, handler }) => {
      if (element) element.removeEventListener(eventType, handler);
    });
    this._registeredListeners = [];

    // Kill active timers
    clearTimeout(this.hideTimer);

    // Confirm execution to the engine coordinator
    console.log("UIManager: Listeners scrubbed from memory cleanly.");
  }

  _show() 
  {
    if (!this.hudEl) return;

    // Batch all HUD mutations into a single repaint stroke on the next frame refresh
    requestAnimationFrame(() => 
    {
      this.hudEl.style.cssText = `
        transition: ${CONFIG.hud.transitionCss};
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      `;
      document.body.style.cursor = 'crosshair';
    });

    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  _hide() 
  {
    if (!this.hudEl) return;

    // Batch all style removals together safely
    requestAnimationFrame(() => 
    {
      this.hudEl.style.cssText = `
        transition: ${CONFIG.hud.transitionCss};
        opacity: 0;
        pointer-events: none;
        transform: translateX(-50%) translateY(20px); 
      `;
      document.body.style.cursor = 'none';
    });
  }

}
