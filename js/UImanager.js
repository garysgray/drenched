// ──────────────────────────────────────────────────────────────
// ── UIMANAGER ──────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central controller for all UI components and their interactions
// Core Role:   Manages component registration, event handling, and state broadcasts
// Dependencies: UIComponent
//
// Design Notes:
// - UIManager acts as the mediator between UI components and engine systems.
// - Action routing remains explicit so each action is sent only to the
//   subsystem responsible for handling it.
// - UI configuration is supplied by Engine/CONFIG rather than hardcoded here.
// - Initial UI state is data-driven through initLayoutStates().
// ──────────────────────────────────────────────────────────────

class UIManager
{
// ── CONSTRUCTOR ────────────────────────────────────────────
constructor(audio, visuals, environment, autoHideConfig)
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

    // Auto-hide configuration is supplied by Engine from CONFIG.
    // UIManager should use the settings, not define their defaults.
    this._autoHideSettings = autoHideConfig;

    // Initialize auto-hide behavior
    this._initAutoHide();
}

// ── COMPONENT REGISTRATION ─────────────────────────────────
registerComponent(name, instance)
{
    this.components.set(name, instance);

    const eventMaps = instance.getEventMaps();

    eventMaps.forEach(({ elementId, eventType, actionType, actionValue }) =>
    {
        const element = document.getElementById(elementId);

        if (element)
        {
            // Save a named reference wrapper for this specific element handler
            const handler = () =>
            {
                this.engines.audio?.play('ui_click');

                // Range controls use their current value.
                // Buttons and other controls use their configured action value.
                const finalValue =(element.type === 'range') ? parseFloat(element.value): actionValue;

                this._handleComponentAction(actionType, finalValue);
            };

            element.addEventListener(eventType, handler);

            // Store it so destroy() can scrub it later
            this._registeredListeners.push({element, eventType, handler});
        }
    });
}

// ── ACTION ROUTING ─────────────────────────────────────────
_handleComponentAction(actionType, value)
{
    // Local value used when an engine returns a state that must be
    // broadcast to all UI components. Mute is the current example.
    let broadcastValue = value;

    // Explicit action routing is intentional.
    // UIManager is the mediator, so it knows which engine owns each action.
    // This is safer than blindly sending every action to every engine.

    switch (actionType)
    {
        // RAIN INTENSITY ENGINE PIPE
        case CONFIG.UIActions.SET_RAIN_INTENSITY:

            if (this.engines.environment && typeof this.engines.environment.changeIntensity === 'function')
            {
                this.engines.environment.changeIntensity(value);
            }

            break;

        // COLOR VISUAL ENGINE PIPE
        case CONFIG.UIActions.SET_COLOR:

            if (this.engines.visuals && typeof this.engines.visuals.setColor === 'function')
            {
                this.engines.visuals.setColor(value);
            }

            break;

        // MASTER VOLUME ENGINE PIPE
        case CONFIG.UIActions.SET_MASTER_VOLUME:

            if (this.engines.audio && typeof this.engines.audio.setMasterVolume === 'function')
            {
                // UI slider uses 0-100.
                // AudioManager expects 0.0-1.0.
                this.engines.audio.setMasterVolume(value / 100);
            }
            else if (this.engines.audio)
            {
                // Fallback for AudioManager implementations that
                // expose masterVolume directly.
                this.engines.audio.masterVolume = value / 100;
            }

            break;

        // MUTE STATE ENGINE PIPE
        case CONFIG.UIActions.TOGGLE_MUTE:

            if (this.engines.audio && typeof this.engines.audio.toggleMute === 'function')
            {
                // toggleMute() returns the new true/false mute state.
                // Broadcast that actual state to the UI components.
                broadcastValue = this.engines.audio.toggleMute();
            }

            break;

        // SCROLL SPEED ENGINE PIPE
        // Currently handled visually by UI components.
        // No engine action is required here.
        
        case CONFIG.UIActions.SET_SCROLL_SPEED:
            break;
    }

    // Broadcast the resulting state to ALL registered UI components.
    // Each component decides whether the action affects its own visual state.
    this.components.forEach((component) =>
    {
        if (typeof component.updateVisualState === 'function')
        {
            component.updateVisualState(actionType, broadcastValue);
        }
    });
}

// ── INITIAL UI STATE ───────────────────────────────────────
// Receives a data-driven list of initial states from Engine.
//
// Example:
// [
//     { actionType: CONFIG.UIActions.SET_COLOR, value: 'red' },
//     { actionType: CONFIG.UIActions.SET_MASTER_VOLUME, value: 75 }
// ]
//
// UIManager does not need to know how many settings exist.
// Engine simply supplies the initial state payload.
initLayoutStates(initialStates)
{
    if (!Array.isArray(initialStates))
    {
        return;
    }

    this.components.forEach((component) =>
    {
        if (typeof component.updateVisualState !== 'function')
        {
            return;
        }

        initialStates.forEach(({ actionType, value }) =>
        {
            component.updateVisualState(actionType, value);
        });
    });
}

// ── AUTO-HIDE INITIALIZATION ───────────────────────────────
_initAutoHide()
{
    if (!this.hudEl || !this._autoHideSettings)
    {
        return;
    }

    // Apply the CSS transition style from supplied configuration
    this.hudEl.style.transition = this._autoHideSettings.transitionCss;

    // Save a named reference to the function so it can be
    // un-bound later during destroy().
    this._boundShow = () => this._show();

    // Show the UI immediately on startup
    this._show();

    // Attach named listeners safely
    document.addEventListener('mousemove', this._boundShow);
    document.addEventListener('touchstart', this._boundShow);
    document.addEventListener('touchmove', this._boundShow);
}

// ── CLEANUP ────────────────────────────────────────────────
// Cleans up the UI controller to prevent lingering event listeners,
// timers, and references.
destroy()
{
    // Clear global mouse/touch listeners
    if (this._boundShow)
    {
        document.removeEventListener('mousemove', this._boundShow);
        document.removeEventListener('touchstart', this._boundShow);
        document.removeEventListener('touchmove', this._boundShow);

        this._boundShow = null;
    }

    // Unbind all component button/slider listeners safely
    this._registeredListeners.forEach(
        ({ element, eventType, handler }) =>
        {
            if (element)
            {
                element.removeEventListener(eventType, handler);
            }
        }
    );

    this._registeredListeners = [];

    // Kill active timers
    clearTimeout(this.hideTimer);
    this.hideTimer = null;

    console.log('UIManager: Listeners scrubbed from memory cleanly.');
}

// ── SHOW HUD ───────────────────────────────────────────────
_show()
{
    if (!this.hudEl)
    {
        return;
    }

    requestAnimationFrame(() =>
    {
        this.hudEl.style.cssText = `
            transition: ${this._autoHideSettings.transitionCss};
            opacity: 1;
            pointer-events: auto;
            transform: translateX(-50%) translateY(0);
        `;

        document.body.style.cursor = 'crosshair';
    });

    clearTimeout(this.hideTimer);

    this.hideTimer = setTimeout(() => this._hide(), this._autoHideSettings.autoHideMs);
}

// ── HIDE HUD ───────────────────────────────────────────────
_hide()
{
    if (!this.hudEl)
    {
        return;
    }

    requestAnimationFrame(() =>
    {
        this.hudEl.style.cssText = `
            transition: ${this._autoHideSettings.transitionCss};
            opacity: 0;
            pointer-events: none;
            transform: translateX(-50%) translateY(20px);
        `;

        document.body.style.cursor = 'none';
    });
}

}