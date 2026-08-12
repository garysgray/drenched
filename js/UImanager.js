// ──────────────────────────────────────────────────────────────
// ── UIMANAGER ─────────────────────────────────────────────────
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
// - UIManager owns listeners generated from component event maps.
// - Individual UI components own their own internal behavior and listeners.

class UIManager
{
    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(audio, visuals, environment)
    {
        // Reference core engine systems
        this.engines = { audio, visuals, environment };

        // Component registry
        this.components = new Map();

        // Track element listeners so we can unbind them during teardown
        this._registeredListeners = [];
    }

    // ── COMPONENT REGISTRATION ─────────────────────────────────
    registerComponent(name, instance)
    {
        // Validate the component contract immediately.
        // This produces a useful architectural error instead of allowing
        // a vague runtime failure later.
        if (!instance || typeof instance.getEventMaps !== 'function')
        {
            throw new TypeError(`UIManager: Component "${name}" must implement getEventMaps().`);
        }

        if (typeof instance.updateVisualState !== 'function')
        {
            throw new TypeError(`UIManager: Component "${name}" must implement updateVisualState().`);
        }

        // Register the component
        this.components.set(name, instance);

        // Retrieve the component's DOM event configuration
        const eventMaps = instance.getEventMaps();

        if (!Array.isArray(eventMaps))
        {
            throw new TypeError(`UIManager: Component "${name}" getEventMaps() must return an array.`);
        }

        eventMaps.forEach(({ elementId, eventType, actionType, actionValue }) =>
        {
            const element = document.getElementById(elementId);

            if (!element)
            {
                // Missing DOM elements should not crash the entire UI.
                console.warn(`UIManager: Element "${elementId}" not found for component "${name}".`);
                return;
            }

            // Save a named reference wrapper for this specific element handler
            const handler = () =>
            {
                if (this.engines.audio && typeof this.engines.audio.play === 'function')
                {
                    this.engines.audio.play('ui_click');
                }

                // Range controls use their current value.
                // Buttons and other controls use their configured action value.
                const finalValue = (element.type === 'range')
                    ? parseFloat(element.value)
                    : actionValue;

                this._handleComponentAction(actionType, finalValue);
            };

            element.addEventListener(eventType, handler);

            // Store it so destroy() can scrub it later
            this._registeredListeners.push({ element, eventType, handler });
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
            case CONFIG.UIActions.SET_RAIN_INTENSITY:

                if (this.engines.environment && typeof this.engines.environment.changeIntensity === 'function')
                {
                    this.engines.environment.changeIntensity(value);
                }
                StorageUtil.set('rainIntensity', value);
                break;

            case CONFIG.UIActions.SET_COLOR:

                if (this.engines.visuals && typeof this.engines.visuals.setColor === 'function')
                {
                    this.engines.visuals.setColor(value);
                }
                StorageUtil.set('colorTheme', value);
                break;

            case CONFIG.UIActions.SET_MASTER_VOLUME:

                if (this.engines.audio && typeof this.engines.audio.setMasterVolume === 'function')
                {
                    // UI slider uses 0-100.
                    // AudioManager expects 0.0-1.0.
                    this.engines.audio.setMasterVolume(value / 100);
                }
                else if (this.engines.audio)
                {
                    this.engines.audio.masterVolume = value / 100;
                }
                StorageUtil.set('masterVolume', value);
                break;

            case CONFIG.UIActions.TOGGLE_MUTE:

                if (this.engines.audio && typeof this.engines.audio.toggleMute === 'function')
                {
                    broadcastValue = this.engines.audio.toggleMute();
                }
                StorageUtil.set('muteMode', broadcastValue);
                break;

            case CONFIG.UIActions.SET_SCROLL_SPEED:
                 StorageUtil.set('scrollSpeed', value);
                break;

            case CONFIG.UIActions.TOGGLE_SCROLL_MODE:
                StorageUtil.set('scrollMode', value);
                break;

            case CONFIG.UIActions.SET_TEXT_MODE:
                StorageUtil.set('textMode', value);
                break;
        }

        // Broadcast the resulting state to ALL registered UI components.
        // Each component decides whether the action affects its own visual state.
        this.components.forEach((component) =>
        {
            component.updateVisualState(actionType, broadcastValue);
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
            initialStates.forEach(({ actionType, value }) =>
            {
                component.updateVisualState(actionType, value);
            });
        });
    }

        // ── NEW UTILITY: SAVE TO LOCALSTORAGE ──────────────────────
    _saveSetting(key, value)
    {
        try 
        {
            const savedData = localStorage.getItem("siteSettings");
            const currentSettings = savedData ? JSON.parse(savedData) : {};
            
            // Set the dynamic property key (like colorTheme, masterVolume, etc.)
            currentSettings[key] = value;
            
            localStorage.setItem("siteSettings", JSON.stringify(currentSettings));
        } 
        catch (e) 
        {
            console.error(`UIManager: Failed to save setting "${key}"`, e);
        }
    }


    // ── CLEANUP ────────────────────────────────────────────────
    // Cleans up the UI controller to prevent lingering event listeners.
    destroy()
    {
        // Unbind all component button/slider listeners safely
        this._registeredListeners.forEach(({ element, eventType, handler }) =>
        {
            if (element)
            {
                element.removeEventListener(eventType, handler);
            }
        });

        this._registeredListeners = [];

        console.log("UIManager: Event listeners scrubbed cleanly.");
    }

}

