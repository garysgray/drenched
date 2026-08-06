
# Dark & Stormy Night — Atmospheric Environment Engine

![Game Splash](images/drenched.png)

An interactive, highly optimized, and modular atmospheric environment engine built with vanilla web technologies. Visual layers, dynamic configurations, and procedurally synthesized audio assets respond in perfect synchronization via an event-driven architectural layer.

No frameworks. No build tools. Completely production-locked and vanilla.

---

## 🌟 Architectural Features

- **Abstract Mediator & Component Architecture** — Built around a strict, object-oriented `UIComponent` base blueprint class. The central `UIManager` is 100% abstract, blindly broadcasting state changes down an inbound communication corridor (`updateVisualState`) to eliminate hardcoded component coupling.
- **Data-Driven Asset Architecture** — A centralized asset configuration system drives text nodes, color values, and weather timings out of a single source of truth (`js/Config.js`), allowing instant, zero-maintenance thematic swaps.
- **Hardware-Accelerated Composite Graphics (`0ms` Scripting Overhead)** — Heavy visual effects like full-screen film grain texture flickering and lightning flashes have been completely offloaded from the JavaScript runtime loops directly onto the browser's hardware GPU compositor layer using CSS keyframe matrices and data-attribute selector tokens.
- **Procedurally Synthesized Audio** — Persistent ambient rain loops, multi-layered randomized rolling thunder shockwaves, and high-pass acoustic click feedbacks are generated mathematically at runtime via low-level Web Audio API nodes. Zero external audio file download dependencies.
- **Unified Master Scene Director** — An orchestrating environment controller manages independent simulation scheduling clocks, calculating and syncing thunder acoustics with graphic power-grid surges at the exact same millisecond.
- **Responsive Controls & Interactivity** — Auto-hiding control panel dashboard HUD tracking interface bounds, automatic mouse cursor suppression during idle states, and a smart resize debouncer loop that shields the memory thread during viewport adjustments.

---

## 📂 Project Structure

```text
Rain/
│ 
├── index.html                  — Clean document scaffolding, asset loader queue, & blank text slots
│ 
├── css/
│   └── style.css               — Layer coordinates, hardware transition mappings, & GPU matrix timelines
│ 
├── js/
│   ├── Config.js                — Deep-frozen immutable object presets, weather arrays, & central story copy
│   ├── UIComponent.js           — Strict abstract base class definition forcing unified component blueprints
│   ├── UIManager.js             — Decoupled traffic coordinator; installs event maps and broadcasts updates
│   ├── EnvironmentController.js — Master Scene Director managing strike timers and cross-system sync arrays
│   ├── AudioManager.js          — Low-level sound mixer graphs, noise buffers, and node tracking pools
│   ├── RainVisuals.js           — Procedural color themes, lightning trackers, and base64 CSS grain generators
│   ├── TextDisplay.js           — Unified UI component handling startup text injection & typography profiles
│   ├── Hud.js                   — Unified UI component handling dashboard selectors & auto-hide states
│   └── Engine.js                — Top-level bootloader executing dependency injections and initialization
│ 
└── images/
```


## 🛠️ Setup & Lifecycle Execution

1. Clone or download the repository template folder.
2. Verify that your file tree accurately matches the project tree maps above.
3. Open `index.html` natively inside any modern browser viewport interface.


## 🎛️ Interactive Controls

| Control Group | Active Functional Targets | Interface Engine Routing Mechanics |
|---|---|---|
| **Text Color** | Shifting palettes (Red, Green, Blue) | Updates `--text-color` root bounds via `updateVisualState` |
| **Rain Intensity** | Weather clock index arrays (Rain, Storm, Torrent) | Modulates background sound loops and weather timer profiles |
| **Text Mode** | Layout rendering profiles | CSS visibility toggling between Static Frame and Scroll Marquee |
| **Volume Configuration** | Logarithmic audio slider & Mute button | Direct sound mixer gain node manipulation |

The interface dashboard automatically slides away and hides the cursor after 3 seconds of user idle time. Move your mouse, slide an element tracking knob, or tap the layout box to wake up the system.

---

## ⚡ How the Synthesized Engine Works

Everything is mathematically calculated, formulated, and mapped natively inside the browser context — creating maximum resource optimization.

- **Persistent Ambient Generation** — A localized white-noise audio generator loop writes randomly generated vectors to a persistent buffer channel. The array passes directly through a Web Audio `BandpassFilterNode` and handles volume fading shifts asynchronously.
- **The Non-Blocking Strike Sequence** — When the environment scheduling timer ticks over, the system initiates three actions simultaneously on the exact same millisecond:
  1. **Acoustic Shockwaves**: Schedules an explosive high-gain noise crack node followed by stacked, time-shifted low-frequency rolling rumbles that expand through lowpass filter graphs to simulate distance depth.
  2. **Asynchronous Visual Flashes**: JavaScript stamps explicit attack/decay CSS transition variables onto the empty `#lightning` container tag and flips its state to `data-flash="active"`. The browser shifts the entire opacity calculation layer over to the GPU compositor, flashing the page smoothly.
  3. **Typographic Voltage Stress**: The hero text tags utilize the exact same state attribute selectors, scaling their brightness filters up to peak levels and shifting text shadow coordinates asynchronously to mimic power-grid hardware strain.

---

## 🛠️ Technology Stack

- **HTML5 Core Semantics** (Structural DOM wrappers, Document layouts, Data-Attributes)
- **CSS3 Compositor Architecture** (Dynamic variable inheritance, matrix transformation keyframes, will-change hardware layers)
- **Vanilla Modern ES6+ JavaScript** (Web Audio API nodes, Callbacks, Map Data Structures, Object Nesting, Object.freeze protection methods)

---

## 🗺️ Engineering Roadmap

- [x] Abstract `UIComponent` class architecture base layouts
- [x] GPU-accelerated canvas-free CSS film grain implementation
- [x] Zero layout thrashing asynchronous lightning transitions
- [x] Dynamic external configuration data string text injection
- [ ] Web Audio tab visibility lifecycle suspension hooks (`visibilitychange`)
- [ ] Wind gust procedural synthesizer layer addition
- [ ] Developer keyboard layout direct short-keys mapping for simulation stress tests

---

## 📄 License

Open-source architecture layout. Free to clone, study, fork, modify, extend, and 


