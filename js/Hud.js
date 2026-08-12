//──────────────────────────────────────────────────────────────
// ── HUD ───────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Heads-Up Display controller managing all interactive UI elements
// Core Role:   Handles user input events, visual state updates, and HUD behavior
// Dependencies: CONFIG, UIComponent
//
// Design Notes:
// - HUD owns everything related to its own visual behavior.
// - HUD owns auto-hide timing and mouse/touch interaction.
// - UIManager only communicates with HUD through the UIComponent contract.
// - Auto-hide configuration is supplied by Engine from CONFIG.

class HUD extends UIComponent
{
  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(autoHideConfig)
  {
      super();

      // Main HUD container reference
      this.el = document.querySelector('.HUD');

      // Cache control element references
      this.scrollSlider = document.getElementById('scroll-speed');
      this.label = document.getElementById('scroll-speed-val');
      this.volSlider = document.getElementById('master-volume');
      this.volLabel = document.getElementById('master-volume-val');
      this.muteBtn = document.getElementById('mute-btn');

      // Auto-hide configuration is supplied by Engine from CONFIG.
      this._autoHideSettings = autoHideConfig;

      this.hudIdleCountdown = 0;
      this.isHudTimerActive = false;

      // Save named listener reference so it can be removed during destroy()
      this._boundShow = () => this.show();

      // Initialize HUD auto-hide behavior
      this._initAutoHide();

      this.initScrollSlider();
      this.initVolumeUI();
  }

  // ── EVENT MAP CONFIGURATION ───────────────────────────────
  // Returns event mapping configuration for UIManager.
  //
  // HUD describes what controls exist.
  // UIManager decides how those events are routed.
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

