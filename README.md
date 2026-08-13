# Dark & Stormy Night — Atmospheric Environment Engine

![Game Splash](images/drenched.png)

An interactive, highly optimized, and modular atmospheric environment engine built with vanilla web technologies. Visual layers, dynamic configurations, and procedurally synthesized audio assets respond in perfect synchronization through an event-driven architectural layer.

No frameworks. No build tools. Completely production-locked and vanilla.

---

## 🌟 Architectural Features

- **Abstract Mediator & Component Architecture** — Built around a strict, object-oriented `UIComponent` base blueprint class, this architecture leverages native JavaScript private fields for encapsulation and maintainability across the codebase. The central `UIManager` acts as a fully abstract mediator, broadcasting state changes through `updateVisualState` to eliminate hardcoded component coupling. This design allows independent UI components such as `TextDisplay` and `HUD` to remain decoupled while still responding dynamically to system-wide events. The lifecycle of each component is managed with a `destroy` method, ensuring clean teardown of internal listeners and DOM references.

- **Data-Driven Asset Architecture** — The `Config.js` file serves as the centralized hub for all runtime constants and configurations, replacing scattered globals with a single `CONFIG` object. Key settings such as rain intensities, color themes, and audio parameters are deeply frozen with `Object.freeze` to prevent accidental mutations. A new `CONFIG.System` object consolidates mathematical constants such as `VOLUME_SCALE_FACTOR` and `MS_PER_SECOND`, ensuring consistency across subsystems such as `AudioManager` and `RainVisuals`. This architecture enables thematic changes without requiring changes throughout the application.

- **Hardware-Accelerated Composite Graphics** — Heavy visual effects such as full-screen film grain texture flickering and lightning flashes are offloaded from the JavaScript runtime and delegated to the browser's compositor. CSS keyframes and data-attribute selectors handle transitions without unnecessary layout work. This ensures smooth performance while preserving precise timing.

- **Procedurally Synthesized Audio** — The `AudioManager` uses the Web Audio API to generate persistent ambient rain loops, randomized rolling thunder, and acoustic click feedback entirely at runtime. Native private fields isolate internal states such as `#masterVolume` and `#loops`. The audio graph uses node pooling to improve performance, while automatic audio resumption handles browser autoplay restrictions. No external audio files are required.

- **Unified Master Scene Director** — The `EnvironmentController` orchestrates independent simulation scheduling clocks, ensuring synchronization between thunder acoustics, graphic power-grid surges, and text voltage stress. Each strike is calculated with precise delta-time management to account for frame timing and maintain alignment across subsystems. The event-driven architecture allows additional procedural effects to be added independently.

- **Responsive Controls & Interactivity** — The `HUD` manages the auto-hiding control panel, cursor suppression during idle states, and mouse and touch interactions. Native private fields provide encapsulated state management while lifecycle hooks ensure listeners and DOM references are properly cleaned up.

---

## 📂 Project Structure

```text
Rain/
│ 
├── index.html                   — Document structure, asset loading, and text containers
│ 
├── css/
│   └── style.css                — Layer positioning, transitions, and visual effects
│ 
├── js/
│   ├── Main.js                   — Entry point
│   ├── Config.js                 — Immutable configuration, weather presets, and story content
│   ├── UIComponent.js            — Abstract base component class
│   ├── UIManager.js              — Event routing and state coordination
│   ├── EnvironmentController.js  — Scene timing and cross-system synchronization
│   ├── AudioManager.js           — Web Audio mixer, noise generation, and node pools
│   ├── SoundRecipes.js           — Sounds ready to play by AudioManager
│   ├── RainVisuals.js            — Rain effects, lightning, colors, and film grain
│   ├── TextDisplay.js            — Text rendering and typography controls
│   ├── Hud.js                    — Dashboard controls and auto-hide behavior
│   └── Engine.js                 — Application initialization and system coordination
│ 
└── images/
```

---

## 🛠️ Setup & Lifecycle Execution

1. Clone or download the repository.
2. Verify that the project structure matches the structure shown above.
3. Open `index.html` in a modern web browser.

---

## 🎛️ Interactive Controls

| Control Group | Active Functional Targets | Interface Engine Routing Mechanics |
|---|---|---|
| **Text Color** | Shifting palettes | Updates `--text-color` root bounds through `updateVisualState` |
| **Rain Intensity** | Weather intensity profiles | Modulates background sound loops and weather timer profiles |
| **Text Mode** | Layout rendering profiles | CSS visibility toggling between Static Frame and Scroll Marquee |
| **Volume Configuration** | Logarithmic audio slider and Mute button | Direct sound mixer gain node manipulation |

The interface dashboard automatically slides away and hides the cursor after 3 seconds of user idle time. Move the mouse, adjust a control, or interact with the layout to wake up the system.

---

## ⚡ How the Synthesized Engine Works

Everything is mathematically calculated and mapped natively inside the browser to maximize resource efficiency.

- **Persistent Ambient Generation** — A localized white-noise audio generator creates a persistent buffer channel. The audio passes through a bandpass filter and handles volume changes asynchronously.

- **The Non-Blocking Strike Sequence** — When the environment scheduling timer triggers, the system initiates three actions simultaneously:

  1. **Acoustic Shockwaves** — Schedules a high-gain noise crack followed by stacked, time-shifted low-frequency rolling rumbles that pass through lowpass filter graphs to simulate distance and depth.

  2. **Asynchronous Visual Flashes** — JavaScript applies attack and decay CSS variables to the empty `#lightning` container and changes its `data-flash` state. The browser handles the opacity transition through the compositor.

  3. **Typographic Voltage Stress** — The hero text uses the same state attributes to increase brightness and modify text shadows, creating the appearance of electrical stress.

---

## 🛠️ Technology Stack

- **HTML5 Core Semantics** — Structural DOM wrappers, asset loading, and data attributes
- **CSS3 Compositor Architecture** — Dynamic variables, transitions, transforms, and visual effects
- **Vanilla Modern ES6+ JavaScript** — Web Audio API nodes, callbacks, Map data structures, and object nesting
- **Web Audio API** — Procedural sound synthesis, audio mixing, and dynamic effects

---

## 🗺️ Engineering Roadmap

- [x] Abstract `UIComponent` class architecture base layouts
- [x] GPU-accelerated canvas-free CSS film grain implementation
- [x] Zero layout thrashing asynchronous lightning transitions
- [x] Dynamic external configuration data string text injection
- [ ] More UI for User settings
- [ ] Wind gust procedural synthesizer layer addition
- [ ] Developer keyboard layout direct short-keys mapping for simulation stress tests

---

## 📄 License

Open-source architecture layout. Free to clone, study, fork, modify, extend, and redistribute.
