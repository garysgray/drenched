// ── TextDisplay ───────────────────────────────────────────────
//
// Toggles between static glowing text and scrolling marquee.
// HUD buttons control the mode. Clicking the static text also
// switches to scroll mode for discoverability.
// Receives audio reference so it can play the click sound.
//
// Depends on: CONFIG (config.js)

class TextDisplay
{
  constructor(audio)
  {
    this.stage       = document.querySelector('.text-stage');
    this.audio       = audio;
    this.isScrolling = false;

    this._buildScrollEl();
    this._bindClicks();
  }

  _buildScrollEl()
  {
    this.scrollEl           = document.createElement('div');
    this.scrollEl.className = 'scroll-left';
    this.scrollEl.innerHTML = '<p>It was a Dark and Stormy Night!!!</p>';
    this.stage.appendChild(this.scrollEl);
  }

  // Helper to set mode and update button states in one place
  _setMode(scrolling)
  {
    this.isScrolling = scrolling;
    this.stage.classList.toggle('scrolling', scrolling);
    document.getElementById('text-mode-static').className = scrolling ? '' : 'active-speed';
    document.getElementById('text-mode-scroll').className = scrolling ? 'active-speed' : '';

    document.getElementById('scroll-speed-group').style.display   = scrolling ? 'flex'  : 'none';
    document.getElementById('scroll-speed-divider').style.display = scrolling ? 'block' : 'none';
  }

  _bindClicks()
  {
    // Clicking the static text switches to scroll mode
    document.getElementById('text-toggle').addEventListener('click', () =>
    {
      this.audio.playClick();
      this._setMode(true);
    });

    document.getElementById('text-mode-static').addEventListener('click', () =>
    {
      this.audio.playClick();
      this._setMode(false);
    });

    document.getElementById('text-mode-scroll').addEventListener('click', () =>
    {
      this.audio.playClick();
      this._setMode(true);
    });

    // Scroll speed slider
    const slider = document.getElementById('scroll-speed');
    const label  = document.getElementById('scroll-speed-val');

    slider.min   = CONFIG.scroll.minSpeedSecs;
    slider.max   = CONFIG.scroll.maxSpeedSecs;
    slider.value = CONFIG.scroll.defaultSpeedSecs;

    slider.addEventListener('input', () =>
    {
      const val = slider.value;
      label.textContent = `${val}s`;

      const p = document.querySelector('.scroll-left p');
      if (p) p.style.animationDuration = `${val}s`;
    });
  }
}