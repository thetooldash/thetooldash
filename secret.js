(function () {
  'use strict';

  var KEYWORD = 'bise';
  var KEY     = 'ttd_unlocked';
  var CHARS   = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$%&';

  /* ── Text Scramble ─────────────────────────────────────── */
  function scramble(el, text, ms) {
    var total = 30;
    var frame = 0;
    var tid = setInterval(function () {
      var p = frame / total;
      el.textContent = text.split('').map(function (ch, i) {
        return i < Math.floor(p * text.length)
          ? ch
          : CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }).join('');
      frame++;
      if (frame > total) {
        clearInterval(tid);
        el.textContent = text;
      }
    }, Math.round(ms / total));
  }

  /* ── Show all .nav-secret items ────────────────────────── */
  function showAll(animate) {
    var items = document.querySelectorAll('.nav-secret');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.removeAttribute('style');
      item.removeAttribute('aria-hidden');
      if (animate) {
        var a = item.querySelector('a');
        if (a) scramble(a, 'Péptidos', 900);
      }
    }
  }

  /* ── Helper ────────────────────────────────────────────── */
  function mk(cls) {
    var d = document.createElement('div');
    d.className = cls;
    return d;
  }

  /* ── Full animation sequence ───────────────────────────── */
  function unlock() {
    localStorage.setItem(KEY, '1');

    /* Phase 1 — Digital Glitch */
    var layerR = mk('glitch-layer glitch-r');
    var layerC = mk('glitch-layer glitch-c');
    document.body.classList.add('glitching');
    document.body.appendChild(layerR);
    document.body.appendChild(layerC);

    setTimeout(function () {
      document.body.classList.remove('glitching');
      layerR.remove();
      layerC.remove();

      /* Phase 2 — Red scan line */
      var scan  = mk('scan-line');
      document.body.appendChild(scan);

      var navEl = document.querySelector('.nav');
      var navH  = navEl ? navEl.offsetHeight : 56;
      var vh    = window.innerHeight;
      var dur   = 920;

      var anim = scan.animate(
        [{ top: '-4px' }, { top: (vh + 4) + 'px' }],
        { duration: dur, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = function () { scan.remove(); };

      /* Phase 3 — Reveal + Text Scramble when scan crosses nav */
      var revealAt = Math.round((navH / vh) * dur) + 55;
      setTimeout(function () { showAll(true); }, revealAt);

    }, 450);
  }

  /* ── Keyboard listener ─────────────────────────────────── */
  function init() {
    if (localStorage.getItem(KEY) === '1') {
      showAll(false);
      return;
    }

    var seq = '';
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
                t.tagName === 'SELECT' || t.isContentEditable)) {
        seq = '';
        return;
      }
      seq = (seq + e.key.toLowerCase()).slice(-KEYWORD.length);
      if (seq === KEYWORD) {
        seq = '';
        unlock();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
