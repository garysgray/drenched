// ── MAIN (Entry Point) ───────────────────────────────────────
//
// Architectural Role:
//   - Sole entry point for application initialization
//   - Coordinates the critical boot sequence
//   - Maintains no state (stateless entry handler)
//
// System Dependencies:
//   1. config.js (must load first for global CONFIG)
//   2. engine.js (core system coordinator)
//
// Boot Sequence:
//   1. Waits for DOMContentLoaded (safe DOM access)
//   2. Instantiates Engine (root coordinator)
//   3. Triggers start() with default intensity/color
//
// Key Constraints:
//   - Must remain lightweight (no business logic)
//   - Should only be called once (singleton pattern enforced by load order)
//
// Load Order in index.html:
//   config.js → audio-manager.js → rain-sounds.js → rain-visuals.js →
//   text-display.js → hud.js → engine.js → main.js

document.addEventListener('DOMContentLoaded', () =>
{
  const engine = new Engine();
  engine.start('slow', 'red');
});