# Rain — PM Assessment & V2.0 Roadmap

## Executive Summary

**Rain** (branded in README as *Dark & Stormy Night*) is a zero-dependency atmospheric experience: layered storm visuals, synthesized rain/thunder audio, and a customizable hero text display. It is architecturally mature for a V1 — modular classes, a central `CONFIG`, and clean separation between audio, visuals, HUD, and text.

**V1 verdict:** Strong *demo / ambient toy* with real craft in Web Audio synthesis and visual layering. Not yet a *product* — it lacks persistence, accessibility, user control (volume/mute), and the audio-visual sync that would make it feel truly alive.

**V2 opportunity:** Evolve from "open `index.html` and admire" into a **shareable ambient scene** people can personalize, leave running, and return to — while keeping the no-build, vanilla-JS identity.

---

## Product Positioning

| Dimension | Current (V1) | V2 Target |

|-----------|--------------|-----------|

| **Category** | Visual/audio demo | Ambient scene / focus backdrop |

| **Primary user** | Curious visitor, dev showcase | Creators, streamers, focus workers, game-site visitors |

| **Core loop** | Tweak controls → watch/listen | Set mood → hide HUD → stay immersed → return with settings intact |

| **Differentiator** | Fully synthesized audio (no assets), CRT horror aesthetic | Same, plus synced lightning, editable text, environments, shareable presets |

**Strategic question for V2:** Is this a standalone page on your game site, an embeddable widget, or a portfolio piece? That choice affects share links, embed API, and preset storage — but the task list below works for all three.

---

## V1.0 State Assessment

### What’s working well

1. **Architecture** — `Engine` wires subsystems cleanly; `CONFIG` centralizes tuning. Easy to extend without spaghetti.

2. **Audio quality** — Rain bandpass + layered thunder rumble is genuinely good. UI click feedback adds polish.

3. **Visual cohesion** — Rain layers, fog, vignette, scanlines, grain, and flickering text form a unified horror-CRT mood.

4. **Responsive HUD** — Mobile stacking at 640px is thoughtful; auto-hide + cursor hide supports immersion.

5. **Zero friction deploy** — No npm, no build. Ideal for static hosting on a game site.

### Gaps & risks

| Area | Issue | Severity |

|------|-------|----------|

| **Performance** | Film grain redraws full-screen `ImageData` every `requestAnimationFrame` — costly on mobile/low-end GPUs | High |

| **A/V sync** | Lightning is CSS-cycled (~5s fixed); thunder is JS-scheduled randomly. They feel unrelated | High |

| **User control** | No master volume, mute, or rain-only mode | High |

| **Persistence** | Settings reset on refresh — no `localStorage` or URL params | Medium |

| **Accessibility** | No `prefers-reduced-motion`, keyboard nav, ARIA labels, or focus management | Medium |

| **Content** | Hero text is hardcoded in HTML + `TextDisplay`; not user-editable | Medium |

| **Audio unlock UX** | `AudioContext` resumes on first `click` only — touch/keyboard paths are thin | Medium |

| **Wind** | Visual gust animation exists; no matching audio layer (README already flags this) | Medium |

| **Discoverability** | HUD auto-hides with no hint that controls exist; text-click → scroll is subtle | Low |

| **Docs drift** | README references `config.js` / `rain-audio.js`; actual files are `Config.js`, `RainAudio.js` | Low |

| **Code ownership** | `TextDisplay` owns scroll-speed HUD bindings; `HUD` owns color/intensity — split responsibility | Low |

### Technical health scorecard

| Criteria | Score (1–5) | Notes |

|----------|-------------|-------|

| Maintainability | 4 | Clear modules, good comments |

| Extensibility | 4 | CONFIG-driven; environment system is natural next step |

| Performance | 2 | Grain loop is the main bottleneck |

| Accessibility | 1 | Effectively none |

| Production readiness | 2.5 | Works, but missing volume, persistence, a11y |

| Delight / polish | 4 | Strong aesthetic and audio craft |

---

## User Personas & Jobs-to-be-Done

1. **The Visitor** — "I landed on the game site; give me 30 seconds of atmosphere."  

   *Needs:* Immediate impact, no setup, works on phone.

2. **The Focus Worker** — "I want rain + thunder as background while I work."  

   *Needs:* Mute thunder option, volume slider, settings that persist, reduced motion option.

3. **The Creator** — "I want my own phrase and color for a stream overlay or Discord status vibe."  

   *Needs:* Editable text, shareable URL with encoded settings, maybe fullscreen.

4. **The Developer (you)** — "I want to add ocean/forest environments without rewriting everything."  

   *Needs:* Config-driven environment system (already on README roadmap).

---

## V2.0 Success Metrics (suggested)

| Metric | Target |

|--------|--------|

| Time-to-immersion | User reaches preferred settings in &lt; 15s |

| Session length | Median &gt; 2 min (proxy for "actually using it") |

| Return rate | Settings restored on revisit (localStorage or URL) |

| Mobile usability | No jank on mid-tier phones (grain perf fix) |

| A/V believability | Lightning flash within ~200ms of thunder crack (subjective QA) |

---

## Prioritized V2.0 Task List

### P0 — Must ship (core product gaps)

| # | Task | Rationale | Effort |
I
|---|------|-----------|--------|

| 1 | **Master volume + mute toggle** | Ambient apps live or die on volume control; required for focus use case | S |

