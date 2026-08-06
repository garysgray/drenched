
class UIManager
{
  constructor(audio, visuals, environment) 
  {
    this.engines = { audio, visuals, environment };
    this.components = new Map();
    this.hideTimer = null;
    this.hudEl = document.querySelector('.HUD');
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
    // Core Logic Redirection: Update background physics/audio context engines instantly
    switch(actionType) 
    {
      case 'SET_RAIN_INTENSITY':
        if (this.engines.environment) this.engines.environment.changeIntensity(value);
        break;
      case 'SET_COLOR':
        if (this.engines.visuals) this.engines.visuals.setColor(value);
        break;
      // ... keep any other core engine mappings here (e.g. volume controls)
    }

    // Loop through ALL registered components blindly. If they are a UIComponent,
    // pass the action straight through their standard inbound door.
    this.components.forEach((component) => {
      if (typeof component.updateVisualState === 'function') {
        component.updateVisualState(actionType, value);
      }
    });
  }

  initLayoutStates(intensityId, colorId) 
  {
    const hud = this.components.get('primary_hud');
    if (hud) {
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
