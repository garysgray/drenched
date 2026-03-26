# Dark & Stormy Night — Rain Atmosphere Engine

![Game Splash](images/drenched.png)

An interactive atmospheric scene built with plain HTML, CSS, and JavaScript. Switch between storm intensities, text colors, and display modes — visuals and audio respond together in real time.

No frameworks. No build tools. Just open `index.html` and go.

---

## Features

- **Three storm intensities** — Rain, Storm, Torrent
- **Synthesized audio** — rain noise, thunder, and UI clicks via Web Audio API (no sound files)
- **Dynamic lightning** — CSS-driven flashes that scale with intensity
- **Layered atmosphere** — fog drift, CRT scanlines, vignette, film grain
- **Text modes** — static glowing title or scrolling marquee with adjustable speed
- **Color themes** — Red, Green, Blue with matching glow effects
- **Auto-hiding HUD** — fades out after 3 seconds of inactivity, cursor hides too
- **Responsive** — stacks cleanly on mobile screens under 640px

---

## Project Structure

```
Rain/
│ 
├── index.html
│ 
├── css/
│   └── style.css
│ 
├── js/
│   ├── config.js          — all intensity presets, colors, audio levels
│   ├── rain-audio.js      — RainAudio class (rain noise + thunder + click)
│   ├── rain-visuals.js    — RainVisuals class (CSS vars + film grain canvas)
│   ├── text-display.js    — TextDisplay class (static / scroll toggle)
│   ├── hud.js             — HUD class (buttons, auto-hide, cursor)
│   ├── engine.js          — Engine class (creates and wires all systems)
│   └── main.js            — entry point (boots engine on DOMContentLoaded)
│ 
└── images/
    
---

## Setup

1. Clone or download the repo
2. Make sure your folder structure matches the above
3. Open `index.html` in a browser

No install steps required.

---


## Controls

| Group | Options |
|---|---|
| Text Color | Red, Green, Blue |
| Rain Intensity | Rain, Storm, Torrent |
| Text Mode | Static, Scroll (with speed slider) |

The HUD auto-hides after 3 seconds. Move the mouse or tap the screen to bring it back.

---

## How the Audio Works

Everything is synthesized via the Web Audio API — no audio files required.

- **Rain** — white noise → bandpass filter → gain
- **Thunder** — noise crack (80ms burst) + 1–3 rumble layers (low-shelf + hi-cut filter), scheduled recursively with random delay
- **UI click** — short noise burst → highpass filter

Thunder delay by intensity: Rain 15–30s · Storm 8–16s · Torrent 3–7s

---

## Tech

- HTML5
- CSS3 (animations, custom properties)
- Vanilla JavaScript (Web Audio API, Canvas, requestAnimationFrame)

---

## Roadmap

- [ ] JS-driven lightning with randomized timing
- [ ] Wind gust audio layer
- [ ] Master volume control
- [ ] Keyboard shortcuts for intensity
- [ ] Fullscreen button
- [ ] Config-driven environment system (ocean, forest, desert, space...)
- [ ] Crossfade transitions between environments

---

## License

Free to use, modify, and build on.