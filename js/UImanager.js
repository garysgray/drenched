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

    // Sub-modules managed by this UI object
    this.text      = new TextDisplay();
    this.hideTimer = null;

    // Cache DOM references in one clean place
    this.hudEl       = document.querySelector('.HUD');
    this.textSlider  = document.getElementById('scroll-speed');
    this.textLabel   = document.getElementById('scroll-speed-val');
    this.volSlider   = document.getElementById('master-volume');
    this.volLabel    = document.getElementById('master-volume-val');
    this.muteBtn     = document.getElementById('mute-btn');

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
      document.getElementById(id).addEventListener('click', () => {
        interact(() => {
          this.syncSpeedButtonUI(id);
          this.environment.changeIntensity(id);
        });
      });
    });

    // 2. RENDERING COLORS
    ['red', 'green', 'blue'].forEach(id => {
      document.getElementById(id).addEventListener('click', () => {
        interact(() => {
          this.syncColorButtonUI(id);
          this.visuals.setColor(id);
        });
      });
    });

    // 3. STORY TEXT INTERACTIONS (Big box & text marquee toggles)
    const handleTextToggle = () => {
      interact(() => {
        this.text.toggleScrollMode();
        this.syncTextMenuSlider(this.text.isScrolling);
      });
    };

    document.getElementById('text-toggle').addEventListener('click', handleTextToggle);
    this.text.bindScrollElementClick(handleTextToggle); // Fixed pointer hand marquee link

    document.getElementById('text-mode-static').addEventListener('click', () => {
      interact(() => { this.text.forceSetMode(false); this.syncTextMenuSlider(false); });
    });

    document.getElementById('text-mode-scroll').addEventListener('click', () => {
      interact(() => { this.text.forceSetMode(true); this.syncTextMenuSlider(true); });
    });

    // 4. SCROLL SPEED SLIDER
    this.textSlider.addEventListener('input', () => {
      this.textLabel.textContent = `${this.textSlider.value}s`;
      this.text.updateAnimationSpeed(this.textSlider.value);
    });

    // 5. MASTER VOLUME SLIDER
    this.volSlider.addEventListener('input', () => {
      this.audio.setMasterVolume(this.volSlider.value / 100);
      this.volLabel.textContent = `${this.volSlider.value}%`;
    });

    // 6. MASTER AUDIO MUTE SYSTEM
    this.muteBtn.addEventListener('click', () => {
      interact(() => {
        this.audio.toggleMute();
        this.updateMuteButtonVisuals(this.audio.muted);
      });
    });
  }

  /**
   * Sets up starting values and configurations across the layout elements.
   */
  initLayoutStates(intensityId, colorId)
  {
    this.syncSpeedButtonUI(intensityId);
    this.syncColorButtonUI(colorId);

    // Seed sliders straight from config rules
    this.textSlider.min   = CONFIG.scroll.minSpeedSecs;
    this.textSlider.max   = CONFIG.scroll.maxSpeedSecs;
    this.textSlider.value = CONFIG.scroll.defaultSpeedSecs;
    this.textLabel.textContent = `${this.textSlider.value}s`;

    this.volSlider.value = Math.round(CONFIG.masterVolume * 100);
    this.volLabel.textContent = `${this.volSlider.value}%`;
    this.updateMuteButtonVisuals(this.audio.muted);
  }

  // ── VISUAL STATE SYNCHRONIZERS ──
  
  syncSpeedButtonUI(activeId) {
    ['slow', 'med', 'fast'].forEach(b => document.getElementById(b).className = '');
    document.getElementById(activeId).className = 'active-speed';
  }

  syncColorButtonUI(activeId) {
    ['red', 'green', 'blue'].forEach(b => document.getElementById(b).className = '');
    document.getElementById(activeId).className = CONFIG.colors[activeId].cls;
  }

  syncTextMenuSlider(isScrolling) {
    document.getElementById('text-mode-static').className = isScrolling ? '' : 'active-speed';
    document.getElementById('text-mode-scroll').className = isScrolling ? 'active-speed' : '';
    document.getElementById('scroll-speed-group').style.display   = isScrolling ? 'flex'  : 'none';
    document.getElementById('scroll-speed-divider').style.display = isScrolling ? 'block' : 'none';
  }

  updateMuteButtonVisuals(isMuted) {
    this.muteBtn.className   = isMuted ? 'active-speed' : '';
    this.muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
  }

  // ── IDLE ANIMATION LOOPS (Old HUD behaviors) ──

  _initAutoHide() {
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
    this.hudEl.style.opacity       = '1';
    this.hudEl.style.pointerEvents = 'auto';
    this.hudEl.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  _hide() {
    this.hudEl.style.opacity       = '0';
    this.hudEl.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}

//This is the file you were looking for. It groups your old HUD and TextDisplay into one single, master UI file, keeping all the event listeners, click handlers, and DOM bindings completely isolated away from your core simulation physics [^utils].
// Why this structure matches your engineering goals:The Engine is clean: It doesn't fetch elements, write strings like 'ui_click', or parse sliders. It just sets up the backend and passes control to the UI object [^utils].True initialization pipeline: Inside UIManager, the setup runs sequentially through _initEventListeners() and _initAutoHide() inside the constructor, neatly collecting your code paths [^utils].No scattered files: Your previous HUD.js file is now completely swallowed by this clean UIManager.js file, eliminating one of your 9 files entirely and reducing overall system clutter [^utils].(Note: Your TextDisplay.js file stays exactly the same as the clean version from the previous turn!)Does this setup feel much closer to how you prefer to organize your game engine loops? Let me know if we should check out how the EnvironmentController acts as the glue code between this new UI system and the weather sounds!