| 2 | **Sync lightning to thunder** | Replace fixed CSS `bolt` cycle with JS-triggered flash on `_strike()`; biggest perceived quality jump | M |

| 3 | **Persist settings via localStorage** | Intensity, color, text mode, scroll speed, volume — restore on load | S |

| 4 | **Film grain performance pass** | Throttle grain FPS, use smaller offscreen buffer scaled up, or CSS noise fallback; critical for mobile | M |

| 5 | **Broader AudioContext unlock** | Resume on `touchstart`, `keydown`, not just `click`; optional subtle "tap to enable audio" overlay | S |

### P1 — High value (differentiation & retention)

| # | Task | Rationale | Effort |

|---|------|-----------|--------|

| 6 | **Editable hero text** | Inline edit or HUD text field; unlocks creator/streamer persona | M |

| 7 | **Keyboard shortcuts** | `1/2/3` intensity, `R/G/B` color, `M` mute, `F` fullscreen, `H` toggle HUD | S |

| 8 | **Fullscreen button** | One-click immersion; pairs with auto-hide HUD | S |

| 9 | **Wind gust audio layer** | Match existing visual gust; intensity-scaled whoosh via filtered noise | M |

| 10 | **URL query params for presets** | `?intensity=fast&color=blue&text=...` — shareable scenes without backend | M |

| 11 | *`prefers-reduced-motion` support** | Disable grain rAF, reduce flicker, soften animations — also helps perf | S |

### P2 — Platform expansion (README roadmap + game-site fit)

| # | Task | Rationale | Effort |

|---|------|-----------|--------|

| 12 | **Config-driven environment system** | Abstract `CONFIG` into `environments: { rain, ocean, forest, ... }` with visuals + audio profiles | L |

| 13 | **Crossfade transitions between environments** | Smooth audio gain + CSS var interpolation over 1–2s | M |

| 14 | **Environment picker in HUD** | Tab or dropdown; first environment beyond "storm night" | M |

| 15 | **Thunder-only / rain-only modes** | Separate toggles for focus users who want rain without jumpscares | S |

| 16 | **First-visit micro-onboarding** | 3s tooltip: "Move mouse for controls · Click text to scroll" | S |

### P3 — Polish & production hardening

| # | Task | Rationale | Effort |

|---|------|-----------|--------|

| 17 | **Consolidate HUD event ownership** | Move scroll-speed bindings into `HUD`; `TextDisplay` emits mode changes only | S |

| 18 | **ARIA + keyboard focus for HUD** | `role="toolbar"`, `aria-pressed` on toggles, visible focus ring | S |

| 19 | **Page metadata / OG tags** | Title, description, `og:image` (drenched.png) for social sharing from game site | S |

| 20 | **README + file naming alignment** | Sync docs with actual `Config.js` naming; document V2 controls | S |

| 21 | **Intensity crossfade** | Smooth rain gain + CSS opacity transitions (partially exists; unify timing) | S |

| 22 | **Optional embed mode** | `?embed=1` hides chrome, starts muted until interaction — for iframes on game site | M |

| 23 | **PWA / installable ambient** | `manifest.json` + service worker for offline + "add to home screen" backdrop | M |

---

## Recommended V2.0 Phasing

### Phase 1 — "Believable Storm" (2–3 weeks)

P0 items **1–5** + P1 **#6 (editable text)** if time permits.

**Outcome:** Feels like one coherent storm, not parallel animations. Usable as a daily ambient tool.

### Phase 2 — "Personal & Shareable" (2 weeks)

P1 **#7–11**.

**Outcome:** Users customize, share links, control via keyboard, accessible on more devices.

### Phase 3 — "Environments" (3–4 weeks)

P2 **#12–16**.

**Outcome:** Rain becomes an *atmosphere engine*, not a single scene — aligns with README vision.

### Phase 4 — "Ship to game site" (1 week)

P3 **#17–23** as needed for your hosting context.

---

## Key Product Decisions (decide before building)

1. **Editable text — how far?** Single line only, or multi-line marquee? Character limit for layout safety?

2. **Environments — scope?** Rain scene perfected first, or parallel env stubs (ocean = blue palette + wave audio)?

3. **Share model?** URL params only (free, static) vs. saved presets (needs backend)?

4. **Game site integration?** Standalone page, iframe embed, or featured "ambient mode" entry from site nav?

5. **Build toolchain?** Stay zero-build forever, or add a minimal bundler for env JSON + cache busting at scale?

---

## Risks to Watch

- **Scope creep on environments** — the CONFIG abstraction is the right foundation; ship one new env end-to-end before building five stubs.

- **Performance regressions** — every new audio layer and animation competes with grain; profile on a real phone early.

- **Autoplay policy** — always assume muted start; never auto-play loud thunder before gesture.

- **Aesthetic drift** — new features (environment picker, text field) can clutter the minimal HUD; consider a "minimal mode" or settings panel that also auto-hides.

---

## Bottom Line

V1 is a **well-built atmospheric prototype** with unusually strong audio synthesis for a vanilla JS project. V2 should not chase features randomly — the highest ROI path is: **sync lightning to thunder → add volume/mute → fix grain perf → persist settings**. That quartet transforms it from a cool demo into something people actually leave open.

Everything else (environments, sharing, embed mode) builds naturally on the CONFIG-driven architecture you already have. The README roadmap is directionally correct; the prioritization above puts *believability and usability* ahead of *platform expansion*, which is the right call for a game-site ambient experience.