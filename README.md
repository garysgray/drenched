![Game Splash](images/drenched.png)

# Rain Scene (HTML/CSS/JS)

A simple animated rain scene with adjustable intensity and color effects.
Built using plain HTML, CSS, and JavaScript—no frameworks.

---

## Features

* Three rain modes:

  * **Rain (Drizzle)** – light vertical rain
  * **Storm** – angled wind-driven rain
  * **Torrent** – heavy rain with reverse gust effects
* Dynamic lightning flashes
* Fog and atmosphere layers
* CRT-style scanlines + vignette
* Color controls for text (red, green, blue)

---

## Project Structure

```
project-folder/
│
├── index.html
├── style.css
├── script.js
└── images/
    ├── rain.png
    ├── rain_straight.png
    ├── rain_rev.png
    └── 832591.jpg
```

---

## Setup

1. Clone or download the repo
2. Make sure your folder structure matches the above
3. Open `index.html` in your browser

No build tools or install steps required.

---

## Important Notes

* The app depends on images located in the `images/` folder
* If you don’t see rain:

  * Check that the image files exist
  * Verify paths inside `style.css` match your folder structure

Example:

```css
background: url(../images/rain.png);
```

If your CSS file is in the root folder, this path may need to be:

```css
background: url(images/rain.png);
```

---

## Controls

### Text Color

* Red
* Green
* Blue

### Rain Intensity

* Rain (light)
* Storm (medium)
* Torrent (heavy)

---

## Tech Used

* HTML5
* CSS3 (animations, variables)
* Vanilla JavaScript

---

## Purpose

This project is a lightweight visual scene experiment focused on:

* Layered animation
* Atmospheric effects
* UI-controlled visual states

---

## License

Free to use, modify, and build on.
