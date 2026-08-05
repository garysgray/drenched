// ── HUD ───────────────────────────────────────────────────────
// Depends on: CONFIG

class HUD
{
  /**
   * Targets the DOM HUD wrapper, caches references, and initializes interface states.
   * No longer accepts callbacks, binds mouse events directly, or manages auto-hide timers.
   */
  constructor()
  {
    this.el        = document.querySelector('.HUD'); // The floating main interface window

    // Cache references to the interactive controls so the UIManager can manipulate them
    this.slider      = document.getElementById('scroll-speed');
    this.label       = document.getElementById('scroll-speed-val');
    this.volSlider   = document.getElementById('master-volume');
    this.volLabel    = document.getElementById('master-volume-val');
    this.muteBtn     = document.getElementById('mute-btn');
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
