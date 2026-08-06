
class UIManager
{
  constructor(audio, visuals, environment) {
    this.engines = { audio, visuals, environment };
    this.components = new Map();
    this.hideTimer = null;
    this.hudEl = document.querySelector('.HUD');
    this._initAutoHide();
  }

  registerComponent(name, instance) {
    this.components.set(name, instance);
    
    if (typeof instance.setActionHandler === 'function') {
      instance.setActionHandler((actionType, value) => {
        this._handleComponentAction(actionType, value);
      });
    }
    
    const eventMaps = instance.getEventMaps();
    eventMaps.forEach(({elementId, eventType, actionType, actionValue}) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener(eventType, () => {
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
    switch(actionType) 
    {
      case 'SET_RAIN_INTENSITY':
        if (this.engines.environment) this.engines.environment.changeIntensity(value);
        break;
      case 'SET_COLOR':
        if (this.engines.visuals) this.engines.visuals.setColor(value);
        break;
      case 'TOGGLE_SCROLL_MODE':
      {
        const textDisplay = this.components.get('text_display');
        const hud = this.components.get('primary_hud');
        
        // 1. Flip text state internally
        if (textDisplay) {
          textDisplay.updateVisualState('TOGGLE_SCROLL_MODE');
          
          // 2. Alert the HUD component of the new state to adjust matching classes/sliders
          if (hud) {
            hud.updateVisualState('SET_TEXT_MODE', textDisplay.isScrolling);
          }
        }
        break; 
      }
      case 'SET_TEXT_MODE': 
      {
        const textDisplay = this.components.get('text_display');
        const hud = this.components.get('primary_hud');
        if (textDisplay) textDisplay.updateVisualState(actionType, value);
        if (hud) hud.updateVisualState(actionType, value);
        break;
      }
      case 'SET_SCROLL_SPEED': 
      {
        const hud = this.components.get('primary_hud');
        if (hud) {
          hud.updateVisualState(actionType, value);
          const textDisplay = this.components.get('text_display');
          if (textDisplay) {
            textDisplay.updateVisualState('UPDATE_SCROLL_SPEED', value);
            if (textDisplay.scrollText) {
              textDisplay.scrollText.style.animationDuration = `${value}s`;
            }
          }
        }
        break;
      }
      case 'SET_MASTER_VOLUME': 
      {
        const hud = this.components.get('primary_hud');
        if (hud) {
          hud.updateVisualState(actionType, value);
          if (this.engines.audio) this.engines.audio.setMasterVolume(value / 100);
        }
        break;
      }
      case 'TOGGLE_MUTE': 
      {
        const hud = this.components.get('primary_hud');
        if (hud) 
        {
          hud.updateVisualState(actionType, value);
          if (this.engines.audio) this.engines.audio.toggleMute();
        }
        break;
      }
    }
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
