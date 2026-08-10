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

document.addEventListener('DOMContentLoaded', () => 
{
  // Attach the instance to the window object so the debugger can access it
  window.engine = new Engine();
});
