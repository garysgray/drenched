// ──────────────────────────────────────────────────────────────
// ── MAIN ──────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Application entry point that initializes all systems
// Core Role:   Coordinates the boot sequence and starts the Engine
// Dependencies: CONFIG, Engine

// ── BOOT SEQUENCE ────────────────────────────────────────────
// 1. Waits for DOM readiness
// 2. Creates Engine instance (root coordinator)
// 3. Starts simulation with default parameters

// ──────────────────────────────────────────────────────────────
// ── MAIN ──────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

let lastTime = performance.now();
let accumulator = 0;

// Loop constraints
const FIXED_TIMESTEP = 1 / 60;    // 60fps logic updates
const MAX_FRAME_TIME = 0.25;      // Clamp lag spikes
const MAX_STEPS      = 5;         // Prevent spiral of death

document.addEventListener('DOMContentLoaded', () => 
{
    // Create the clean Engine instance
    window.engine = new Engine();

    // Reset loop baseline on tab focus to avoid giant delta bursts
    document.addEventListener("visibilitychange", () =>
    {
        if (document.visibilityState === "visible") 
        {
            lastTime = performance.now();
        }
    });

    // Start the heartbeat execution loop
    requestAnimationFrame(gameLoop);
});

function gameLoop()
{
    try
    {
        if (!window.engine) return;

        const now = performance.now();
        const frameTime = Math.min((now - lastTime) / 1000, MAX_FRAME_TIME);
        lastTime = now;
        accumulator += frameTime;

        let steps = 0;
        while (accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS)
        {
            // PASS DELTA TO THE ENGINE
            window.engine.update(FIXED_TIMESTEP);
            
            accumulator -= FIXED_TIMESTEP;
            steps++;
        }

        if (steps >= MAX_STEPS) 
        {
            accumulator = 0;
        }

        // Render pass runs on every browser visual tick frame
        if (window.engine.visuals && typeof window.engine.visuals.render === 'function')
        {
            window.engine.visuals.render();
        }
    }
    catch (e) 
    {
        console.error("Main gameLoop error:", e);
    }
    finally
    {
        requestAnimationFrame(gameLoop);
    }
}
