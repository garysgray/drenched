// ── HUD ───────────────────────────────────────────────────────
// Depends on: CONFIG

class HUD extends UIComponent 
{
  constructor()
  {
    super();
    this.el = document.querySelector('.HUD');
    
    // Cache DOM references
    this.slider = document.getElementById('scroll-speed');
    this.label = document.getElementById('scroll-speed-val');
    this.volSlider = document.getElementById('master-volume');
    this.volLabel = document.getElementById('master-volume-val');
    this.muteBtn = document.getElementById('mute-btn');
  }

  updateVisualState(actionType, value) 
  {
    switch (actionType) {
      case 'SET_RAIN_INTENSITY':
        // This runs your existing button highlight function smoothly
        this.syncSpeedButtonUI(value);
        break;
        
      case 'SET_COLOR':
        // This runs your existing color highlight function smoothly
        this.syncColorButtonUI(value);
        break;
        
      case 'SET_TEXT_MODE':
        // Put whatever method your HUD uses to hide/show the speed slider here
        // For example: this.syncTextModeUI(value);
        break;
    }
  }


  //Returns event mapping configuration
  getEventMaps() 
  {
    return [
      {
        elementId: 'scroll-speed',
        eventType: 'input',
        actionType: 'SET_SCROLL_SPEED'
      },
      {
        elementId: 'master-volume',
        eventType: 'input', 
        actionType: 'SET_MASTER_VOLUME'
      },
      {
        elementId: 'mute-btn',
        eventType: 'click',
        actionType: 'TOGGLE_MUTE'
      },
      {
        elementId: 'slow',
        eventType: 'click',
        actionType: 'SET_RAIN_INTENSITY',
        actionValue: 'slow'
      },
      {
        elementId: 'med',
        eventType: 'click',
        actionType: 'SET_RAIN_INTENSITY',
        actionValue: 'med'
      },
      {
        elementId: 'fast',
        eventType: 'click',
        actionType: 'SET_RAIN_INTENSITY',
        actionValue: 'fast'
      },
      {
        elementId: 'red',
        eventType: 'click',
        actionType: 'SET_COLOR',
        actionValue: 'red'
      },
      {
        elementId: 'green',
        eventType: 'click',
        actionType: 'SET_COLOR',
        actionValue: 'green'
      },
      {
        elementId: 'blue',
        eventType: 'click',
        actionType: 'SET_COLOR',
        actionValue: 'blue'
      }
    ];
  }

  
  updateVisualState(actionType, value) {
    switch(actionType) {
      case 'SET_SCROLL_SPEED':
        this.updateSliderLabel();
        break;
      case 'SET_MASTER_VOLUME':
        this.updateVolumeLabel();
        break;
      case 'TOGGLE_MUTE':
        this.updateMuteButtonVisuals(value);
        break;
      case 'SET_RAIN_INTENSITY':
        this.syncSpeedButtonUI(value);
        break;
      case 'SET_COLOR':
        this.syncColorButtonUI(value);
        break;
      case 'TOGGLE_SCROLL_MODE':
      case 'SET_TEXT_MODE':
        const isScrolling = !!value;
        const speedGroup = document.getElementById('scroll-speed-group');
        const divider = document.getElementById('scroll-speed-divider');
        if (speedGroup) speedGroup.style.display = isScrolling ? 'flex' : 'none';
        if (divider) divider.style.display = isScrolling ? 'block' : 'none';
        
        // Synchronize menu highlight button states if active text object is toggled
        this.syncTextMenuSlider(isScrolling);
        break;
    }
  }

  /**
   * NEW ENGINE INTERFACE: Handles the visual wipeout and highlight for weather speed buttons.
   */
  syncSpeedButtonUI(activeId) 
  {
    ['slow', 'med', 'fast'].forEach(b => {
      const el = document.getElementById(b);
      if (el) el.className = '';
    });
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.className = 'active-speed';
  }

  /**
   * NEW ENGINE INTERFACE: Handles the visual wipeout and lookup injection for color buttons.
   */
  syncColorButtonUI(activeId) 
  {
    ['red', 'green', 'blue'].forEach(b => {
      const el = document.getElementById(b);
      if (el) el.className = '';
    });
    const activeBtn = document.getElementById(activeId);
    if (activeBtn && CONFIG.colors[activeId]) {
      activeBtn.className = CONFIG.colors[activeId].cls;
    }
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
      this.updateVolumeLabel();
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
      this.muteBtn.className   = isMuted ? 'active-speed' : ''; 
      this.muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';   
    }
  }
}
