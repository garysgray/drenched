// ──────────────────────────────────────────────────────────────
// ── HUD ───────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Heads-Up Display controller managing all interactive UI elements
// Core Role:   Handles user input events and visual state updates for controls
// Dependencies: CONFIG, UIComponent

class HUD extends UIComponent 
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor()
  {
    super();
    
    // Main HUD container reference
    this.el = document.querySelector('.HUD');
    
    // Cache control element references
    this.slider = document.getElementById('scroll-speed');
    this.label = document.getElementById('scroll-speed-val');
    this.volSlider = document.getElementById('master-volume');
    this.volLabel = document.getElementById('master-volume-val');
    this.muteBtn = document.getElementById('mute-btn');
  }
  
  // Returns event mapping configuration
  getEventMaps() 
  {
    // Core structural control maps
    const baseMaps = [
      {
        elementId: 'scroll-speed',
        eventType: 'input',
        actionType: CONFIG.UIActions.SET_SCROLL_SPEED
      },
      {
        elementId: 'master-volume',
        eventType: 'input', 
        actionType: CONFIG.UIActions.SET_MASTER_VOLUME
      },
      {
        elementId: 'mute-btn',
        eventType: 'click',
        actionType: CONFIG.UIActions.TOGGLE_MUTE
      }
    ];

    // Safely generate rain maps via CONFIG public gateway
    const rainMaps = Object.entries(CONFIG.intensitiesModes).map(([key, value]) => 
    {
      return {
        elementId: key.toLowerCase(), 
        eventType: 'click',
        actionType: CONFIG.UIActions.SET_RAIN_INTENSITY,
        actionValue: value            
      };
    });

    // Safely generate color maps via CONFIG themes
    const colorMaps = Object.keys(CONFIG.colors).map((colorKey) => 
    {
      return {
        elementId: colorKey, 
        eventType: 'click',
        actionType: CONFIG.UIActions.SET_COLOR,
        actionValue: colorKey
      };
    });

    return [...baseMaps, ...rainMaps, ...colorMaps];
  }

  // BATCHED OPTIMIZATION: Updates visual highlights for rain intensity buttons cleanly
  syncSpeedButtonUI(activeValue) 
  {
    const updates = [];

    // Calculate state string purely in memory first
    Object.entries(CONFIG.intensitiesModes).forEach(([key, value]) => 
    {
      const el = document.getElementById(key.toLowerCase());
      if (el) 
      {
        const className = (value === activeValue) ? 'active-speed' : '';
        updates.push({ el, className });
      }
    });

    // Paint all elements to the DOM in a single rendering animation frame
    requestAnimationFrame(() => {
      updates.forEach(({ el, className }) => el.className = className);
    });
  }

  // BATCHED OPTIMIZATION: Updates visual highlights for theme colors based on CONFIG records
  syncColorButtonUI(activeColorKey) 
  {
    const updates = [];

    Object.entries(CONFIG.colors).forEach(([colorKey, colorConfig]) => 
    {
      const el = document.getElementById(colorKey);
      if (el) 
      {
        const className = (colorKey === activeColorKey) ? colorConfig.cls : '';
        updates.push({ el, className });
      }
    });

    requestAnimationFrame(() => 
    {
      updates.forEach(({ el, className }) => el.className = className);
    });
  }

  // Unified state handler for the HUD component
  updateVisualState(actionType, value) 
  {
    switch(actionType) 
    {
      case CONFIG.UIActions.SET_SCROLL_SPEED:
        this.updateSliderLabel();
        break;
      case CONFIG.UIActions.SET_MASTER_VOLUME:
        this.updateVolumeLabel();
        break;
      case CONFIG.UIActions.TOGGLE_MUTE:
        this.updateMuteButtonVisuals(value);
        break;
      case CONFIG.UIActions.SET_RAIN_INTENSITY:
        this.syncSpeedButtonUI(value);
        break;
      case CONFIG.UIActions.SET_COLOR:
        this.syncColorButtonUI(value);
        break;
      case CONFIG.UIActions.TOGGLE_SCROLL_MODE:
      case CONFIG.UIActions.SET_TEXT_MODE:
        this.syncTextMenuSlider(!!value);
        break;
    }
  }

  // BATCHED OPTIMIZATION: Syncs the text mode button highlights and sets displays in one cycle
  syncTextMenuSlider(isScrolling) 
  {
    const staticBtn = document.getElementById('text-mode-static');
    const scrollBtn = document.getElementById('text-mode-scroll');
    const speedGroup = document.getElementById('scroll-speed-group');
    const divider = document.getElementById('scroll-speed-divider');
    const displayValue = isScrolling ? 'flex' : 'none';
    const blockValue = isScrolling ? 'block' : 'none';

    // Queue up the structural changes to execute cleanly during the next screen paint stride
    requestAnimationFrame(() => 
    {
      if (staticBtn) staticBtn.className = isScrolling ? '' : 'active-speed';
      if (scrollBtn) scrollBtn.className = isScrolling ? 'active-speed' : '';
      if (speedGroup) speedGroup.style.display = displayValue;
      if (divider) divider.style.display = blockValue;
    });
  }

  // Setup initial text scroll slider bounds using values directly from config.js
  initScrollSlider() 
  {
    if (this.slider) 
    {
      this.slider.min   = CONFIG.scroll.minSpeedSecs;
      this.slider.max   = CONFIG.scroll.maxSpeedSecs;
      this.slider.value = CONFIG.scroll.defaultSpeedSecs;
      this.updateSliderLabel();
    }
  }

  // Updates the visual duration numbers label next to the scroll speed bar
  updateSliderLabel() 
  {
    if (this.label && this.slider) 
    {
      this.label.textContent = `${this.slider.value}s`;
    }
  }

  // Seed starting volume layout numbers based on configurations
  initVolumeUI()
  {
    if (this.volSlider && this.volLabel) 
    {
      this.volSlider.value = Math.round(CONFIG.masterVolume * 100);
      this.updateVolumeLabel();
    }
  }

  // Instantly synchronizes the text percentage readout label on screen
  updateVolumeLabel()
  {
    if (this.volLabel && this.volSlider) 
    {
      this.volLabel.textContent = `${this.volSlider.value}%`;
    }
  }

  // Checks system properties to accurately alter text labels and styling layouts
  updateMuteButtonVisuals(isMuted)
  {
    if (this.muteBtn) 
    {
      // Text updates are cheap, but we queue style updates nicely
      requestAnimationFrame(() => 
      {
        this.muteBtn.className   = isMuted ? 'active-speed' : ''; 
        this.muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';   
      });
    }
  }
}
