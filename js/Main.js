// ── main.js ───────────────────────────────────────────────────
//
// Entry point. Waits for the DOM to be ready, then boots the engine.
// This is the only place that calls new Engine() and engine.start().
//
// Load order in index.html:
//   config.js → rain-audio.js → rain-visuals.js →
//   text-display.js → hud.js → engine.js → main.js

document.addEventListener('DOMContentLoaded', () =>
{
  const engine = new Engine();
  engine.start('slow', 'red');
});