  // ── VISUAL STATE ROUTER ───────────────────────────────────
  // Receives state broadcasts from UIManager and updates the HUD.
  updateVisualState(actionType, value)
  {
      switch(actionType)
      {
          case CONFIG.UIActions.SET_SCROLL_SPEED:
              // 1. Force the physical slider element handle to move
              if (this.scrollSlider) {
                  this.scrollSlider.value = value;
              }
              // 2. Refresh the visible textual readout label on your screen
              this.updateSliderLabel();
              break;

          case CONFIG.UIActions.SET_MASTER_VOLUME:
              // Force the slider knob to jump to the loaded value
              if (this.volSlider) {
                  this.volSlider.value = value;
              }
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

  // ── AUTO-HIDE INITIALIZATION ───────────────────────────────
  _initAutoHide()
  {
      if (!this.el || !this._autoHideSettings)
      {
          return;
      }

      // Apply the CSS transition style from supplied configuration
      this.el.style.transition = this._autoHideSettings.transitionCss;

      // Show the HUD immediately on startup
      this.show();

      // HUD owns its own global interaction listeners.
      document.addEventListener('mousemove', this._boundShow);
      document.addEventListener('touchstart', this._boundShow);
      document.addEventListener('touchmove', this._boundShow);
  }
  // ── MASTER HUD TICK LOOP ─────────────────────────────────────
    // Driven 60 times a second by your Engine.js game loop
    update(dt)
    {
        if (!this.isHudTimerActive) return;

        // Tick down the countdown by the fixed frame fraction (1/60)
        this.hudIdleCountdown -= dt;

        if (this.hudIdleCountdown <= 0)
        {
            // The mouse idle time has officially expired on this exact loop tick!
            this.hide();
            
            // Reset the tracker states back to idle
            this.isHudTimerActive = false;
            this.hudIdleCountdown = 0;
        }
    }


  // ── SHOW HUD ───────────────────────────────────────────────
  // Makes the HUD visible and restarts the auto-hide countdown.
    show()
    {
        if (!this.el || !this._autoHideSettings)
        {
            return;
        }

        requestAnimationFrame(() =>
        {
            this.el.style.cssText = `
                transition: ${this._autoHideSettings.transitionCss};
                opacity: 1;
                pointer-events: auto;
                transform: translateX(-50%) translateY(0);
            `;

            document.body.style.cursor = 'crosshair';
        });

        // ── THE TIMING FIX ─────────────────────────────────────
        // Convert your configured milliseconds safely into pure SECONDS
        const autoHideSeconds = this._autoHideSettings.autoHideMs / 1000;

        // Seed the active countdown deadline
        this.hudIdleCountdown = autoHideSeconds;
        this.isHudTimerActive = true;
    }
  // ── HIDE HUD ───────────────────────────────────────────────
  // Hides the HUD after the configured inactivity period.
  hide()
  {
      if (!this.el || !this._autoHideSettings)
      {
          return;
      }

      requestAnimationFrame(() =>
      {
          this.el.style.cssText = `
              transition: ${this._autoHideSettings.transitionCss};
              opacity: 0;
              pointer-events: none;
              transform: translateX(-50%) translateY(20px);
          `;

          document.body.style.cursor = 'none';
      });
  }

  // ── RAIN INTENSITY BUTTON UI ───────────────────────────────
  // Updates the active rain intensity button.
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

      // Paint all elements in a single rendering animation frame
      requestAnimationFrame(() =>
      {
          updates.forEach(({ el, className }) =>
          {
              el.className = className;
          });
      });
  }

  // ── COLOR BUTTON UI ────────────────────────────────────────
  // Updates the active color theme button.
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
          updates.forEach(({ el, className }) =>
          {
              el.className = className;
          });
      });
  }

  // ── TEXT MODE UI ───────────────────────────────────────────
  // Syncs the text mode button highlights and scroll controls.
  syncTextMenuSlider(isScrolling)
  {
      const staticBtn = document.getElementById('text-mode-static');
      const scrollBtn = document.getElementById('text-mode-scroll');
      const speedGroup = document.getElementById('scroll-speed-group');
      const divider = document.getElementById('scroll-speed-divider');

      const displayValue = isScrolling ? 'flex' : 'none';
      const blockValue = isScrolling ? 'block' : 'none';

      // Queue structural changes for the next screen paint stride
      requestAnimationFrame(() =>
      {
          if (staticBtn)
          {
              staticBtn.className = isScrolling ? '' : 'active-speed';
          }

          if (scrollBtn)
          {
              scrollBtn.className = isScrolling ? 'active-speed' : '';
          }

          if (speedGroup)
          {
              speedGroup.style.display = displayValue;
          }

          if (divider)
          {
              divider.style.display = blockValue;
          }
      });
  }

  // ── SCROLL SLIDER INITIALIZATION ───────────────────────────
  // Setup initial text scroll slider bounds using values directly from CONFIG.
  initScrollSlider()
  {
      if (this.scrollSlider)
      {
          this.scrollSlider.min = CONFIG.scroll.minSpeedSecs;
          this.scrollSlider.max = CONFIG.scroll.maxSpeedSecs;
          this.scrollSlider.value = CONFIG.scroll.defaultSpeedSecs;

          this.updateSliderLabel();
      }
  }

  // ── SCROLL SPEED LABEL ─────────────────────────────────────
  // Updates the visual duration number next to the scroll speed bar.
  updateSliderLabel()
  {
      if (this.label && this.scrollSlider)
      {
          this.label.textContent = `${this.scrollSlider.value}s`;
      }
  }

  // ── VOLUME UI INITIALIZATION ───────────────────────────────
  // Seed starting volume layout numbers based on configuration.
   // ── VOLUME UI INITIALIZATION ───────────────────────────────
  // Seed starting volume layout numbers based on configuration or storage.
  initVolumeUI()
  {
      if (this.volSlider && this.volLabel)
      {
          // Simply pass the key you want and the default fallback value
          const defaultVol = Math.round(CONFIG.masterVolume * 100);
          this.volSlider.value = StorageUtil.get('masterVolume', defaultVol);
          
          this.updateVolumeLabel();
      }
  }

  // ── VOLUME LABEL ───────────────────────────────────────────
  // Synchronizes the text percentage readout on screen.
  updateVolumeLabel()
  {
      if (this.volLabel && this.volSlider)
      {
          this.volLabel.textContent = `${this.volSlider.value}%`;
      }
  }

  // ── MUTE BUTTON UI ─────────────────────────────────────────
  // Updates the mute button text and active styling.
  updateMuteButtonVisuals(isMuted)
  {
      if (this.muteBtn)
      {
          requestAnimationFrame(() =>
          {
              this.muteBtn.className = isMuted ? 'active-speed' : '';
              this.muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
          });
      }
  }

  // ── COMPLETE LIFE CYCLE TEARDOWN ───────────────────────────
  // HUD owns these listeners, so HUD must remove them.
  destroy()
  {
      // Remove global mouse/touch listeners owned by HUD
      document.removeEventListener('mousemove', this._boundShow);
      document.removeEventListener('touchstart', this._boundShow);
      document.removeEventListener('touchmove', this._boundShow);

      // Kill active auto-hide timer
      clearTimeout(this.hideTimer);
      this.hideTimer = null;

      // Clean up any listeners registered through UIComponent.addListener()
      super.destroy();

      console.log("HUD: Auto-hide listeners and timers destroyed safely.");
  }

}

