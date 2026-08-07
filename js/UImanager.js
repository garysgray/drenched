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
        element.addEventListener(eventType, () => 
        {
          this.engines.audio.play('ui_click');
          
          // KEEPING THIS intact: Ensures dynamic values map directly from range sliders
          const finalValue = (element.type === 'range') ? parseFloat(element.value) : actionValue;
          
          this._handleComponentAction(actionType, finalValue);
        });
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
      case 'SET_RAIN_INTENSITY':
        if (this.engines.environment) 
          {
            this.engines.environment.changeIntensity(value);
          }
        break;
      case 'SET_COLOR':
        if (this.engines.visuals) this.engines.visuals.setColor(value);
        break;

      // VOLUME CONTROL ENGINE PIPE
      case 'SET_MASTER_VOLUME':
        if (this.engines.audio) {
          // Check if your AudioManager uses a setter function, otherwise mutate the property
          if (typeof this.engines.audio.setMasterVolume === 'function') {
            this.engines.audio.setMasterVolume(value / 100);
          } else {
            this.engines.audio.masterVolume = value / 100; // Scales 0-100 slider down to 0.0-1.0 float
          }
        }
        break;

      // MUTE STATE ENGINE PIPE
      case 'TOGGLE_MUTE':
        if (this.engines.audio && typeof this.engines.audio.toggleMute === 'function') {
          // Executes the audio hardware mute and grabs the returned true/false boolean
          broadcastValue = this.engines.audio.toggleMute(); 
        }
        break;

      // SCROLL SPEED ENGINE PIPE
      case 'SET_SCROLL_SPEED':
        // Redirect the speed duration change straight to the TextDisplay component instance
        const textDisplay = this.components.get('text_display');
        if (textDisplay && typeof textDisplay.updateVisualState === 'function') 
        {
          textDisplay.updateVisualState(actionType, value);
        }
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
    const hud = this.components.get('primary_hud');
    if (hud) 
      {
      hud.updateVisualState('SET_RAIN_INTENSITY', intensityId);
      hud.updateVisualState('SET_COLOR', colorId);
      hud.updateVisualState('SET_SCROLL_SPEED', CONFIG.scroll.defaultSpeedSecs);
      hud.updateVisualState('SET_MASTER_VOLUME', Math.round(CONFIG.masterVolume * 100));
    }
  }

  _initAutoHide() 
  {
    if (!this.hudEl) return;
    this.hudEl.style.transition = CONFIG.hud.transitionCss;
    requestAnimationFrame(() => 
    {
      requestAnimationFrame(() => 
      {
        this._show();
        document.addEventListener('mousemove',  () => this._show());
        document.addEventListener('touchstart', () => this._show());
        document.addEventListener('touchmove',  () => this._show());
      });
    });
  }

  _show() 
  {
    if (!this.hudEl) return;
    this.hudEl.style.opacity       = '1';
    this.hudEl.style.pointerEvents = 'auto';
    this.hudEl.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  _hide() 
  {
    if (!this.hudEl) return;
    this.hudEl.style.opacity       = '0';
    this.hudEl.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}
