// ── UIManager ─────────────────────────────────────────────────
//
// Owns 100% of the DOM interface, text modules, and input layouts.
// Completely isolates the HTML structure away from the Engine core.

class UIManager
{
  constructor(audio, visuals, environment)
  {
    // Cache references to the core engines so we can trigger them on click
    this.audio       = audio;
    this.visuals     = visuals;
    this.environment = environment;

    // PYRAMID PYRAMID: UIManager instantiates and owns HUD internally!
    this.hud         = new HUD();

    // Sub-modules managed by this UI object
    this.text      = new TextDisplay();
    this.hideTimer = null;

    // Cache DOM references in one clean place
    this.hudEl       = document.querySelector('.HUD');

    // Run the master initialization layout hooks immediately at bootup
    this._initEventListeners();
    this._initAutoHide();
  }

  /**
   * Master Event Binder: Keeps all project click bindings in one centralized UI function.
   */
  _initEventListeners()
  {
    // Internal helper: plays click feedback before executing core changes
    const interact = (action) => {
      this.audio.play('ui_click');
      action();
    };

    // 1. WEATHER SPEEDS
    ['slow', 'med', 'fast'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          interact(() => {
            this.hud.syncSpeedButtonUI(id);
            this.environment.changeIntensity(id);
          });
        });
      }
    });

    // 2. RENDERING COLORS
    ['red', 'green', 'blue'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          interact(() => {
            this.hud.syncColorButtonUI(id);
            this.visuals.setColor(id);
          });
        });
      }
    });

    // 3. STORY TEXT INTERACTIONS (Big box & text marquee toggles)
    const handleTextToggle = () => {
      interact(() => {
        this.text.toggleScrollMode();
        this.hud.syncTextMenuSlider(this.text.isScrolling);
      });
    };

    const textToggle = document.getElementById('text-toggle');
    if (textToggle) textToggle.addEventListener('click', handleTextToggle);
    
    if (this.text && typeof this.text.bindScrollElementClick === 'function') {
      this.text.bindScrollElementClick(handleTextToggle);
    }

    const staticMode = document.getElementById('text-mode-static');
    if (staticMode) {
      staticMode.addEventListener('click', () => {
        interact(() => { this.text.forceSetMode(false); this.hud.syncTextMenuSlider(false); });
      });
    }

    const scrollMode = document.getElementById('text-mode-scroll');
    if (scrollMode) {
      scrollMode.addEventListener('click', () => {
        interact(() => { this.text.forceSetMode(true); this.hud.syncTextMenuSlider(true); });
      });
    }

        // 4. SCROLL SPEED SLIDER
    // The manager listens for the input event, but attaches it directly to the HUD's slider asset!
    if (this.hud.slider) {
      this.hud.slider.addEventListener('input', () => {
        this.hud.updateSliderLabel(); // Tell HUD skin to change its text readout label
        this.text.updateAnimationSpeed(this.hud.slider.value); // Tell Text engine to change marquee duration
      });
    }

    // 5. MASTER VOLUME SLIDER
    if (this.hud.volSlider) {
      this.hud.volSlider.addEventListener('input', () => {
        const val = this.hud.volSlider.value; // Read the value from the HUD slider
        this.audio.setMasterVolume(val / 100); 
        this.hud.updateVolumeLabel(); // Tell HUD skin to update its % text label
      });
    }

    // 6. MASTER AUDIO MUTE SYSTEM
    if (this.hud.muteBtn) {
      this.hud.muteBtn.addEventListener('click', () => {
        interact(() => {
          this.audio.toggleMute();
          this.hud.updateMuteButtonVisuals(this.audio.muted); // Tell HUD skin to swap Mute/Unmute text words
        });
      });
    }

  }

  /**
   * Sets up starting values and configurations across the layout elements.
   */
  initLayoutStates(intensityId, colorId)
  {
    this.hud.syncSpeedButtonUI(intensityId);
    this.hud.syncColorButtonUI(colorId);

    // Seed sliders straight from config rules
    this.hud.initScrollSlider();
    this.hud.initVolumeUI();
  }

  // ── IDLE ANIMATION LOOPS ──

  _initAutoHide() {
    if (!this.hudEl) return;
    this.hudEl.style.transition = CONFIG.hud.transitionCss;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._show();
        document.addEventListener('mousemove',  () => this._show());
        document.addEventListener('touchstart', () => this._show());
        document.addEventListener('touchmove',  () => this._show());
      });
    });
  }

  _show() {
    if (!this.hudEl) return;
    this.hudEl.style.opacity       = '1';
    this.hudEl.style.pointerEvents = 'auto';
    this.hudEl.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  _hide() {
    if (!this.hudEl) return;
    this.hudEl.style.opacity       = '0';
    this.hudEl.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}
