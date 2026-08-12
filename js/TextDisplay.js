// ──────────────────────────────────────────────────────────────
// ── TEXTDISPLAY ───────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Manages all text rendering and animation for the scene
// Core Role:   Handles static and scrolling text modes with flash effects
// Dependencies: CONFIG, UIComponent
//
// Design Notes:
// - TextDisplay owns all text-specific behavior.
// - UIManager communicates with TextDisplay only through the UIComponent contract.
// - Shared listener cleanup is inherited from UIComponent.
// - TextDisplay does not need to know anything about UIManager.
// - EnvironmentController can directly call flashFont() for synchronized effects.

class TextDisplay extends UIComponent
{
    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor()
    {
        super();

        // Cache DOM references
        this.stage = document.querySelector('.text-stage');
        this.textWrap = document.querySelector('#text-toggle');
        this.mainText = document.querySelector('.main-text');
        this.shadowText = document.querySelector('.shadow-text');

        // State tracking
        this.isScrolling = false;
        this.flashTimeRemaining = 0;
        this.isFlashing = false;
        this.activeTargets = [];

        // Initialize text content from central config via textContent.
        // textContent keeps the operation safe because it treats the
        // configured text as text rather than executable HTML.
        const textAsset = CONFIG.text.content;

        if (this.mainText)
        {
        this.mainText.textContent = textAsset;
        }

        if (this.shadowText)
        {
        this.shadowText.textContent = textAsset;
        }

        // ── SECURE SCROLLING TEXT SETUP ────────────────────────
        // Create the scrolling text container dynamically.
        this.scrollEl = document.createElement('div');
        this.scrollEl.id = 'dynamic-scroll-text';
        this.scrollEl.className = 'scroll-left';
        this.scrollEl.style.cursor = 'pointer';

        // Create inner text node safely without innerHTML.
        this.scrollText = document.createElement('p');
        this.scrollText.textContent = textAsset;

        this.scrollEl.appendChild(this.scrollText);

        if (this.stage)
        {
        this.stage.appendChild(this.scrollEl);

        // Set initial display state
        this.stage.classList.remove('scrolling');
        }
    }

    // ── VISUAL STATE ROUTER ───────────────────────────────────
    // Receives unified state broadcasts from UIManager.
    // TextDisplay only reacts to actions that belong to text behavior. Other actions are intentionally ignored.
    updateVisualState(actionType, value)
    {
        switch(actionType)
        {
            case CONFIG.UIActions.TOGGLE_SCROLL_MODE:
                this.toggleScrollMode();
            break;

            case CONFIG.UIActions.SET_TEXT_MODE:
                this.forceSetMode(value);
            break;

            case CONFIG.UIActions.SET_SCROLL_SPEED:
                this.updateAnimationSpeed(value);
            break;
        }
    }

    // ── EVENT MAP CONFIGURATION ───────────────────────────────
    // Describes which DOM controls generate text-related actions.

    // UIManager reads this configuration and connects the controls to the centralized action-routing system.
    getEventMaps()
    {
        return [
            {
                elementId: 'text-toggle',
                eventType: 'click',
                actionType: CONFIG.UIActions.TOGGLE_SCROLL_MODE
            },
            {
                elementId: 'dynamic-scroll-text',
                eventType: 'click',
                actionType: CONFIG.UIActions.TOGGLE_SCROLL_MODE
            },
            {
                elementId: 'text-mode-static',
                eventType: 'click',
                actionType: CONFIG.UIActions.SET_TEXT_MODE,
                actionValue: false
            },
            {
                elementId: 'text-mode-scroll',
                eventType: 'click',
                actionType: CONFIG.UIActions.SET_TEXT_MODE,
                actionValue: true
            }
        ];
    }

    // ── FONT FLASH EFFECT ──────────────────────────────────────
    // Synchronized timeline entrypoint executed by EnvironmentController.

    // The timing values are supplied by the environment system so TextDisplay does not need to know how the weather timing works.
    flashFont({ attackSecs, decaySecs }, deltaOvershoot = 0)
    {
        this.activeTargets = [
        this.mainText,
        this.shadowText,
        this.scrollText
        ];

        console.log('[TEXT] FONT FLASH', { attack: attackSecs, decay: decaySecs, overshoot: deltaOvershoot });

        for (const el of this.activeTargets)
        {
            if (!el) continue;

            el.style.setProperty('--flash-attack', `${attackSecs}s`);
            el.style.setProperty('--flash-decay', `${decaySecs}s`);

            // Turn on the flash state visually
            el.dataset.flash = 'active';
        }

        // ── THE TIMING FIX ─────────────────────────────────────
        // The total lifespan of this visual event in seconds
        const totalLifespan = attackSecs + decaySecs;

        // Subtract the loop's delta overshoot so the text timeline 
        // matches the audio timeline perfectly
        this.flashTimeRemaining = totalLifespan - deltaOvershoot;
        this.isFlashing = true;
    }

    // ── MASTER TEXT HEARTBEAT TICK ────────────────────────────
    // Driven 60 times a second by your Engine.js game loop
    update(dt)
    {
        if (!this.isFlashing) return;

        // Tick down the countdown by the fixed frame step (1/60)
        this.flashTimeRemaining -= dt;

        if (this.flashTimeRemaining <= 0)
        {
            // The animation time has officially expired on this exact loop tick!
            // Clean up the DOM states safely
            for (const el of this.activeTargets)
            {
                if (el) el.dataset.flash = 'inactive';
            }

            console.log('[TEXT] FONT FLASH COMPLETE VIA DELTA HEARTBEAT');

            // Reset the state machine back to idle
            this.isFlashing = false;
            this.flashTimeRemaining = 0;
            this.activeTargets = [];
        }
    }

    // ── SCROLL CLICK CONNECTOR ────────────────────────────────
    // Allows another system to attach a callback to the dynamically created scrolling text element.

    // UIComponent now owns the listener tracking, so TextDisplay does not need its own _customCallbacks array.
    bindScrollElementClick(callbackFunction)
    {
        if (this.scrollEl && typeof callbackFunction === 'function')
        {
            this.addListener(this.scrollEl, 'click', callbackFunction);
        }
    }

    // ── SCROLL MODE TOGGLE ────────────────────────────────────
    // Flips the active scrolling state back and forth.
    toggleScrollMode()
    {
        this.forceSetMode(!this.isScrolling);
    }

    // ── SCROLL MODE SETTER ────────────────────────────────────
    // Forcefully switches the layout to a specific mode.
    forceSetMode(scrolling)
    {
        this.isScrolling = Boolean(scrolling);

        if (this.stage)
        {
            this.stage.classList.toggle('scrolling' ,this.isScrolling);
        }
    }

    // ── SCROLL SPEED ──────────────────────────────────────────
    // Adjusts the CSS marquee scroll timeline duration whenever the UI slider changes.
    updateAnimationSpeed(seconds)
    {
        if (this.scrollText)
        {
            this.scrollText.style.animationDuration = `${seconds}s`;
        }
    }

    // ── COMPLETE LIFE CYCLE TEARDOWN ──────────────────────────
    destroy()
    {
        // Kill any pending font flash timer.
        clearTimeout(this._fontFlashTimer);
        this._fontFlashTimer = null;

        // Remove listeners registered through UIComponent.addListener().
        super.destroy();

        // Remove the dynamically created scrolling element from the DOM.
        if (this.scrollEl && this.scrollEl.parentNode)
        {
            this.scrollEl.parentNode.removeChild(this.scrollEl);
        }

        console.log("TextDisplay: Active animations, listeners, and dynamic elements destroyed safely.");
    }

}

